// Cleans up an abandoned checkout.
//
// create-razorpay-order records a 'Pending' order before the payment modal
// opens, so a customer who cancels Razorpay leaves that row behind forever. The
// storefront calls this function from Razorpay's `modal.ondismiss` to remove it.
//
// SAFETY: the delete is scoped to BOTH the Razorpay order id AND status
// 'Pending'. A paid order can therefore never be removed (verify-razorpay-payment
// flips the status to 'Paid'), and COD orders are never touched — they also
// start as 'Pending' but carry no `razorpay_order_id`, so the id filter excludes
// them by construction.

import { createClient } from 'npm:@supabase/supabase-js@2';

// Origins that must always work, so a stale ALLOWED_ORIGINS secret or a domain
// change can never silently break checkout cleanup. The vercel.app entry is kept
// during the move to the custom domain.
const ALWAYS_ALLOWED_ORIGINS = [
  'https://yusrcollection.store',
  'https://www.yusrcollection.store',
  'https://yusr-collection-hj48.vercel.app',
  'http://localhost:3000',
];

const ALLOW_HEADERS = 'authorization, x-client-info, apikey, content-type';

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const configured = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Unset or an explicit '*' means "accept whatever the caller sent".
  const reflectAny = configured.length === 0 || configured.includes('*');
  const allowed = new Set([...ALWAYS_ALLOWED_ORIGINS, ...configured]);

  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': ALLOW_HEADERS,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };

  // Always echo the caller's own origin. Echoing a fixed fallback origin is
  // exactly what made preflight pass while the real request was blocked.
  if (reflectAny || allowed.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin || '*';
  }

  return headers;
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

// Razorpay order ids are server-generated and always look like `order_XXXXXXXX`.
// Rejecting anything else keeps arbitrary strings away from the query.
const RAZORPAY_ORDER_ID = /^order_[A-Za-z0-9]{6,64}$/;

Deno.serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, headers);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      console.error('delete-pending-order: missing server configuration');
      return json({ error: 'Server configuration error' }, 500, headers);
    }

    const body = await req.json().catch(() => null);
    const orderId =
      typeof body?.razorpay_order_id === 'string' ? body.razorpay_order_id.trim() : '';

    if (!RAZORPAY_ORDER_ID.test(orderId)) {
      return json({ error: 'Invalid request' }, 400, headers);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Both filters are required: only an unpaid order belonging to this exact
    // Razorpay order may be deleted.
    const { data, error } = await admin
      .from('orders')
      .delete()
      .eq('razorpay_order_id', orderId)
      .eq('status', 'Pending')
      .select('id');

    if (error) {
      console.error('delete-pending-order: delete failed', error.message);
      return json({ error: 'Could not clean up the order' }, 500, headers);
    }

    // Nothing matched (already paid, already cleaned up, or a COD order) is a
    // success: the caller only wants the orphan gone, and it is.
    return json({ deleted: data?.length ?? 0 }, 200, headers);
  } catch (err) {
    console.error('delete-pending-order: unexpected error', err);
    return json({ error: 'Unexpected error' }, 500, headers);
  }
});
