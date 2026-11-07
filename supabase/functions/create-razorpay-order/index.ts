// Creates a Razorpay order and records the matching 'Pending' order row.
//
// SECURITY: the payable amount is computed here, from the live catalogue prices
// in the `products` table. The browser only sends product ids and quantities, so
// a tampered client cannot make Razorpay charge less than the catalogue price of
// what it is ordering. The pending row stores that expected total, and
// verify-razorpay-payment refuses to mark the order 'Paid' unless the amount
// Razorpay actually captured matches it.

import { createClient } from 'npm:@supabase/supabase-js@2';

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
// Keeps one request from fanning out into an unbounded price lookup.
const MAX_DISTINCT_ITEMS = 20;
const MAX_QTY_PER_ITEM = 10;
// Mirrors the storefront's prepaid incentive. Kept server-side on purpose: it is
// part of the price and must not be editable from the browser.
const PREPAID_DISCOUNT_RUPEES = 50;

interface CartItem {
  id: string;
  quantity: number;
}

/** Validates the client cart, or returns null when it is malformed. */
function parseItems(value: unknown): CartItem[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_DISTINCT_ITEMS) {
    return null;
  }

  const items: CartItem[] = [];
  for (const raw of value) {
    const entry = raw as { id?: unknown; quantity?: unknown } | null;
    const id = typeof entry?.id === 'string' ? entry.id.trim() : '';
    const quantity = Number(entry?.quantity);

    if (!id || id.length > 64) return null;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY_PER_ITEM) return null;

    items.push({ id, quantity });
  }
  return items;
}

function clean(value: unknown, max: number): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;
}

const buildOrderNumber = () => `YUSR-${Math.floor(100000 + Math.random() * 900000)}`;

Deno.serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, headers);

  try {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!keyId || !keySecret || !serviceKey || !supabaseUrl) {
      console.error('create-razorpay-order: missing server configuration');
      return json({ error: 'Server configuration error' }, 500, headers);
    }

    const body = await req.json().catch(() => null);

    const items = parseItems(body?.items);
    if (!items) return json({ error: 'Invalid cart' }, 400, headers);

    // The orders table requires these, and fulfilment needs them, so reject up
    // front rather than half-create an order the customer can then pay for.
    const customerName = clean(body?.customer_name, 120);
    const phone = clean(body?.phone, 20);
    const address = clean(body?.address, 500);
    if (!customerName || !phone || !address) {
      return json({ error: 'Missing customer details' }, 400, headers);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Prices come from the catalogue, never from the request.
    const ids = [...new Set(items.map((item) => item.id))];
    const { data: rows, error: priceError } = await admin
      .from('products')
      .select('id, price')
      .in('id', ids);

    if (priceError) {
      console.error('create-razorpay-order: price lookup failed', priceError.message);
      return json({ error: 'Could not load the cart' }, 500, headers);
    }

    const priceById = new Map<string, number>(
      (rows ?? []).map((row) => [row.id as string, Number(row.price)]),
    );
    // An unknown id means the cart references a product that no longer exists.
    // Refuse rather than silently charge for a partial basket.
    if (priceById.size !== ids.length) {
      return json({ error: 'One or more items are no longer available' }, 400, headers);
    }

    let itemsTotal = 0;
    for (const item of items) {
      const price = priceById.get(item.id);
      if (!Number.isFinite(price) || (price as number) <= 0) {
        return json({ error: 'Invalid item price' }, 400, headers);
      }
      itemsTotal += Math.round(price as number) * item.quantity;
    }

    const amountRupees = Math.max(0, itemsTotal - PREPAID_DISCOUNT_RUPEES);
    if (amountRupees < MIN_RUPEES) {
      return json({ error: 'Invalid amount', min_amount: MIN_RUPEES }, 400, headers);
    }
    if (amountRupees > MAX_RUPEES) {
      return json({ error: 'Amount exceeds maximum allowed', max_amount: MAX_RUPEES }, 400, headers);
    }

    // Razorpay works in paise.
    const amountInPaise = amountRupees * 100;

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

    // Record what the customer is expected to pay, keyed to the Razorpay order
    // id. Nothing has been charged yet, so a failure here is safe to surface:
    // the storefront never opens the payment modal unless this call succeeds.
    const insertPending = (orderNumber: string) =>
      admin
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: customerName,
          phone,
          email: clean(body?.email, 200),
          address,
          total_amount: amountRupees,
          status: 'Pending',
          payment_method: 'Prepaid',
          razorpay_order_id: data.id,
        })
        .select('order_number')
        .single();

    let { data: pending, error: insertError } = await insertPending(buildOrderNumber());

    // A random 6-digit display number can theoretically collide with an existing
    // one. Retry with a fresh number rather than fail a customer who is about to
    // pay.
    if (insertError?.message.includes('order_number')) {
      ({ data: pending, error: insertError } = await insertPending(buildOrderNumber()));
    }

    if (insertError) {
      console.error('create-razorpay-order: could not record pending order', insertError.message);
      return json({ error: 'Could not start the payment. Please try again.' }, 500, headers);
    }

    return json(
      {
        order_id: data.id,
        amount: data.amount,
        currency: data.currency,
        order_number: pending?.order_number ?? null,
      },
      200,
      headers,
    );
  } catch (err) {
    console.error('create-razorpay-order: unexpected error', err);
    return json({ error: 'Unexpected error' }, 500, headers);
  }
});
