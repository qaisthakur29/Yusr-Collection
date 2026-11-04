// Creates a Razorpay order. Input `amount` is in RUPEES (the frontend sends the
// cart total). Never trust the client for anything beyond the amount, and even
// that is validated + bounded here.

// Origins that must always work, so a stale ALLOWED_ORIGINS secret or a domain
// change can never silently break checkout the way the old fallback did.
// The vercel.app entry is kept during the move to the custom domain.
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

const MIN_RUPEES = 1;
const MAX_RUPEES = 100000;

Deno.serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, headers);

  try {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) {
      console.error('create-razorpay-order: missing server configuration');
      return json({ error: 'Server configuration error' }, 500, headers);
    }

    const body = await req.json().catch(() => null);
    const amount = Number(body?.amount);

    // Reject NaN, floats, negatives, zero and absurd values.
    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < MIN_RUPEES) {
      return json({ error: 'Invalid amount', min_amount: MIN_RUPEES }, 400, headers);
    }
    if (amount > MAX_RUPEES) {
      return json({ error: 'Amount exceeds maximum allowed', max_amount: MAX_RUPEES }, 400, headers);
    }

    const amountInPaise = amount * 100;

    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: { source: 'yusr-collection-web' },
      }),
    });

    if (!rzpRes.ok) {
      const detail = await rzpRes.text().catch(() => '');
      console.error('create-razorpay-order: razorpay rejected request', rzpRes.status, detail);
      return json({ error: 'Could not initiate payment' }, 502, headers);
    }

    const data = await rzpRes.json();
    if (!data?.id || typeof data?.amount !== 'number') {
      console.error('create-razorpay-order: unexpected razorpay response');
      return json({ error: 'Could not initiate payment' }, 502, headers);
    }

    return json({ order_id: data.id, amount: data.amount, currency: data.currency }, 200, headers);
  } catch (err) {
    console.error('create-razorpay-order: unexpected error', err);
    return json({ error: 'Unexpected error' }, 500, headers);
  }
});
