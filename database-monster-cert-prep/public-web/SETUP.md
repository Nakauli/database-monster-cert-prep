# Deployment & setup checklist

End-to-end setup for the public web app + Supabase backend. Most of this is already
done for the live project (`project_ref = cpvxtbeikqjvbcxjpapf`); this file is the
durable reference for re-provisioning or onboarding a new environment.

Run all commands from `database-monster-cert-prep/public-web`.

## 1. Web app (Vercel) — DONE

- Deployed to Vercel with root directory `database-monster-cert-prep/public-web`.
- Required env vars (Project Settings → Environment Variables):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Never expose the service-role key in this app.

## 2. Local dev

```bash
cp .env.example .env.local   # then fill in the Project URL + anon/publishable key
npm install
npm run dev                  # http://localhost:3000
```

## 3. Supabase auth configuration

Auth URLs, email confirmation, OTP, and MFA are versioned in `supabase/config.toml`
(Site URL `https://database-monster-cert-prep.vercel.app`, plus localhost +
production `/auth/confirm` and `/update-password` redirect URLs). Apply them to the
live project:

```bash
npx supabase login
npx supabase link --project-ref cpvxtbeikqjvbcxjpapf
npx supabase config push   # review the remote/local diff before applying
```

## 4. Database migrations

All migrations in `supabase/migrations/` are applied to the live project (verified
in `supabase_migrations.schema_migrations`). Current set includes the SRS + streaks
foundation (`007`, `008`), Phase 4 reminders, and Phase 5 social rewards.

To apply future migrations: `npx supabase db push` (after `link`), or paste the SQL
into the Supabase SQL editor.

## 5. Phase 4 — review-reminder Edge Function (PENDING DEPLOY)

The opt-in email reminder for due SRS cards. DB side (the `invoke_due_review_reminders()`
function + the `database-monster-due-review-reminders` pg_cron job at `0 23 * * *`) is
already applied. What remains is deploying the function and providing secrets.

### Prerequisites
- A **Resend** account + API key, with a **verified sending domain** for
  `REMINDER_EMAIL_FROM` (for testing only, `onboarding@resend.dev` delivers to the
  Resend account owner's address).
- A random shared secret used in **both** the function env (`REMINDER_CRON_SECRET`)
  and the Vault entry (`review_reminders_cron_secret`) — they must match.

### Deploy

```bash
# generate ONE cron secret and reuse it in both places below
CRON_SECRET=$(openssl rand -hex 32); echo "save this -> $CRON_SECRET"

npx supabase functions deploy send-due-reminders --project-ref cpvxtbeikqjvbcxjpapf

# NOTE: do NOT set SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY here — names starting
# with SUPABASE_ are reserved and auto-injected into deployed Edge Functions.
npx supabase secrets set --project-ref cpvxtbeikqjvbcxjpapf \
  RESEND_API_KEY="<resend-api-key>" \
  REMINDER_EMAIL_FROM="Database Monster <noreply@your-verified-domain>" \
  REMINDER_APP_URL="https://database-monster-cert-prep.vercel.app" \
  REMINDER_CRON_SECRET="$CRON_SECRET"
```

### Vault secrets (Supabase SQL editor)

The cron job reads two Vault secrets. Set the function URL and the **same**
`$CRON_SECRET` value:

```sql
select vault.create_secret(
  'https://cpvxtbeikqjvbcxjpapf.supabase.co/functions/v1/send-due-reminders',
  'review_reminders_function_url',
  'Edge function URL for review reminders'
);
select vault.create_secret(
  '<same value as REMINDER_CRON_SECRET>',
  'review_reminders_cron_secret',
  'Shared secret for review reminder cron'
);
-- If a secret already exists, use vault.update_secret(id, ...) instead.
```

### Smoke test

```bash
curl -i -X POST "https://cpvxtbeikqjvbcxjpapf.supabase.co/functions/v1/send-due-reminders" \
  -H "x-cron-secret: $CRON_SECRET"
```

Expect `200` with `{"sent":N,"skipped":...}`. `401` = cron-secret mismatch;
`"Missing required secrets"` = a secret did not set. The function only emails users
who opted in (`profiles.review_reminders_opt_in`) and have cards due.

## 6. Optional — Supabase MCP for AI tooling

`.mcp.json` registers the project-scoped Supabase MCP server. Authenticate once in a
regular terminal: run `claude`, then `/mcp`, select `supabase`, and complete the OAuth
flow. (Note: the MCP cannot deploy Edge Functions or set their secrets — use the CLI
steps in section 5.)

## Security notes

- Service-role key: only used server-side by the Edge Function (auto-injected); never
  shipped to the browser.
- Rotate any secret that has been pasted into a chat/transcript.
- `.mcp.json` references the production `project_ref`; it is safe to commit (no secret),
  but collaborators will be prompted to trust/enable the server.
