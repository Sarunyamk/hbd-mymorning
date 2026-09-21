-- Persist awarded gifts separately from the published experience configuration.
-- Configuration remains JSONB on experiences; this table stores runtime state.

create table if not exists public.awarded_gifts (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences (id) on delete cascade,
  award_key text not null check (char_length(award_key) between 1 and 160),
  gift_config_id text not null check (char_length(gift_config_id) between 1 and 120),
  source text not null check (
    source in ('normal', 'consolation-extra-pick', 'consolation', 'guaranteed-gift')
  ),
  gift_snapshot jsonb not null check (jsonb_typeof(gift_snapshot) = 'object'),
  status text not null default 'available' check (status in ('available', 'redeemed')),
  created_at timestamptz not null default now(),
  redeemed_at timestamptz,
  unique (experience_id, award_key),
  check (
    (status = 'available' and redeemed_at is null)
    or (status = 'redeemed' and redeemed_at is not null)
  )
);

create index if not exists awarded_gifts_experience_created_idx
  on public.awarded_gifts (experience_id, created_at);

alter table public.awarded_gifts enable row level security;

drop policy if exists "Owners can read awarded gifts" on public.awarded_gifts;
create policy "Owners can read awarded gifts"
on public.awarded_gifts for select to authenticated
using (
  exists (
    select 1
    from public.experiences e
    where e.id = awarded_gifts.experience_id
      and e.owner_id = (select auth.uid())
      and (select public.current_user_is_active())
  )
);

revoke all on table public.awarded_gifts from anon, authenticated;
grant select on table public.awarded_gifts to authenticated;

create or replace function public.sync_awarded_gifts(
  p_public_id uuid,
  p_awards jsonb
)
returns table (
  award_id uuid,
  award_key text,
  gift_config_id text,
  source text,
  gift_snapshot jsonb,
  status text,
  redeemed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_experience_id uuid;
  v_config jsonb;
  v_item jsonb;
  v_key text;
  v_gift_id text;
  v_source text;
  v_snapshot jsonb;
begin
  if p_awards is null
    or jsonb_typeof(p_awards) <> 'array'
    or jsonb_array_length(p_awards) < 1
    or jsonb_array_length(p_awards) > 40 then
    raise exception 'INVALID_AWARDS' using errcode = '22023';
  end if;

  select e.id, e.published_config
  into v_experience_id, v_config
  from public.experiences e
  join public.profiles p on p.id = e.owner_id and p.is_active = true
  where e.public_id = p_public_id
    and e.status = 'published'
    and e.published_config is not null
  limit 1;

  if v_experience_id is null then
    raise exception 'EXPERIENCE_NOT_FOUND' using errcode = 'P0002';
  end if;

  for v_item in select value from jsonb_array_elements(p_awards)
  loop
    v_key := trim(coalesce(v_item ->> 'awardKey', ''));
    v_gift_id := trim(coalesce(v_item ->> 'giftConfigId', ''));
    v_source := trim(coalesce(v_item ->> 'source', 'normal'));
    v_snapshot := null;

    if char_length(v_key) not between 1 and 160
      or char_length(v_gift_id) not between 1 and 120
      or v_source not in ('normal', 'consolation-extra-pick', 'consolation', 'guaranteed-gift')
      or v_key <> v_source || ':' || v_gift_id then
      raise exception 'INVALID_AWARD' using errcode = '22023';
    end if;

    if v_source in ('normal', 'consolation-extra-pick') then
      select gift.value
      into v_snapshot
      from jsonb_array_elements(
        coalesce(v_config #> '{giftBox,gifts}', '[]'::jsonb)
      ) as gift(value)
      where gift.value ->> 'id' = v_gift_id
      limit 1;
    elsif v_source = 'guaranteed-gift' then
      select gift.value || jsonb_build_object(
        'rarity', 'special',
        'tier', 'bonus',
        'guaranteed', true,
        'source', 'guaranteed-gift'
      )
      into v_snapshot
      from jsonb_array_elements(
        coalesce(v_config #> '{giftBox,guaranteedGifts,items}', '[]'::jsonb)
      ) as gift(value)
      where gift.value ->> 'id' = v_gift_id
      limit 1;
    elsif v_source = 'consolation' and v_gift_id = 'consolation-noGrand' then
      v_snapshot := (v_config #> '{giftBox,consolation,noGrand,bonusGift}')
        || jsonb_build_object(
          'id', v_gift_id,
          'rarity', 'special',
          'tier', 'bonus',
          'consolation', true,
          'source', 'consolation'
        );
    elsif v_source = 'consolation' and v_gift_id = 'consolation-noTopTier' then
      v_snapshot := (v_config #> '{giftBox,consolation,noTopTier,bonusGift}')
        || jsonb_build_object(
          'id', v_gift_id,
          'rarity', 'special',
          'tier', 'bonus',
          'consolation', true,
          'source', 'consolation'
        );
    end if;

    if v_snapshot is null or jsonb_typeof(v_snapshot) <> 'object' then
      raise exception 'UNKNOWN_GIFT' using errcode = '22023';
    end if;

    insert into public.awarded_gifts (
      experience_id,
      award_key,
      gift_config_id,
      source,
      gift_snapshot
    ) values (
      v_experience_id,
      v_key,
      v_gift_id,
      v_source,
      v_snapshot
    )
    on conflict on constraint awarded_gifts_experience_id_award_key_key
    do nothing;
  end loop;

  return query
  select
    ag.id,
    ag.award_key,
    ag.gift_config_id,
    ag.source,
    ag.gift_snapshot,
    ag.status,
    ag.redeemed_at
  from public.awarded_gifts ag
  where ag.experience_id = v_experience_id
    and ag.award_key in (
      select value ->> 'awardKey'
      from jsonb_array_elements(p_awards)
    )
  order by ag.created_at, ag.id;
end;
$$;

create or replace function public.redeem_awarded_gift(
  p_public_id uuid,
  p_award_id uuid
)
returns table (
  award_id uuid,
  award_key text,
  status text,
  redeemed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.awarded_gifts ag
  set
    status = 'redeemed',
    redeemed_at = coalesce(ag.redeemed_at, now())
  from public.experiences e
  join public.profiles p on p.id = e.owner_id and p.is_active = true
  where ag.id = p_award_id
    and e.id = ag.experience_id
    and e.public_id = p_public_id
    and e.status = 'published'
  returning ag.id, ag.award_key, ag.status, ag.redeemed_at;

  if not found then
    raise exception 'AWARD_NOT_FOUND' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.sync_awarded_gifts(uuid, jsonb) from public;
revoke all on function public.redeem_awarded_gift(uuid, uuid) from public;
grant execute on function public.sync_awarded_gifts(uuid, jsonb) to anon, authenticated;
grant execute on function public.redeem_awarded_gift(uuid, uuid) to anon, authenticated;
