begin;

drop function if exists public.get_public_student_profile(uuid);
drop function if exists public.get_public_leaderboard(text);

create function public.get_public_leaderboard(p_course text default null)
returns table (
  user_id uuid,
  display_name text,
  course text,
  avatar_path text,
  rank integer,
  readiness_score numeric,
  best_score numeric,
  attempt_count integer,
  average_mastery numeric,
  last_active_at timestamptz,
  strongest_topics text[],
  weakest_topics text[],
  achievements text[],
  current_streak integer,
  longest_streak integer,
  final_boss_count integer,
  mistake_count integer,
  due_count integer,
  week_attempt_count integer,
  week_question_count integer,
  weekly_challenge_score integer
)
language sql
security definer
set search_path = public, pg_temp
as $$
with week_window as (
  select date_trunc('week', now() at time zone 'utc') at time zone 'utc' as starts_at
),
eligible_profiles as (
  select
    profiles.id,
    nullif(trim(profiles.display_name), '') as display_name,
    profiles.course,
    profiles.avatar_path
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
      exam_attempts.exam_mode,
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
    count(*) filter (where recent_attempts.exam_mode = 'final_boss')::integer as final_boss_count,
    count(*) filter (where recent_attempts.created_at >= (select starts_at from week_window))::integer as week_attempt_count,
    max(recent_attempts.created_at) as last_attempt_at
  from recent_attempts
  group by recent_attempts.user_id
),
week_question_summary as (
  select
    question_attempts.user_id,
    count(*)::integer as week_question_count
  from public.question_attempts
  where question_attempts.created_at >= (select starts_at from week_window)
  group by question_attempts.user_id
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
    count(*)::integer as mistake_count,
    count(*) filter (where mistake_notebook.next_review_at <= now())::integer as due_count,
    max(mistake_notebook.last_reviewed_at) as last_reviewed_at
  from public.mistake_notebook
  group by mistake_notebook.user_id
),
streak_summary as (
  select
    user_streaks.user_id,
    user_streaks.current_streak,
    user_streaks.longest_streak
  from public.user_streaks
),
scored as (
  select
    eligible_profiles.id as user_id,
    coalesce(eligible_profiles.display_name, 'Database learner') as display_name,
    eligible_profiles.course,
    eligible_profiles.avatar_path,
    coalesce(attempt_summary.best_score, 0) as best_score,
    coalesce(attempt_summary.attempt_count, 0) as attempt_count,
    coalesce(attempt_summary.final_boss_count, 0) as final_boss_count,
    coalesce(attempt_summary.week_attempt_count, 0) as week_attempt_count,
    coalesce(week_question_summary.week_question_count, 0) as week_question_count,
    coalesce(topic_summary.average_mastery, 0) as average_mastery,
    coalesce(mistake_summary.mistake_count, 0) as mistake_count,
    coalesce(mistake_summary.due_count, 0) as due_count,
    coalesce(streak_summary.current_streak, 0) as current_streak,
    coalesce(streak_summary.longest_streak, 0) as longest_streak,
    greatest(
      coalesce(attempt_summary.last_attempt_at, '-infinity'::timestamptz),
      coalesce(topic_summary.last_practiced_at, '-infinity'::timestamptz),
      coalesce(mistake_summary.last_reviewed_at, '-infinity'::timestamptz)
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
          + (100 - least(coalesce(mistake_summary.mistake_count, 0) * 5, 100)) * 0.15
          + (
            case
              when greatest(
                coalesce(attempt_summary.last_attempt_at, '-infinity'::timestamptz),
                coalesce(topic_summary.last_practiced_at, '-infinity'::timestamptz),
                coalesce(mistake_summary.last_reviewed_at, '-infinity'::timestamptz)
              ) >= now() - interval '7 days' then 100
              when greatest(
                coalesce(attempt_summary.last_attempt_at, '-infinity'::timestamptz),
                coalesce(topic_summary.last_practiced_at, '-infinity'::timestamptz),
                coalesce(mistake_summary.last_reviewed_at, '-infinity'::timestamptz)
              ) >= now() - interval '14 days' then 60
              when greatest(
                coalesce(attempt_summary.last_attempt_at, '-infinity'::timestamptz),
                coalesce(topic_summary.last_practiced_at, '-infinity'::timestamptz),
                coalesce(mistake_summary.last_reviewed_at, '-infinity'::timestamptz)
              ) >= now() - interval '30 days' then 30
              else 0
            end
          ) * 0.10,
          2
        )
      )
    ) as readiness_score
  from eligible_profiles
  left join attempt_summary on attempt_summary.user_id = eligible_profiles.id
  left join week_question_summary on week_question_summary.user_id = eligible_profiles.id
  left join topic_summary on topic_summary.user_id = eligible_profiles.id
  left join topic_rankings on topic_rankings.user_id = eligible_profiles.id
  left join mistake_summary on mistake_summary.user_id = eligible_profiles.id
  left join streak_summary on streak_summary.user_id = eligible_profiles.id
),
rewarded as (
  select
    scored.*,
    (
      scored.week_attempt_count * 20
      + scored.week_question_count * 2
      + least(scored.current_streak, 7) * 5
    )::integer as weekly_challenge_score,
    array_remove(array[
      case when scored.current_streak >= 3 then 'hot_streak' end,
      case when scored.current_streak >= 7 then 'locked_in' end,
      case when scored.best_score >= 80 then 'exam_ready' end,
      case when scored.final_boss_count >= 1 then 'final_boss' end,
      case when scored.mistake_count > 0 or scored.due_count > 0 then 'repair_mode' end,
      case when scored.average_mastery >= 75 then 'topic_climber' end
    ], null)::text[] as achievements
  from scored
)
select
  rewarded.user_id,
  rewarded.display_name,
  rewarded.course,
  rewarded.avatar_path,
  dense_rank() over (order by rewarded.readiness_score desc, rewarded.best_score desc, rewarded.display_name asc)::integer as rank,
  rewarded.readiness_score,
  rewarded.best_score,
  rewarded.attempt_count,
  rewarded.average_mastery,
  nullif(rewarded.last_active_at, '-infinity'::timestamptz) as last_active_at,
  rewarded.strongest_topics,
  rewarded.weakest_topics,
  rewarded.achievements,
  rewarded.current_streak,
  rewarded.longest_streak,
  rewarded.final_boss_count,
  rewarded.mistake_count,
  rewarded.due_count,
  rewarded.week_attempt_count,
  rewarded.week_question_count,
  rewarded.weekly_challenge_score
from rewarded
order by rewarded.readiness_score desc, rewarded.best_score desc, rewarded.display_name asc;
$$;

create function public.get_public_student_profile(p_user_id uuid)
returns table (
  user_id uuid,
  display_name text,
  course text,
  avatar_path text,
  rank integer,
  readiness_score numeric,
  best_score numeric,
  attempt_count integer,
  average_mastery numeric,
  last_active_at timestamptz,
  strongest_topics text[],
  weakest_topics text[],
  achievements text[],
  current_streak integer,
  longest_streak integer,
  final_boss_count integer,
  mistake_count integer,
  due_count integer,
  week_attempt_count integer,
  week_question_count integer,
  weekly_challenge_score integer
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

commit;
