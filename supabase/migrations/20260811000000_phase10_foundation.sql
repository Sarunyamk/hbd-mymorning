-- Phase 10: Authentication and database foundation.
-- Run this migration once in the Supabase SQL Editor or with the Supabase CLI.

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Untitled Birthday'
    check (char_length(title) between 1 and 80),
  draft_config jsonb not null default '{}'::jsonb
    check (jsonb_typeof(draft_config) = 'object'),
  published_config jsonb
    check (published_config is null or jsonb_typeof(published_config) = 'object'),
  schema_version integer not null default 2
    check (schema_version > 0),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  public_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  check (status <> 'published' or (published_config is not null and public_id is not null))
);

create index if not exists experiences_owner_updated_idx
  on public.experiences (owner_id, updated_at desc);

create or replace function public.set_experience_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_experiences_updated_at on public.experiences;
create trigger set_experiences_updated_at
before update on public.experiences
for each row execute function public.set_experience_updated_at();

alter table public.experiences enable row level security;

drop policy if exists "Owners can read experiences" on public.experiences;
create policy "Owners can read experiences"
on public.experiences
for select
to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists "Owners can create experiences" on public.experiences;
create policy "Owners can create experiences"
on public.experiences
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners can update experiences" on public.experiences;
create policy "Owners can update experiences"
on public.experiences
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners can delete experiences" on public.experiences;
create policy "Owners can delete experiences"
on public.experiences
for delete
to authenticated
using ((select auth.uid()) = owner_id);

revoke all on table public.experiences from anon;
grant select, insert, update, delete on table public.experiences to authenticated;

create or replace function public.get_published_experience(p_public_id uuid)
returns table (
  title text,
  config jsonb,
  schema_version integer,
  published_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    experiences.title,
    experiences.published_config,
    experiences.schema_version,
    experiences.published_at
  from public.experiences as experiences
  where experiences.public_id = p_public_id
    and experiences.status = 'published'
    and experiences.published_config is not null
  limit 1;
$$;

revoke all on function public.set_experience_updated_at() from public, anon, authenticated;
revoke all on function public.get_published_experience(uuid) from public;
grant execute on function public.get_published_experience(uuid) to anon, authenticated;
