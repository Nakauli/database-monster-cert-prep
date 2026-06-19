begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  school text,
  course text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_mode text not null,
  score numeric(5,2) not null check (score between 0 and 100),
  total_questions integer not null check (total_questions > 0),
  correct_count integer not null check (correct_count between 0 and total_questions),
  time_spent_seconds integer check (time_spent_seconds is null or time_spent_seconds >= 0),
  topic_breakdown jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_attempt_id uuid not null references public.exam_attempts(id) on delete cascade,
  question_id text not null,
  topic text not null,
  difficulty text,
  is_correct boolean not null,
  selected_answers jsonb not null default '[]'::jsonb,
  correct_answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.mistake_notebook (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  topic text not null,
  difficulty text,
  question_snapshot jsonb not null,
  selected_answers jsonb not null default '[]'::jsonb,
  correct_answers jsonb not null default '[]'::jsonb,
  explanation text,
  mistake_count integer not null default 1 check (mistake_count > 0),
  last_mistaken_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create table if not exists public.user_topic_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null,
  attempted_count integer not null default 0 check (attempted_count >= 0),
  correct_count integer not null default 0 check (correct_count between 0 and attempted_count),
  mastery_score numeric(5,2) not null default 0 check (mastery_score between 0 and 100),
  last_practiced_at timestamptz,
  unique (user_id, topic)
);

create index if not exists exam_attempts_user_created_idx
  on public.exam_attempts (user_id, created_at desc);
create index if not exists question_attempts_user_exam_idx
  on public.question_attempts (user_id, exam_attempt_id);
create index if not exists question_attempts_user_topic_idx
  on public.question_attempts (user_id, topic);
create index if not exists mistake_notebook_user_topic_idx
  on public.mistake_notebook (user_id, topic, last_mistaken_at desc);
create index if not exists user_topic_progress_user_mastery_idx
  on public.user_topic_progress (user_id, mastery_score);

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
    last_mistaken_at = now();

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

