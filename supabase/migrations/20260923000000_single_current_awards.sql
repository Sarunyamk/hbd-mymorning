-- One active gift collection per published experience. Restart deletes it.
alter table public.experiences
  add column if not exists award_generation bigint not null default 0;

create or replace function public.get_current_awards(p_public_id uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_experience_id uuid;
  v_generation bigint;
  v_awards jsonb;
begin
  select e.id, e.award_generation into v_experience_id, v_generation
  from public.experiences e
  join public.profiles p on p.id = e.owner_id and p.is_active = true
  where e.public_id = p_public_id and e.status = 'published'
    and e.published_config is not null
  for update of e;
  if v_experience_id is null then
    raise exception 'EXPERIENCE_NOT_FOUND' using errcode = 'P0002';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'award_id', ag.id, 'award_key', ag.award_key,
    'gift_config_id', ag.gift_config_id, 'source', ag.source,
    'gift_snapshot', ag.gift_snapshot, 'status', ag.status,
    'redeemed_at', ag.redeemed_at
  ) order by ag.created_at, ag.id), '[]'::jsonb) into v_awards
  from public.awarded_gifts ag where ag.experience_id = v_experience_id;
  return jsonb_build_object('generation', v_generation, 'awards', v_awards);
end;
$$;

create or replace function public.reset_current_awards(
  p_public_id uuid, p_generation bigint
)
returns bigint
language plpgsql security definer set search_path = ''
as $$
declare
  v_experience_id uuid;
  v_generation bigint;
begin
  select e.id, e.award_generation into v_experience_id, v_generation
  from public.experiences e
  join public.profiles p on p.id = e.owner_id and p.is_active = true
  where e.public_id = p_public_id and e.status = 'published'
    and e.published_config is not null
  for update of e;
  if v_experience_id is null then
    raise exception 'EXPERIENCE_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_generation is distinct from p_generation then
    raise exception 'STALE_AWARD_STATE' using errcode = '40001';
  end if;
  delete from public.awarded_gifts where experience_id = v_experience_id;
  update public.experiences set award_generation = award_generation + 1
  where id = v_experience_id returning award_generation into v_generation;
  return v_generation;
end;
$$;

create or replace function public.sync_current_awards(
  p_public_id uuid, p_generation bigint, p_awards jsonb
)
returns table (
  award_id uuid, award_key text, gift_config_id text, source text,
  gift_snapshot jsonb, status text, redeemed_at timestamptz
)
language plpgsql security definer set search_path = ''
as $$
declare v_generation bigint;
begin
  select e.award_generation into v_generation
  from public.experiences e
  join public.profiles p on p.id = e.owner_id and p.is_active = true
  where e.public_id = p_public_id and e.status = 'published'
    and e.published_config is not null
  for update of e;
  if v_generation is null then
    raise exception 'EXPERIENCE_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_generation is distinct from p_generation then
    raise exception 'STALE_AWARD_STATE' using errcode = '40001';
  end if;
  return query select * from public.sync_awarded_gifts(p_public_id, p_awards);
end;
$$;

create or replace function public.redeem_current_award(
  p_public_id uuid, p_generation bigint, p_award_id uuid
)
returns table (
  award_id uuid, award_key text, status text, redeemed_at timestamptz
)
language plpgsql security definer set search_path = ''
as $$
declare v_generation bigint;
begin
  select e.award_generation into v_generation
  from public.experiences e
  join public.profiles p on p.id = e.owner_id and p.is_active = true
  where e.public_id = p_public_id and e.status = 'published'
    and e.published_config is not null
  for update of e;
  if v_generation is null then
    raise exception 'EXPERIENCE_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_generation is distinct from p_generation then
    raise exception 'STALE_AWARD_STATE' using errcode = '40001';
  end if;
  return query select * from public.redeem_awarded_gift(p_public_id, p_award_id);
end;
$$;

-- Older public RPCs do not check the generation and could restore deleted awards.
revoke all on function public.sync_awarded_gifts(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.redeem_awarded_gift(uuid, uuid) from public, anon, authenticated;
revoke all on function public.get_current_awards(uuid) from public;
revoke all on function public.reset_current_awards(uuid, bigint) from public;
revoke all on function public.sync_current_awards(uuid, bigint, jsonb) from public;
revoke all on function public.redeem_current_award(uuid, bigint, uuid) from public;
grant execute on function public.get_current_awards(uuid) to anon, authenticated;
grant execute on function public.reset_current_awards(uuid, bigint) to anon, authenticated;
grant execute on function public.sync_current_awards(uuid, bigint, jsonb) to anon, authenticated;
grant execute on function public.redeem_current_award(uuid, bigint, uuid) to anon, authenticated;
