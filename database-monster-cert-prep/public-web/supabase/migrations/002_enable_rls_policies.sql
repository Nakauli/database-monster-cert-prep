begin;

alter table public.profiles enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.question_attempts enable row level security;
alter table public.mistake_notebook enable row level security;
alter table public.user_topic_progress enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.exam_attempts to authenticated;
grant select, insert, update, delete on public.question_attempts to authenticated;
grant select, insert, update, delete on public.mistake_notebook to authenticated;
grant select, insert, update, delete on public.user_topic_progress to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) is not null and id = (select auth.uid()));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) is not null and id = (select auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) is not null and id = (select auth.uid()))
with check ((select auth.uid()) is not null and id = (select auth.uid()));

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles for delete
to authenticated
using ((select auth.uid()) is not null and id = (select auth.uid()));

drop policy if exists "exam_attempts_select_own" on public.exam_attempts;
create policy "exam_attempts_select_own"
on public.exam_attempts for select
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "exam_attempts_insert_own" on public.exam_attempts;
create policy "exam_attempts_insert_own"
on public.exam_attempts for insert
to authenticated
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "exam_attempts_update_own" on public.exam_attempts;
create policy "exam_attempts_update_own"
on public.exam_attempts for update
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()))
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "exam_attempts_delete_own" on public.exam_attempts;
create policy "exam_attempts_delete_own"
on public.exam_attempts for delete
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "question_attempts_select_own" on public.question_attempts;
create policy "question_attempts_select_own"
on public.question_attempts for select
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "question_attempts_insert_own" on public.question_attempts;
create policy "question_attempts_insert_own"
on public.question_attempts for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and exists (
    select 1
    from public.exam_attempts
    where id = exam_attempt_id
      and user_id = (select auth.uid())
  )
);

drop policy if exists "question_attempts_update_own" on public.question_attempts;
create policy "question_attempts_update_own"
on public.question_attempts for update
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()))
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and exists (
    select 1
    from public.exam_attempts
    where id = exam_attempt_id
      and user_id = (select auth.uid())
  )
);

drop policy if exists "question_attempts_delete_own" on public.question_attempts;
create policy "question_attempts_delete_own"
on public.question_attempts for delete
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "mistake_notebook_select_own" on public.mistake_notebook;
create policy "mistake_notebook_select_own"
on public.mistake_notebook for select
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "mistake_notebook_insert_own" on public.mistake_notebook;
create policy "mistake_notebook_insert_own"
on public.mistake_notebook for insert
to authenticated
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "mistake_notebook_update_own" on public.mistake_notebook;
create policy "mistake_notebook_update_own"
on public.mistake_notebook for update
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()))
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "mistake_notebook_delete_own" on public.mistake_notebook;
create policy "mistake_notebook_delete_own"
on public.mistake_notebook for delete
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "user_topic_progress_select_own" on public.user_topic_progress;
create policy "user_topic_progress_select_own"
on public.user_topic_progress for select
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "user_topic_progress_insert_own" on public.user_topic_progress;
create policy "user_topic_progress_insert_own"
on public.user_topic_progress for insert
to authenticated
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "user_topic_progress_update_own" on public.user_topic_progress;
create policy "user_topic_progress_update_own"
on public.user_topic_progress for update
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()))
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "user_topic_progress_delete_own" on public.user_topic_progress;
create policy "user_topic_progress_delete_own"
on public.user_topic_progress for delete
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

commit;

