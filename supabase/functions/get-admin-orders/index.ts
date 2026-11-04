// Admin order management (list / dispatch / delete).
//
// Authorization is Supabase Auth based: the caller must present a valid access
// token whose user is an admin. There is no shared password any more, so nothing
// secret is shipped to the browser.

import { createClient } from 'npm:@supabase/supabase-js@2';

// Origins that must always work, so a stale ALLOWED_ORIGINS secret or a Vercel
// domain change can never silently break the admin panel the way it once did.
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

type AuthResult =
  | { ok: true; admin: ReturnType<typeof createClient> }
  | { ok: false; status: number; error: string };

// Validates the caller's JWT against Supabase Auth and confirms admin rights.
async function authorizeAdmin(req: Request): Promise<AuthResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    console.error('get-admin-orders: missing server configuration');
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
    console.error('get-admin-orders: non-admin user rejected', data.user.id);
    return { ok: false, status: 403, error: 'Forbidden' };
  }

  return { ok: true, admin };
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, headers);

  try {
    const auth = await authorizeAdmin(req);
    if (!auth.ok) return json({ error: auth.error }, auth.status, headers);

    const body = await req.json().catch(() => null);
    const action = typeof body?.action === 'string' ? body.action : 'list';

    if (action === 'list') {
      const { data, error } = await auth.admin
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('get-admin-orders: list failed', error.message);
        return json({ error: 'Could not load orders' }, 500, headers);
      }
      return json({ orders: data ?? [] }, 200, headers);
    }

    const id = typeof body?.id === 'string' ? body.id : null;
    if (!id) return json({ error: 'Invalid request' }, 400, headers);

    if (action === 'dispatch') {
      const { error } = await auth.admin
        .from('orders')
        .update({ status: 'Dispatched' })
        .eq('id', id);
      if (error) {
        console.error('get-admin-orders: dispatch failed', error.message);
        return json({ error: 'Could not update order' }, 500, headers);
      }
      return json({ success: true }, 200, headers);
    }

    if (action === 'delete') {
      const { error } = await auth.admin.from('orders').delete().eq('id', id);
      if (error) {
        console.error('get-admin-orders: delete failed', error.message);
        return json({ error: 'Could not delete order' }, 500, headers);
      }
      return json({ success: true }, 200, headers);
    }

    return json({ error: 'Unknown action' }, 400, headers);
  } catch (err) {
    console.error('get-admin-orders: unexpected error', err);
    return json({ error: 'Unexpected error' }, 500, headers);
  }
});
