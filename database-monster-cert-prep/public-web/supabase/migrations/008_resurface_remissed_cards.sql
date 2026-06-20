begin;

-- When a question already in the mistake notebook is missed again, it must
-- resurface for spaced-repetition review immediately rather than staying hidden
-- behind a stale future `next_review_at`. This redefines save_exam_result so the
-- re-miss path resets the SRS schedule (next_review_at/interval_days/reps) while
-- preserving the long-term `ease` difficulty signal. Everything else is identical
-- to the definition in 001_create_user_progress_tables.sql.

create or replace function public.save_exam_result(
  p_exam_mode text,
  p_score numeric,
  p_total_questions integer,
  p_correct_count integer,
  p_time_spent_seconds integer,
  p_topic_breakdown jsonb,
  p_question_attempts jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_exam_attempt_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;

  insert into public.exam_attempts (
    user_id,
    exam_mode,
    score,
    total_questions,
    correct_count,
    time_spent_seconds,
    topic_breakdown
  )
  values (
    v_user_id,
    p_exam_mode,
    p_score,
    p_total_questions,
    p_correct_count,
    p_time_spent_seconds,
    coalesce(p_topic_breakdown, '{}'::jsonb)
  )
  returning id into v_exam_attempt_id;

  insert into public.question_attempts (
    user_id,
    exam_attempt_id,
    question_id,
    topic,
    difficulty,
    is_correct,
    selected_answers,
    correct_answers
  )
  select
    v_user_id,
    v_exam_attempt_id,
    q.question_id,
    q.topic,
    q.difficulty,
    q.is_correct,
    coalesce(q.selected_answers, '[]'::jsonb),
    coalesce(q.correct_answers, '[]'::jsonb)
  from jsonb_to_recordset(coalesce(p_question_attempts, '[]'::jsonb)) as q(
    question_id text,
    topic text,
    difficulty text,
    is_correct boolean,
    selected_answers jsonb,
    correct_answers jsonb,
    question_snapshot jsonb,
    explanation text
  );

  insert into public.mistake_notebook (
    user_id,
    question_id,
    topic,
    difficulty,
    question_snapshot,
    selected_answers,
    correct_answers,
    explanation,
    mistake_count,
    last_mistaken_at
  )
  select
    v_user_id,
    q.question_id,
    q.topic,
    q.difficulty,
    q.question_snapshot,
    coalesce(q.selected_answers, '[]'::jsonb),
    coalesce(q.correct_answers, '[]'::jsonb),
    q.explanation,
    1,
    now()
  from jsonb_to_recordset(coalesce(p_question_attempts, '[]'::jsonb)) as q(
    question_id text,
    topic text,
    difficulty text,
    is_correct boolean,
    selected_answers jsonb,
    correct_answers jsonb,
    question_snapshot jsonb,
    explanation text
  )
  where not q.is_correct
  on conflict (user_id, question_id)
  do update set
    topic = excluded.topic,
    difficulty = excluded.difficulty,
    question_snapshot = excluded.question_snapshot,
    selected_answers = excluded.selected_answers,
    correct_answers = excluded.correct_answers,
    explanation = excluded.explanation,
    mistake_count = public.mistake_notebook.mistake_count + 1,
    last_mistaken_at = now(),
    -- Re-missed: bring the card back into the due queue now and restart its
    -- interval. `ease` is intentionally preserved as the long-term difficulty signal.
    next_review_at = now(),
    interval_days = 0,
    reps = 0;

  insert into public.user_topic_progress (
    user_id,
    topic,
    attempted_count,
    correct_count,
    mastery_score,
    last_practiced_at
  )
  select
    v_user_id,
    q.topic,
    count(*)::integer,
    count(*) filter (where q.is_correct)::integer,
    round(
      (count(*) filter (where q.is_correct))::numeric / nullif(count(*), 0) * 100,
      2
    ),
    now()
  from jsonb_to_recordset(coalesce(p_question_attempts, '[]'::jsonb)) as q(
    question_id text,
    topic text,
    difficulty text,
    is_correct boolean,
    selected_answers jsonb,
    correct_answers jsonb,
    question_snapshot jsonb,
    explanation text
  )
  group by q.topic
  on conflict (user_id, topic)
  do update set
    attempted_count = public.user_topic_progress.attempted_count + excluded.attempted_count,
    correct_count = public.user_topic_progress.correct_count + excluded.correct_count,
    mastery_score = round(
      (
        public.user_topic_progress.correct_count + excluded.correct_count
      )::numeric
      / nullif(
        public.user_topic_progress.attempted_count + excluded.attempted_count,
        0
      )
      * 100,
      2
    ),
    last_practiced_at = now();

  return v_exam_attempt_id;
end;
$$;

revoke all on function public.save_exam_result(
  text,
  numeric,
  integer,
  integer,
  integer,
  jsonb,
  jsonb
) from public, anon;

grant execute on function public.save_exam_result(
  text,
  numeric,
  integer,
  integer,
  integer,
  jsonb,
  jsonb
) to authenticated;

commit;
