import { supabase } from './supabase-client.js';

export async function getMyProfile(userId) {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  let id = userId;
  if (!id) {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    id = data.user?.id;
  }
  if (!id) throw new Error('AUTH_REQUIRED');
  const { data, error } = await supabase
    .from('profiles')
    .select('id,role,is_active,created_at,updated_at')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}
