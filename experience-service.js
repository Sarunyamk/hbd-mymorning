import { supabase } from './supabase-client.js';

const CACHE_KEY = 'hbd-experiences-cache-v1';

function requireClient() {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  return supabase;
}

function normalizeTitle(value) {
  const title = String(value || '').trim().slice(0, 80);
  return title || 'Untitled Birthday';
}

export function readExperienceCache() {
  try {
    const value = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writeExperienceCache(experiences) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(experiences));
  } catch (error) {
    console.warn('Experience cache error:', error);
  }
}

export async function getCurrentUser() {
  const { data, error } = await requireClient().auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('AUTH_REQUIRED');
  return data.user;
}

export async function listExperiences() {
  const { data, error } = await requireClient()
    .from('experiences')
    .select('id,title,status,schema_version,created_at,updated_at,published_at')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  writeExperienceCache(data || []);
  return data || [];
}

export async function getExperience(id) {
  const { data, error } = await requireClient()
    .from('experiences')
    .select('id,title,status,draft_config,schema_version,created_at,updated_at,published_at')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createExperience(config, title) {
  const user = await getCurrentUser();
  const payload = {
    owner_id: user.id,
    title: normalizeTitle(title || config?.birthday?.name),
    draft_config: config,
    schema_version: Number(config?.schemaVersion) || 1,
    status: 'draft',
  };
  const { data, error } = await requireClient()
    .from('experiences')
    .insert(payload)
    .select('id,title,status,draft_config,schema_version,created_at,updated_at,published_at')
    .single();
  if (error) throw error;
  return data;
}

export async function updateExperienceDraft(id, config, expectedUpdatedAt) {
  let query = requireClient()
    .from('experiences')
    .update({
      draft_config: config,
      schema_version: Number(config?.schemaVersion) || 1,
    })
    .eq('id', id);
  if (expectedUpdatedAt) query = query.eq('updated_at', expectedUpdatedAt);
  const { data, error } = await query
    .select('id,title,status,draft_config,schema_version,updated_at')
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const conflict = new Error('DRAFT_CONFLICT');
    conflict.code = 'DRAFT_CONFLICT';
    throw conflict;
  }
  return data;
}

export async function renameExperience(id, title) {
  const { data, error } = await requireClient()
    .from('experiences')
    .update({ title: normalizeTitle(title) })
    .eq('id', id)
    .select('id,title,status,schema_version,created_at,updated_at,published_at')
    .single();
  if (error) throw error;
  return data;
}

export async function duplicateExperience(id) {
  const source = await getExperience(id);
  return createExperience(source.draft_config, `${source.title} (Copy)`.slice(0, 80));
}

export async function setExperienceArchived(id, archived = true) {
  const { data, error } = await requireClient()
    .from('experiences')
    .update({ status: archived ? 'archived' : 'draft' })
    .eq('id', id)
    .select('id,title,status,schema_version,created_at,updated_at,published_at')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExperience(id) {
  const { error } = await requireClient().from('experiences').delete().eq('id', id);
  if (error) throw error;
}
