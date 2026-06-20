begin;

alter table public.profiles
  add column if not exists review_reminders_opt_in boolean not null default false,
  add column if not exists review_reminders_last_sent_at timestamptz;

create extension if not exists pg_net;
create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.invoke_due_review_reminders()
returns bigint
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_function_url text;
  v_cron_secret text;
  v_request_id bigint;
begin
  select decrypted_secret
    into v_function_url
  from vault.decrypted_secrets
  where name = 'review_reminders_function_url'
  limit 1;

  select decrypted_secret
    into v_cron_secret
  from vault.decrypted_secrets
  where name = 'review_reminders_cron_secret'
  limit 1;

  if nullif(trim(v_function_url), '') is null
     or nullif(trim(v_cron_secret), '') is null then
    raise log 'review reminder cron skipped: missing Vault secrets review_reminders_function_url or review_reminders_cron_secret';
    return null;
  end if;

  select net.http_post(
    url := v_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_cron_secret
    ),
    body := jsonb_build_object('triggered_at', now()),
    timeout_milliseconds := 10000
  )
  into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function public.invoke_due_review_reminders() from public, anon, authenticated;

select cron.schedule(
  'database-monster-due-review-reminders',
  '0 23 * * *',
  $$ select public.invoke_due_review_reminders(); $$
);

commit;
