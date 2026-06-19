# Database Monster Public Web App

A premium, account-backed, unofficial Certiport-style database fundamentals practice simulator. It contains original practice material and does not copy official branding, interfaces, real exam questions, leaked content, or exam dumps.

## Features

- Supabase email/password registration, login, confirmation, reset, and logout
- Private profile, exam history, topic mastery, and mistake notebook
- Row Level Security on every user-specific table
- Atomic exam saving through the `save_exam_result` Postgres function
- Diagnostic, 50-minute timed, Final Boss, Panic Review, and topic practice
- 360 original questions with randomized question and choice order
- SQL blocks, schemas, tables, and result grids
- Review marking, unanswered warnings, and detailed result explanations
- Public study roadmaps, SQL labs, landing page, and disclaimer
- Dark-first theme with light mode
- Sora display typography, Manrope UI/exam typography, and JetBrains Mono for SQL

## Required environment variables

Copy `.env.example` to `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-OR-PUBLISHABLE-KEY
```

Never commit `.env.local`. Never expose a Supabase service-role key.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Verification:

```bash
npm run test:data
npm run lint
npm run typecheck
npm run build
npm run audit
```

## Supabase setup

1. Create a Supabase project.
2. Add localhost and production auth redirect URLs.
3. Run the three files in `supabase/migrations/` in order.
4. Add the URL and anon/publishable key to `.env.local`.
5. Create two test users and verify they cannot see each other's data.

The complete procedure and RLS test are in [supabase/README.md](supabase/README.md).

## How authentication works

The app uses `@supabase/ssr` with cookie-based browser/server clients. `src/proxy.ts` refreshes sessions and redirects users:

- Public: `/`, `/roadmap`, `/labs`, `/about`, `/login`, `/register`, `/forgot-password`
- Protected: `/dashboard`, `/exam`, `/practice`, `/results`, `/mistakes`, `/history`, `/profile`

Passwords are submitted directly to Supabase Auth. The application does not store, hash, log, or inspect passwords.

## How progress is saved

After submission, the client calls the authenticated `save_exam_result` RPC. One database transaction:

1. Inserts the exam attempt.
2. Inserts every question attempt.
3. Upserts wrong answers into the user's mistake notebook.
4. Updates cumulative topic mastery.

Permanent progress lives in Supabase. `localStorage` is limited to theme, last mode, and a temporary unfinished exam draft.

## RLS ownership

Every user-specific table has RLS enabled. Policies compare `auth.uid()` with `user_id`; `profiles` compares `auth.uid()` with `id`. Anonymous table access is explicitly revoked. The service-role key is never used by the frontend.

## Deploy to Vercel

Add both Supabase variables under **Settings → Environment Variables** for Preview and Production. Then:

```bash
vercel
vercel --prod
```

The Vercel security headers permit connections only to the app origin and Supabase, block framing, disable unneeded browser permissions, and prevent MIME sniffing.

## Testing with classmates

1. Create two disposable accounts.
2. Complete different exams in each.
3. Verify dashboards, histories, and mistakes remain different.
4. Verify email confirmation and password reset delivery.
5. Test mobile exam navigation and SQL horizontal scrolling.
6. Delete one test Auth user and confirm their rows cascade.

## Font rules

- Public brand, hero, and dashboard headings: **Sora**
- UI, buttons, forms, and exam questions: **Manrope**
- SQL, schemas, table values, columns, and errors: **JetBrains Mono**

Decorative/display typography is not applied to exam questions.

## Security

See [SECURITY.md](SECURITY.md). Run dependency audits regularly and update Next.js/Supabase packages deliberately.

