# Supabase Edge Functions

## `send-due-reminders`

Sends opt-in spaced-review reminder emails through Resend. The function is meant
to be invoked by the scheduled database job created in
`20260620155408_phase_4_review_reminders.sql`.

The function is intentionally safe when secrets are missing: it returns a JSON
`skipped` response and sends no email.

### Required Edge Function secrets

Set these in Supabase Edge Function secrets before enabling reminders:

```bash
supabase secrets set \
  RESEND_API_KEY=... \
  REMINDER_EMAIL_FROM="Database Monster <reviews@your-domain.example>" \
  REMINDER_APP_URL="https://database-monster-cert-prep.vercel.app" \
  REMINDER_CRON_SECRET="generate-a-long-random-secret"
```

The function also needs one Supabase admin key source:

```bash
# Current key model, available by default on hosted Supabase:
SUPABASE_SECRET_KEYS

# Or legacy fallback:
SUPABASE_SERVICE_ROLE_KEY
```

Never expose the service-role or secret key in frontend/Vercel public variables.

### Required Vault secrets for the scheduled database job

The database cron job calls the Edge Function through `pg_net`. Store the
function URL and the same cron secret in Supabase Vault:

```sql
select vault.create_secret(
  'https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-due-reminders',
  'review_reminders_function_url'
);

select vault.create_secret(
  'the-same-value-as-REMINDER_CRON_SECRET',
  'review_reminders_cron_secret'
);
```

If either Vault secret is absent, `public.invoke_due_review_reminders()` logs a
skip and returns `null`.

### Deploy

```bash
supabase functions deploy send-due-reminders --no-verify-jwt
```

`supabase/config.toml` also sets `verify_jwt = false` for this function because
the cron call uses `x-cron-secret` instead of a user JWT.

### Schedule

The migration schedules `database-monster-due-review-reminders` for:

```text
0 23 * * *
```

Supabase cron uses UTC, so this runs daily at 7:00 AM Asia/Manila.
