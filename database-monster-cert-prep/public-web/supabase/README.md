# Supabase setup

This directory contains the database and security setup for individual Database Monster accounts.

## 1. Create a Supabase project

1. Sign in at [supabase.com](https://supabase.com).
2. Create a new project and choose a strong database password.
3. Wait for the project to finish provisioning.
4. In **Authentication → URL Configuration**, set:
   - Site URL: `https://database-monster-cert-prep.vercel.app`
   - Redirect URLs:
     - `http://localhost:3000/auth/confirm`
      - `http://localhost:3000/update-password`
     - `https://database-monster-cert-prep.vercel.app/auth/confirm`
     - `https://database-monster-cert-prep.vercel.app/update-password`

These values are also versioned in `config.toml`. After linking the correct project, apply
configuration changes with:

```bash
npx supabase config push
```

Review the displayed remote/local diff before applying future changes. The committed configuration
preserves email confirmation, eight-digit OTPs, resend throttling, and TOTP MFA.

## 2. Get the URL and anon key

Open **Project Settings → API** and copy:

- Project URL
- Anon/public key (or the current publishable key)

Do not use or expose the service-role key in this application.

## 3. Configure local variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

On PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Fill in:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-OR-PUBLISHABLE-KEY
```

Restart `npm run dev` after changing environment variables. `.env.local` is ignored by Git.

## 4. Run migrations

Preferred CLI workflow:

```bash
npx supabase link --project-ref cpvxtbeikqjvbcxjpapf
npx supabase migration list
npx supabase db push
```

Prefer `npx supabase db push` so migration history stays synchronized. The migrations create private progress tables, RLS policies, profile automation, the opt-in leaderboard, the public suggestions board, and the avatar Storage bucket.

The avatar migration creates a public `avatars` bucket with:

- a 2 MB object limit;
- JPEG, PNG, and WebP MIME allow-listing;
- immutable random object names inside the authenticated user's UUID folder;
- owner-only insert, management-select, and delete policies;
- a profile constraint that prevents referencing another user's avatar path.

Public delivery is intentional because leaderboard cards can be viewed while signed out. Uploading, replacing, and removing files still requires a valid authenticated session.

The Phase 4 reminder migration adds opt-in email reminders for due spaced-review
cards. It also creates a daily cron job that calls the `send-due-reminders` Edge
Function only when the required Vault secrets are present. See
`supabase/functions/README.md` for the required Resend, Edge Function, and Vault
setup.

## 5. Configure email authentication

In **Authentication → Providers → Email**:

- Enable email/password authentication.
- Keep email confirmation enabled for a public classroom deployment.
- Configure an SMTP provider before relying on production reset/confirmation delivery.
- Customize the confirmation and password-reset emails without adding real exam content.

For local-only testing, you may temporarily disable confirmation, but re-enable it before inviting classmates.

## 6. Add variables to Vercel

In Vercel, open the project and go to **Settings → Environment Variables**. Add both variables to Preview and Production:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Redeploy after saving them:

```bash
vercel --prod
```

## 7. Test Row Level Security

The SQL Editor normally uses elevated privileges and can bypass RLS. Test ownership with two normal Auth users through the app:

1. Register User A and complete an exam.
2. Record User A's attempt ID.
3. Sign out and register User B.
4. Confirm User B's dashboard/history does not show User A's attempt.
5. In the browser network tools, try selecting/updating User A's ID while signed in as User B. The API must return no row or an RLS error.

For a direct SQL policy check, replace the UUIDs below with real test users and run in a transaction:

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'USER_A_UUID', true);

select * from public.exam_attempts;
-- Only USER_A_UUID rows should be visible.

insert into public.exam_attempts (
  user_id, exam_mode, score, total_questions, correct_count
) values (
  'USER_B_UUID', 'rls-test', 100, 1, 1
);
-- Must fail because auth.uid() is USER_A_UUID.

rollback;
```

## 8. Keep sensitive rows private

- Do not create `anon` SELECT policies on the five user tables.
- Migration 002 explicitly revokes table access from `anon` and `public`.
- Never disable RLS on a user table.
- Never place the service-role key in Vercel frontend variables.
- Do not expose tables through a custom server endpoint unless it also verifies the user.
- Periodically review policies in **Database → Policies**.

## 9. Recovery and deletion

Deleting a user from Supabase Auth cascades to their profile, attempts, question results, mistake notebook, topic progress, suggestions, and votes. Supabase Storage objects are separate from Postgres row cascades; remove the user's avatar through the app before administrative account deletion.
