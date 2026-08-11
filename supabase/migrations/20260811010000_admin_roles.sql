-- Admin roles, account activation, and admin-only user summaries.
-- Run after 20260811000000_phase10_foundation.sql.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, is_active, created_at)
  values (new.id, 'user', true, coalesce(new.created_at, now()))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup
after insert on auth.users
for each row execute function public.handle_new_user_profile();

insert into public.profiles (id, role, is_active, created_at)
select id, 'user', true, created_at from auth.users
on conflict (id) do nothing;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_experience_updated_at();

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and is_active = true
  );
$$;

create or replace function public.current_user_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_active = true
  );
$$;

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile and admins can read all" on public.profiles;
create policy "Users can read own profile and admins can read all"
on public.profiles for select to authenticated
using ((select auth.uid()) = id or (select public.current_user_is_admin()));

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;

drop policy if exists "Owners can read experiences" on public.experiences;
create policy "Owners can read experiences"
on public.experiences for select to authenticated
using ((select auth.uid()) = owner_id and (select public.current_user_is_active()));

drop policy if exists "Owners can create experiences" on public.experiences;
create policy "Owners can create experiences"
on public.experiences for insert to authenticated
with check ((select auth.uid()) = owner_id and (select public.current_user_is_active()));

drop policy if exists "Owners can update experiences" on public.experiences;
create policy "Owners can update experiences"
on public.experiences for update to authenticated
using ((select auth.uid()) = owner_id and (select public.current_user_is_active()))
with check ((select auth.uid()) = owner_id and (select public.current_user_is_active()));

drop policy if exists "Owners can delete experiences" on public.experiences;
create policy "Owners can delete experiences"
on public.experiences for delete to authenticated
using ((select auth.uid()) = owner_id and (select public.current_user_is_active()));

create or replace function public.admin_list_users()
returns table (
  user_id uuid,
  email text,
  role text,
  is_active boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  experience_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;
  return query
  select u.id, u.email::text, p.role, p.is_active, p.created_at,
    u.last_sign_in_at, count(e.id)::bigint
  from auth.users u
  join public.profiles p on p.id = u.id
  left join public.experiences e on e.owner_id = u.id
  group by u.id, u.email, p.role, p.is_active, p.created_at, u.last_sign_in_at
  order by p.created_at desc;
end;
$$;

create or replace function public.admin_list_user_experiences(p_user_id uuid)
returns table (
  experience_id uuid,
  title text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  published_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;
  return query
  select e.id, e.title, e.status, e.created_at, e.updated_at, e.published_at
  from public.experiences e
  where e.owner_id = p_user_id
  order by e.updated_at desc;
end;
$$;

create or replace function public.get_published_experience(p_public_id uuid)
returns table (title text, config jsonb, schema_version integer, published_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select e.title, e.published_config, e.schema_version, e.published_at
  from public.experiences e
  join public.profiles p on p.id = e.owner_id and p.is_active = true
  where e.public_id = p_public_id
    and e.status = 'published'
    and e.published_config is not null
  limit 1;
$$;

revoke all on function public.handle_new_user_profile() from public, anon, authenticated;
revoke all on function public.current_user_is_admin() from public, anon;
revoke all on function public.current_user_is_active() from public, anon;
revoke all on function public.admin_list_users() from public, anon;
revoke all on function public.admin_list_user_experiences(uuid) from public, anon;
grant execute on function public.current_user_is_admin() to authenticated;
grant execute on function public.current_user_is_active() to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_list_user_experiences(uuid) to authenticated;
revoke all on function public.get_published_experience(uuid) from public;
grant execute on function public.get_published_experience(uuid) to anon, authenticated;
