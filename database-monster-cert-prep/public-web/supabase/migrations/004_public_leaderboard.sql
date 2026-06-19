begin;

alter table public.profiles
  add column if not exists leaderboard_opt_in boolean not null default false;

create index if not exists profiles_leaderboard_course_idx
  on public.profiles (leaderboard_opt_in, course);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    course,
    leaderboard_opt_in
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'course', ''),
    coalesce((new.raw_user_meta_data ->> 'leaderboard_opt_in')::boolean, false)
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    course = excluded.course,
    leaderboard_opt_in = excluded.leaderboard_opt_in;

  return new;
end;
$$;

create or replace function public.get_public_leaderboard(p_course text default null)
returns table (
  user_id uuid,
  display_name text,
  course text,
  rank integer,
  readiness_score numeric,
  best_score numeric,
  attempt_count integer,
  average_mastery numeric,
  last_active_at timestamptz,
  strongest_topics text[],
  weakest_topics text[]
)
language sql
security definer
set search_path = public, pg_temp
as $$
with eligible_profiles as (
  select
    profiles.id,
    nullif(trim(profiles.display_name), '') as display_name,
    profiles.course
  from public.profiles
  where profiles.leaderboard_opt_in = true
    and (p_course is null or p_course = '' or profiles.course = p_course)
),
recent_attempts as (
  select *
  from (
    select
      exam_attempts.user_id,
      exam_attempts.score,
      exam_attempts.created_at,
      row_number() over (
        partition by exam_attempts.user_id
        order by exam_attempts.created_at desc
      ) as attempt_position
    from public.exam_attempts
    where exam_attempts.exam_mode in ('diagnostic', 'timed', 'final_boss')
  ) ranked_attempts
  where ranked_attempts.attempt_position <= 10
),
attempt_summary as (
  select
    recent_attempts.user_id,
    max(recent_attempts.score) as best_score,
    count(*)::integer as attempt_count,
    max(recent_attempts.created_at) as last_attempt_at
  from recent_attempts
  group by recent_attempts.user_id
),
topic_summary as (
  select
    user_topic_progress.user_id,
    round(avg(user_topic_progress.mastery_score), 2) as average_mastery,
    max(user_topic_progress.last_practiced_at) as last_practiced_at
  from public.user_topic_progress
  group by user_topic_progress.user_id
),
topic_rankings as (
  select
    user_topic_progress.user_id,
    (array_remove(array_agg(user_topic_progress.topic order by user_topic_progress.mastery_score desc, user_topic_progress.topic) filter (where user_topic_progress.topic is not null), null))[1:3] as strongest_topics,
    (array_remove(array_agg(user_topic_progress.topic order by user_topic_progress.mastery_score asc, user_topic_progress.topic) filter (where user_topic_progress.topic is not null), null))[1:3] as weakest_topics
  from public.user_topic_progress
  group by user_topic_progress.user_id
),
mistake_summary as (
  select
    mistake_notebook.user_id,
    count(*)::integer as unresolved_mistakes
  from public.mistake_notebook
  group by mistake_notebook.user_id
),
scored as (
  select
    eligible_profiles.id as user_id,
    coalesce(eligible_profiles.display_name, 'Database learner') as display_name,
    eligible_profiles.course,
    coalesce(attempt_summary.best_score, 0) as best_score,
    coalesce(attempt_summary.attempt_count, 0) as attempt_count,
    coalesce(topic_summary.average_mastery, 0) as average_mastery,
    greatest(
      coalesce(attempt_summary.last_attempt_at, '-infinity'::timestamptz),
      coalesce(topic_summary.last_practiced_at, '-infinity'::timestamptz)
    ) as last_active_at,
    coalesce(topic_rankings.strongest_topics, array[]::text[]) as strongest_topics,
    coalesce(topic_rankings.weakest_topics, array[]::text[]) as weakest_topics,
    least(
      100,
      greatest(
        0,
        round(
          coalesce(attempt_summary.best_score, 0) * 0.50
          + coalesce(topic_summary.average_mastery, 0) * 0.25
          + (100 - least(coalesce(mistake_summary.unresolved_mistakes, 0) * 5, 100)) * 0.15
          + (
            case
              when greatest(coalesce(attempt_summary.last_attempt_at, '-infinity'::timestamptz), coalesce(topic_summary.last_practiced_at, '-infinity'::timestamptz)) >= now() - interval '7 days' then 100
              when greatest(coalesce(attempt_summary.last_attempt_at, '-infinity'::timestamptz), coalesce(topic_summary.last_practiced_at, '-infinity'::timestamptz)) >= now() - interval '14 days' then 60
              when greatest(coalesce(attempt_summary.last_attempt_at, '-infinity'::timestamptz), coalesce(topic_summary.last_practiced_at, '-infinity'::timestamptz)) >= now() - interval '30 days' then 30
              else 0
            end
          ) * 0.10,
          2
        )
      )
    ) as readiness_score
  from eligible_profiles
  left join attempt_summary on attempt_summary.user_id = eligible_profiles.id
  left join topic_summary on topic_summary.user_id = eligible_profiles.id
  left join topic_rankings on topic_rankings.user_id = eligible_profiles.id
  left join mistake_summary on mistake_summary.user_id = eligible_profiles.id
)
select
  scored.user_id,
  scored.display_name,
  scored.course,
  dense_rank() over (order by scored.readiness_score desc, scored.best_score desc, scored.display_name asc)::integer as rank,
  scored.readiness_score,
  scored.best_score,
  scored.attempt_count,
  scored.average_mastery,
  nullif(scored.last_active_at, '-infinity'::timestamptz) as last_active_at,
  scored.strongest_topics,
  scored.weakest_topics
from scored
order by scored.readiness_score desc, scored.best_score desc, scored.display_name asc;
$$;

create or replace function public.get_public_student_profile(p_user_id uuid)
returns table (
  user_id uuid,
  display_name text,
  course text,
  rank integer,
  readiness_score numeric,
  best_score numeric,
  attempt_count integer,
  average_mastery numeric,
  last_active_at timestamptz,
  strongest_topics text[],
  weakest_topics text[]
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select *
  from public.get_public_leaderboard(null) as leaderboard
  where leaderboard.user_id = p_user_id
  limit 1;
$$;

revoke all on function public.get_public_leaderboard(text) from public;
revoke all on function public.get_public_student_profile(uuid) from public;
grant execute on function public.get_public_leaderboard(text) to anon, authenticated;
grant execute on function public.get_public_student_profile(uuid) to anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

commit;
