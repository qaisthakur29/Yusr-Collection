// Verifies a Razorpay payment (HMAC-SHA256), confirms the amount Razorpay
// captured equals the expected total recorded on the Pending order, and only
// then marks that order 'Paid' using the service role key.
//
// The browser never sees the secret, never chooses the amount, and never decides
// the status.

import { createClient } from 'npm:@supabase/supabase-js@2';

// Origins that must always work, so a stale ALLOWED_ORIGINS secret or a domain
// change can never silently break payment verification the way the old fallback
// did. The vercel.app entry is kept during the move to the custom domain.
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

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Constant-time comparison to avoid leaking signature bytes via timing.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, headers);

  try {
    const secret = Deno.env.get('RAZORPAY_KEY_SECRET');
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!secret || !keyId || !serviceKey || !supabaseUrl) {
      console.error('verify-razorpay-payment: missing server configuration');
      return json({ error: 'Server configuration error' }, 500, headers);
    }

    const body = await req.json().catch(() => null);
    const orderId = body?.razorpay_order_id;
    const paymentId = body?.razorpay_payment_id;
    const signature = body?.razorpay_signature;
    if (typeof orderId !== 'string' || typeof paymentId !== 'string' || typeof signature !== 'string') {
      return json({ error: 'Invalid request' }, 400, headers);
    }

    // Step 1: verify the HMAC signature Razorpay sent back to the browser.
    const expected = await hmacSha256Hex(secret, `${orderId}|${paymentId}`);
    if (!timingSafeEqual(expected, signature)) {
      console.error('verify-razorpay-payment: signature mismatch', { orderId, paymentId });
      return json({ error: 'Payment verification failed' }, 400, headers);
    }

    // Step 2: ask Razorpay directly whether this payment settled, and confirm it
    // belongs to the order we are about to mark paid.
    const payRes = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
      { headers: { Authorization: `Basic ${btoa(`${keyId}:${secret}`)}` } },
    );
    if (!payRes.ok) {
      console.error('verify-razorpay-payment: razorpay lookup failed', payRes.status);
      return json({ error: 'Payment verification failed' }, 400, headers);
    }
    const payment = await payRes.json();

    const settled = payment?.status === 'captured' || payment?.status === 'authorized';
    if (!settled || payment?.order_id !== orderId) {
      console.error('verify-razorpay-payment: payment not settled', payment?.status);
      return json({ error: 'Payment not completed' }, 400, headers);
    }

    const amountPaise = Number(payment?.amount);
    if (!Number.isInteger(amountPaise) || amountPaise < 100) {
      return json({ error: 'Payment amount invalid' }, 400, headers);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Step 3: the Pending order create-razorpay-order wrote for this Razorpay
    // order. Its `total_amount` is what the customer was expected to pay.
    const { data: pending, error: lookupError } = await admin
      .from('orders')
      .select('id, order_number, status, total_amount')
      .eq('razorpay_order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      console.error('verify-razorpay-payment: order lookup failed', lookupError.message);
      return json({ error: 'Could not verify order' }, 500, headers);
    }
    if (!pending) {
      console.error('verify-razorpay-payment: no order for razorpay order', orderId);
      return json({ error: 'Order not found' }, 404, headers);
    }

    // Already processed (browser retry / double submit): report success instead
    // of trying to write the same payment id twice.
    if (pending.status === 'Paid') {
      return json(
        { success: true, order_id: pending.id, order_number: pending.order_number ?? null },
        200,
        headers,
      );
    }

    // Step 4: the captured amount MUST equal the expected total. A mismatch means
    // the order was tampered with, so it is never marked 'Paid'.
    const expectedPaise = Math.round(Number(pending.total_amount) * 100);
    if (!Number.isFinite(expectedPaise) || amountPaise !== expectedPaise) {
      console.error('verify-razorpay-payment: amount mismatch', {
        orderId,
        paymentId,
        amountPaise,
        expectedPaise,
      });
      return json({ error: 'Payment amount does not match the order' }, 400, headers);
    }

    // Step 5: persist the payment on the order (service role bypasses RLS).
    const { data: updated, error: updateError } = await admin
      .from('orders')
      .update({ status: 'Paid', razorpay_payment_id: paymentId })
      .eq('id', pending.id)
      .select('id, order_number');

    if (updateError) {
      // The unique index on razorpay_payment_id means this payment is already
      // recorded; treat it as success rather than a 500.
      if (updateError.code === '23505') {
        return json(
          { success: true, order_id: pending.id, order_number: pending.order_number ?? null },
          200,
          headers,
        );
      }
      console.error('verify-razorpay-payment: update failed', updateError.message);
      return json({ error: 'Could not record order' }, 500, headers);
    }

    // `.update()` reports success even when it matched zero rows; fail loudly.
    if (!updated || updated.length === 0) {
      console.error('verify-razorpay-payment: update matched no order', pending.id);
      return json({ error: 'Order not found' }, 404, headers);
    }

    return json(
      { success: true, order_id: updated[0].id, order_number: updated[0].order_number ?? null },
      200,
      headers,
    );
  } catch (err) {
    console.error('verify-razorpay-payment: unexpected error', err);
    return json({ error: 'Unexpected error' }, 500, headers);
  }
});
