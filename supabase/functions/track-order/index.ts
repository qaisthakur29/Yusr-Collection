// Public order tracking lookup.
//
// The `orders` table only exposes an INSERT policy to anon/authenticated, so the
// storefront cannot read an order back directly. This function runs with the
// service role key and returns a minimal, non-sensitive subset (status + the
// courier tracking link) for a single order number.
//
// Customers look orders up with the short, human-friendly `order_number`
// (e.g. YUSR-123456) that they receive over WhatsApp. No customer PII (name,
// phone, email, address) is ever returned here.

import { createClient } from 'npm:@supabase/supabase-js@2';

// Origins that must always work, so a stale ALLOWED_ORIGINS secret or a domain
// change can never silently break order tracking.
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

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
//
// A public lookup endpoint is an obvious target for enumeration and scraping,
// which burns Supabase invocations. This is a best-effort, per-instance limiter:
// an Edge Function instance keeps its module scope alive between requests, so
// this Map survives long enough to blunt a single client's burst — but it is NOT
// a global quota. Supabase may serve requests from several instances, and a cold
// start resets the counters. For a hard, cluster-wide limit, back this with a
// shared store (e.g. Upstash Redis) or a Postgres counter table.
const RATE_LIMIT_MAX = 5; // requests...
const RATE_LIMIT_WINDOW_MS = 60_000; // ...per IP per minute.

const hits = new Map<string, { count: number; resetAt: number }>();

/** Client IP as reported by the platform's proxy, best-effort. */
function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? req.headers.get('cf-connecting-ip') ?? 'unknown';
}

/** Consumes one unit of the caller's quota. False once the window is exhausted. */
function allowRequest(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now >= entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    // Opportunistic sweep so the Map cannot grow without bound across many IPs.
    if (hits.size > 1000) {
      for (const [key, value] of hits) {
        if (now >= value.resetAt) hits.delete(key);
      }
    }
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, headers);

  // Throttle before touching the database or parsing the body so a flood costs
  // as little as possible.
  const ip = clientIp(req);
  if (!allowRequest(ip)) {
    return json(
      { error: 'Too many requests. Please wait a minute and try again.' },
      429,
      { ...headers, 'Retry-After': '60' },
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      console.error('track-order: missing server configuration');
      return json({ error: 'Server configuration error' }, 500, headers);
    }

    const body = await req.json().catch(() => null);
    // Order numbers are stored upper-case (YUSR-123456); normalise the input so
    // a lowercase entry from the customer still resolves.
    const orderNumber = typeof body?.order_number === 'string' ? body.order_number.trim().toUpperCase() : '';

    if (!orderNumber || orderNumber.length > 50) {
      return json({ error: 'Order not found' }, 404, headers);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await admin
      .from('orders')
      .select('id, order_number, status, tracking_url, created_at')
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (error) {
      console.error('track-order: lookup failed', error.message);
      return json({ error: 'Could not load order' }, 500, headers);
    }
    if (!data) {
      return json({ error: 'Order not found' }, 404, headers);
    }

    return json({ order: data }, 200, headers);
  } catch (err) {
    console.error('track-order: unexpected error', err);
    return json({ error: 'Unexpected error' }, 500, headers);
  }
});
