// Verifies a Razorpay payment signature (HMAC-SHA256) and, only on success,
// writes the order as 'Paid' using the service role key.
//
// The browser never sees the secret and never decides the status or the amount.

import { createClient } from 'npm:@supabase/supabase-js@2';

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') ?? '*')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return {
    'Access-Control-Allow-Origin': allowed.includes('*')
      ? origin || '*'
      : allowed.includes(origin)
        ? origin
        : allowed[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
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

function clean(value: unknown, max: number): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;
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

    // Step 2: confirm with Razorpay that the payment really settled, and derive
    // the authoritative amount from Razorpay rather than trusting the client.
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

    // Step 3: persist the order with the service role key (bypasses RLS by design).
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: order, error: insertError } = await admin
      .from('orders')
      .insert({
        customer_name: clean(body?.customer_name, 120),
        phone: clean(body?.phone, 20),
        email: clean(body?.email, 200),
        address: clean(body?.address, 500),
        total_amount: Math.round(amountPaise / 100),
        status: 'Paid',
        // This function only ever handles prepaid payments, so the method is set
        // here rather than trusted from the client.
        payment_method: 'Prepaid',
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
      })
      .select('id')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return json({ error: 'This payment has already been recorded' }, 409, headers);
      }
      console.error('verify-razorpay-payment: insert failed', insertError.message);
      return json({ error: 'Could not record order' }, 500, headers);
    }

    return json({ success: true, order_id: order.id }, 200, headers);
  } catch (err) {
    console.error('verify-razorpay-payment: unexpected error', err);
    return json({ error: 'Unexpected error' }, 500, headers);
  }
});
