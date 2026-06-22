begin;

alter table public.profiles
  add column if not exists presence_opt_in boolean not null default false;

create table if not exists public.user_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'online',
  current_area text,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_presence_status_check check (
    status in ('online', 'practicing', 'reviewing', 'taking exam', 'learning', 'viewing leaderboard')
  ),
  constraint user_presence_area_check check (
    current_area is null or current_area in ('app', 'practice', 'mistakes', 'exam', 'learn', 'labs', 'leaderboard')
  )
);

create index if not exists user_presence_last_seen_idx
  on public.user_presence (last_seen_at desc);

create index if not exists profiles_presence_opt_in_idx
  on public.profiles (presence_opt_in)
  where presence_opt_in = true;

alter table public.user_presence enable row level security;

revoke all on public.user_presence from public, anon, authenticated;
grant select on public.user_presence to authenticated;

drop policy if exists "user_presence_select_own" on public.user_presence;
create policy "user_presence_select_own"
on public.user_presence for select
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "user_presence_insert_own" on public.user_presence;
create policy "user_presence_insert_own"
on public.user_presence for insert
to authenticated
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "user_presence_update_own" on public.user_presence;
create policy "user_presence_update_own"
on public.user_presence for update
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()))
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "user_presence_delete_own" on public.user_presence;
create policy "user_presence_delete_own"
on public.user_presence for delete
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

create or replace function public.upsert_user_presence(
  p_status text,
  p_current_area text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_status text := coalesce(p_status, 'online');
  v_current_area text := p_current_area;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;

  if v_status not in ('online', 'practicing', 'reviewing', 'taking exam', 'learning', 'viewing leaderboard') then
    v_status := 'online';
  end if;

  if v_current_area not in ('app', 'practice', 'mistakes', 'exam', 'learn', 'labs', 'leaderboard') then
    v_current_area := 'app';
  end if;

  insert into public.user_presence (user_id, status, current_area, last_seen_at, updated_at)
  values (v_user_id, v_status, v_current_area, now(), now())
  on conflict (user_id)
  do update set
    status = excluded.status,
    current_area = excluded.current_area,
    last_seen_at = excluded.last_seen_at,
    updated_at = excluded.updated_at;
end;
$$;

create or replace function public.get_public_presence(p_limit integer default 12)
returns table (
  user_id uuid,
  display_name text,
  course text,
  avatar_path text,
  status text,
  last_seen_at timestamptz
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    user_presence.user_id,
    coalesce(nullif(trim(profiles.display_name), ''), 'Database learner') as display_name,
    profiles.course,
    profiles.avatar_path,
    user_presence.status,
    user_presence.last_seen_at
  from public.user_presence
  join public.profiles on profiles.id = user_presence.user_id
  where profiles.presence_opt_in = true
    and user_presence.last_seen_at >= now() - interval '10 minutes'
  order by user_presence.last_seen_at desc, display_name asc
  limit least(greatest(coalesce(p_limit, 12), 1), 24);
$$;

revoke all on function public.upsert_user_presence(text, text) from public, anon;
grant execute on function public.upsert_user_presence(text, text) to authenticated;

revoke all on function public.get_public_presence(integer) from public;
grant execute on function public.get_public_presence(integer) to anon, authenticated;

commit;
