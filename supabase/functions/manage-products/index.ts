// Admin product management (CREATE / UPDATE / DELETE).
//
// Authorization is Supabase Auth based: the caller must present a valid access
// token whose user is an admin. There is no shared password any more, so nothing
// secret is shipped to the browser.
//
// Only whitelisted columns are ever written, and every value is validated, so a
// caller cannot inject arbitrary fields into the products table.

import { createClient } from 'npm:@supabase/supabase-js@2';

const MAX_TEXT = 5000;

const TEXT_FIELDS = [
  'slug',
  'name',
  'subname',
  'image',
  'description',
  'category',
  'fabric',
  'fit',
  'tag',
  'badge',
  'size_guide_url',
] as const;

const NUMBER_FIELDS = ['price', 'mrp'] as const;
const INTEGER_FIELDS = ['sort_order'] as const;
const ARRAY_FIELDS = ['gallery', 'sizes', 'details'] as const;

// Headers the Supabase JS SDK may send on an `functions.invoke` call. Kept in
// sync with @supabase/supabase-js/cors — a missing entry makes the browser fail
// the preflight and the call rejects with "Failed to send a request".
const ALLOW_HEADERS =
  'authorization, x-client-info, apikey, content-type, x-retry-count, traceparent, tracestate, baggage';

// This function is authorised by a Bearer JWT (see authorizeAdmin), not by CORS.
// Browsers never attach that token automatically, so reflecting the caller's
// Origin cannot be used for CSRF. Reflecting is also required because the admin
// panel is served from several origins (localhost ports, Vercel preview URLs,
// production): echoing a *different* origin makes the browser silently drop the
// request, which surfaces only as the misleading "Failed to send a request to
// the Edge Function" instead of a readable authorization error.
function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';

  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': ALLOW_HEADERS,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

type AuthResult =
  | { ok: true; admin: ReturnType<typeof createClient> }
  | { ok: false; status: number; error: string };

// Validates the caller's JWT against Supabase Auth and confirms admin rights.
async function authorizeAdmin(req: Request): Promise<AuthResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    console.error('manage-products: missing server configuration');
    return { ok: false, status: 500, error: 'Server configuration error' };
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!jwt) return { ok: false, status: 401, error: 'Unauthorized' };

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin.auth.getUser(jwt);
  if (error || !data?.user) return { ok: false, status: 401, error: 'Unauthorized' };

  // app_metadata only: it is server-controlled. user_metadata can be written by
  // the user themselves, so trusting it here would be a privilege escalation.
  const appRole = (data.user.app_metadata as Record<string, unknown> | null)?.role;
  const allowlist = (Deno.env.get('ADMIN_EMAILS') ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin =
    appRole === 'admin' ||
    (!!data.user.email && allowlist.includes(data.user.email.toLowerCase()));

  if (!isAdmin) {
    console.error('manage-products: non-admin user rejected', data.user.id);
    return { ok: false, status: 403, error: 'Forbidden' };
  }

  return { ok: true, admin };
}

// Returns null when anything is malformed, so bad input is rejected wholesale
// rather than partially applied.
function sanitizeProduct(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const src = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const field of TEXT_FIELDS) {
    if (!(field in src)) continue;
    const value = src[field];
    if (value === null) {
      out[field] = null;
      continue;
    }
    if (typeof value !== 'string') return null;
    out[field] = value.trim().slice(0, MAX_TEXT);
  }

  for (const field of NUMBER_FIELDS) {
    if (!(field in src)) continue;
    const value = Number(src[field]);
    if (!Number.isFinite(value) || value < 0) return null;
    out[field] = value;
  }

  // Display position: whole numbers only, so the admin list stays predictable.
  for (const field of INTEGER_FIELDS) {
    if (!(field in src)) continue;
    const value = Number(src[field]);
    if (!Number.isInteger(value) || value < 0) return null;
    out[field] = value;
  }

  for (const field of ARRAY_FIELDS) {
    if (!(field in src)) continue;
    const value = src[field];
    if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) return null;
    out[field] = value.map((item) => (item as string).trim()).filter(Boolean);
  }

  return out;
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, headers);

  try {
    const auth = await authorizeAdmin(req);
    if (!auth.ok) return json({ error: auth.error }, auth.status, headers);

    const body = await req.json().catch(() => null);
    const action = typeof body?.action === 'string' ? body.action : '';
    const id = typeof body?.id === 'string' && body.id.trim() ? body.id.trim() : null;

    const admin = auth.admin;

    if (action === 'create') {
      const payload = sanitizeProduct(body?.product);
      if (!payload) return json({ error: 'Invalid product payload' }, 400, headers);

      const slug = typeof payload.slug === 'string' ? payload.slug : '';
      const name = typeof payload.name === 'string' ? payload.name : '';
      if (!slug || !name) {
        return json({ error: 'Product slug and name are required' }, 400, headers);
      }

      // Mirror the existing app behaviour: id is the slug.
      const { data, error } = await admin
        .from('products')
        .insert({ ...payload, id: slug })
        .select('id')
        .single();

      if (error) {
        if (error.code === '23505') {
          return json({ error: 'A product with this slug already exists' }, 409, headers);
        }
        console.error('manage-products: insert failed', error.message);
        return json({ error: 'Could not create product' }, 500, headers);
      }

      return json({ success: true, id: data.id }, 200, headers);
    }

    if (action === 'update') {
      if (!id) return json({ error: 'Product id is required' }, 400, headers);

      const payload = sanitizeProduct(body?.product);
      if (!payload) return json({ error: 'Invalid product payload' }, 400, headers);
      if (Object.keys(payload).length === 0) {
        return json({ error: 'No valid fields to update' }, 400, headers);
      }

      const { error } = await admin.from('products').update(payload).eq('id', id);
      if (error) {
        if (error.code === '23505') {
          return json({ error: 'A product with this slug already exists' }, 409, headers);
        }
        console.error('manage-products: update failed', error.message);
        return json({ error: 'Could not update product' }, 500, headers);
      }

      return json({ success: true }, 200, headers);
    }

    if (action === 'delete') {
      if (!id) return json({ error: 'Product id is required' }, 400, headers);

      const { error } = await admin.from('products').delete().eq('id', id);
      if (error) {
        console.error('manage-products: delete failed', error.message);
        return json({ error: 'Could not delete product' }, 500, headers);
      }

      return json({ success: true }, 200, headers);
    }

    return json({ error: 'Unknown action' }, 400, headers);
  } catch (err) {
    console.error('manage-products: unexpected error', err);
    return json({ error: 'Unexpected error' }, 500, headers);
  }
});
