import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'METHOD_NOT_ALLOWED' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const publishableKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
  const secretKey = Deno.env.get('SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !publishableKey || !secretKey) return json({ error: 'SERVER_NOT_CONFIGURED' }, 500);

  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return json({ error: 'AUTH_REQUIRED' }, 401);

  const authClient = createClient(url, publishableKey, { auth: { persistSession: false } });
  const adminClient = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: callerData, error: callerError } = await authClient.auth.getUser(token);
  if (callerError || !callerData.user) return json({ error: 'INVALID_SESSION' }, 401);

  const { data: callerProfile, error: profileError } = await adminClient
    .from('profiles').select('role,is_active').eq('id', callerData.user.id).single();
  if (profileError || callerProfile?.role !== 'admin' || !callerProfile.is_active) {
    return json({ error: 'ADMIN_REQUIRED' }, 403);
  }

  let payload: { action?: string; userId?: string };
  try { payload = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  const action = payload.action;
  const userId = payload.userId || '';
  if (!['activate', 'deactivate', 'delete'].includes(action || '') || !/^[0-9a-f-]{36}$/i.test(userId)) {
    return json({ error: 'INVALID_REQUEST' }, 400);
  }
  if (userId === callerData.user.id) return json({ error: 'CANNOT_MANAGE_SELF' }, 409);
  const { data: targetProfile, error: targetError } = await adminClient
    .from('profiles').select('role').eq('id', userId).single();
  if (targetError || !targetProfile) return json({ error: 'USER_NOT_FOUND' }, 404);
  if (targetProfile.role === 'admin') return json({ error: 'CANNOT_MANAGE_ADMIN' }, 409);

  if (action === 'deactivate') {
    const { error: deactivateError } = await adminClient.from('profiles').update({ is_active: false }).eq('id', userId);
    if (deactivateError) return json({ error: deactivateError.message }, 500);
    const { error: banError } = await adminClient.auth.admin.updateUserById(userId, { ban_duration: '876000h' });
    if (banError) return json({ error: banError.message }, 500);
    return json({ ok: true, action, userId });
  }

  if (action === 'activate') {
    const { error: unbanError } = await adminClient.auth.admin.updateUserById(userId, { ban_duration: 'none' });
    if (unbanError) return json({ error: unbanError.message }, 500);
    const { error: activateError } = await adminClient.from('profiles').update({ is_active: true }).eq('id', userId);
    if (activateError) return json({ error: activateError.message }, 500);
    return json({ ok: true, action, userId });
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
  if (deleteError) return json({ error: deleteError.message }, 500);
  return json({ ok: true, action, userId, experiencesDeleted: 'cascade' });
});
