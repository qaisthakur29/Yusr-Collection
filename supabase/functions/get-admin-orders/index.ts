// Admin order management (list / dispatch / delete).
//
// Authorization is Supabase Auth based: the caller must present a valid access
// token whose user is an admin. There is no shared password any more, so nothing
// secret is shipped to the browser.

import { createClient } from 'npm:@supabase/supabase-js@2';

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') ?? '*')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (allowed.includes('*')) {
    console.warn('get-admin-orders: ALLOWED_ORIGINS is not set - allowing any origin');
  }

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
