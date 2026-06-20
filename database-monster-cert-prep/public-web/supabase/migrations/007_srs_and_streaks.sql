begin;

-- 1. SRS scheduling fields on the existing notebook (SM-2 lite).
alter table public.mistake_notebook
  add column if not exists ease numeric(4,2) not null default 2.50,
  add column if not exists interval_days integer not null default 0,
  add column if not exists reps integer not null default 0,
  add column if not exists next_review_at timestamptz not null default now(),
  add column if not exists last_reviewed_at timestamptz;

create index if not exists mistake_notebook_user_due_idx
  on public.mistake_notebook (user_id, next_review_at);

-- 2. One streak row per user.
create table if not exists public.user_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_active_date date,
  daily_goal integer not null default 10 check (daily_goal > 0),
  updated_at timestamptz not null default now()
);

alter table public.user_streaks enable row level security;
revoke all on public.user_streaks from public, anon;
grant select, insert, update, delete on public.user_streaks to authenticated;

drop policy if exists "user_streaks_select_own" on public.user_streaks;
create policy "user_streaks_select_own"
on public.user_streaks for select
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "user_streaks_insert_own" on public.user_streaks;
create policy "user_streaks_insert_own"
on public.user_streaks for insert
to authenticated
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "user_streaks_update_own" on public.user_streaks;
create policy "user_streaks_update_own"
on public.user_streaks for update
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()))
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "user_streaks_delete_own" on public.user_streaks;
create policy "user_streaks_delete_own"
on public.user_streaks for delete
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

-- 3. Streak bump (idempotent per UTC day).
create or replace function public.touch_streak()
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_last date;
  v_current integer;
  v_longest integer;
  v_today date := (now() at time zone 'utc')::date;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;

  insert into public.user_streaks (user_id, current_streak, longest_streak, last_active_date)
  values (v_user_id, 1, 1, v_today)
  on conflict (user_id) do nothing;

  select last_active_date, current_streak, longest_streak
    into v_last, v_current, v_longest
  from public.user_streaks
  where user_id = v_user_id
  for update;

  if v_last = v_today then
    return; -- already counted today
  elsif v_last = v_today - 1 then
    v_current := v_current + 1;
  else
    v_current := 1;
  end if;

  v_longest := greatest(v_longest, v_current);

  update public.user_streaks
  set current_streak = v_current,
      longest_streak = v_longest,
      last_active_date = v_today,
      updated_at = now()
  where user_id = v_user_id;
end;
$$;

revoke all on function public.touch_streak() from public, anon;
grant execute on function public.touch_streak() to authenticated;

-- 4. Review a card: apply SM-2 lite, then bump the streak.
create or replace function public.review_card(p_mistake_id uuid, p_grade text)
returns timestamptz
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_ease numeric(4,2);
  v_interval integer;
  v_reps integer;
  v_next timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;
  if p_grade not in ('again', 'hard', 'good', 'easy') then
    raise exception 'Invalid grade: %', p_grade;
  end if;

  select ease, interval_days, reps
    into v_ease, v_interval, v_reps
  from public.mistake_notebook
  where id = p_mistake_id and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Card not found';
  end if;

  if p_grade = 'again' then
    v_reps := 0;
    v_interval := 0;
    v_ease := v_ease - 0.20;
  else
    v_reps := v_reps + 1;
    if v_reps = 1 then
      v_interval := 1;
    elsif v_reps = 2 then
      v_interval := 3;
    else
      v_interval := round(v_interval * v_ease);
    end if;

    if p_grade = 'hard' then
      v_interval := greatest(1, round(v_interval * 0.6));
      v_ease := v_ease - 0.15;
    elsif p_grade = 'easy' then
      v_interval := round(v_interval * 1.3);
      v_ease := v_ease + 0.15;
    end if;
  end if;

  v_ease := least(3.00, greatest(1.30, v_ease));
  v_next := now() + (v_interval || ' days')::interval;

  update public.mistake_notebook
  set ease = v_ease,
      interval_days = v_interval,
      reps = v_reps,
      next_review_at = v_next,
      last_reviewed_at = now()
  where id = p_mistake_id and user_id = v_user_id;

  perform public.touch_streak();
  return v_next;
end;
$$;

revoke all on function public.review_card(uuid, text) from public, anon;
grant execute on function public.review_card(uuid, text) to authenticated;

commit;
