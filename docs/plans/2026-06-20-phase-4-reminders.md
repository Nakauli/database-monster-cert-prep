# Phase 4 — Reminders

**Date:** 2026-06-20
**Branch:** `feat/phase-4-reminders`
**Status:** Implemented, with manual Edge Function deploy/secrets remaining

## Goal

Pull students back when spaced-review cards are due, while keeping reminders
strictly opt-in and safe when production email secrets are not configured.

## Implementation Notes

- Added `profiles.review_reminders_opt_in` and
  `profiles.review_reminders_last_sent_at`.
- Added a profile setting so signed-in students can opt in or out of due-card
  reminder emails.
- Added `src/lib/reminders.ts` for pure reminder decisions and email copy:
  opt-in filtering, once-per-UTC-day throttling, due-topic summaries, and safe
  HTML/text email body generation.
- Added `supabase/functions/send-due-reminders`:
  - reads Supabase admin key from `SUPABASE_SECRET_KEYS` or legacy
    `SUPABASE_SERVICE_ROLE_KEY`
  - reads Resend from `RESEND_API_KEY`
  - requires `REMINDER_CRON_SECRET`
  - skips safely when required secrets are absent
  - sends one email per opted-in user with due cards
  - updates `review_reminders_last_sent_at` only after a successful send
- Added a scheduled database job using `pg_cron` + `pg_net`:
  - job: `database-monster-due-review-reminders`
  - schedule: `0 23 * * *` UTC, daily at 7:00 AM Asia/Manila
  - invoker: `public.invoke_due_review_reminders()`
  - returns `null` without configured Vault secrets, so applying the migration
    does not send email by accident.

## Supabase Verification

Applied migration through Supabase MCP as `20260620155408_phase_4_review_reminders`.

Verified:

- `profiles.review_reminders_opt_in` exists, `boolean not null default false`.
- `profiles.review_reminders_last_sent_at` exists.
- `pg_cron` and `pg_net` are installed.
- `public.invoke_due_review_reminders()` exists as `security invoker`.
- `cron.job` contains active job `database-monster-due-review-reminders`.
- `public.invoke_due_review_reminders()` returns `null` when Vault secrets are
  missing.

Advisor notes:

- Existing suggestion-board RLS/security-definer notices remain from previous
  features.
- Enabling `pg_net` installed it in `public`, which Supabase advisor warns about.
  This follows the hosted docs examples for scheduled Edge Function calls and is
  documented for later hardening.

## Manual Deploy / Env Setup

The local machine does not have `deno` or the Supabase CLI installed, so the Edge
Function was typechecked by the app TypeScript gate but not deployed from this
branch.

Required production setup:

1. Deploy function:
   ```sh
   supabase functions deploy send-due-reminders --no-verify-jwt
   ```
2. Set Edge Function secrets:
   ```sh
   supabase secrets set \
     RESEND_API_KEY=... \
     REMINDER_EMAIL_FROM="Database Monster <reviews@your-domain.example>" \
     REMINDER_APP_URL="https://database-monster-cert-prep.vercel.app" \
     REMINDER_CRON_SECRET="same-long-secret-as-vault"
   ```
3. Set Vault secrets:
   ```sql
   select vault.create_secret(
     'https://YOUR-PROJECT-REF.supabase.co/functions/v1/send-due-reminders',
     'review_reminders_function_url'
   );

   select vault.create_secret(
     'same-long-secret-as-REMINDER_CRON_SECRET',
     'review_reminders_cron_secret'
   );
   ```

## Verification Plan

Run from `database-monster-cert-prep/public-web`:

```sh
npm run typecheck
npm run lint
npm run test:sql
npm run build
```

Manual smoke checks:

- Toggle reminders in `/profile`, save, refresh, and confirm the checkbox stays
  on/off.
- With secrets configured, invoke `send-due-reminders` with `x-cron-secret` and
  confirm only opted-in users with due cards receive email.
- Confirm a successful send updates `profiles.review_reminders_last_sent_at`.
