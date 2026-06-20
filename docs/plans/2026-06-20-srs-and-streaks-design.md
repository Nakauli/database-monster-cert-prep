# Spaced Repetition + Streaks — Phase 1 Design

**Date:** 2026-06-20
**Status:** Implemented (Phase 1)
**Scope:** `database-monster-cert-prep/public-web` (Next.js + Supabase)

## Why

The platform already has flashcards, a mistake notebook, exams, and readiness
scoring — but nothing is *scheduled* and nothing rewards *returning*. Flashcards
and the mistake notebook are static lists; "Got it" deletes the card and throws
away the signal. This phase turns existing content into a daily-return habit and
directly improves retention, which moves every goal at once (exam results, daily
engagement, usability, learning quality).

This is **Phase 1** of a larger roadmap (see appendix). It builds the shared data
foundation the later phases lean on.

## Key decision

**Extend `mistake_notebook` with SRS columns instead of adding a parallel
`review_schedule` table.** The notebook is already the per-user, per-question
review set with question snapshots, and `FlashcardReview` already grades cards
Again/Hard/Got-it. A second table would duplicate that. So SRS becomes columns on
the existing table, and **"mastered" schedules a long interval rather than
deleting** — progress is never lost.

## Section 1 — Data model

Migration `007_srs_and_streaks.sql` (follows the existing `001` conventions:
`begin/commit`, `gen_random_uuid()`, per-user `unique`, `(user_id, …)` indexes,
RLS, `security invoker` RPCs).

```sql
-- SRS fields on the existing notebook (SM-2 lite)
alter table public.mistake_notebook
  add column ease numeric(4,2) not null default 2.50,
  add column interval_days integer not null default 0,
  add column reps integer not null default 0,
  add column next_review_at timestamptz not null default now(),
  add column last_reviewed_at timestamptz;

create index mistake_notebook_user_due_idx
  on public.mistake_notebook (user_id, next_review_at);

-- One streak row per user
create table public.user_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  daily_goal integer not null default 10 check (daily_goal > 0),
  updated_at timestamptz not null default now()
);
```

Two new `security invoker` RPCs (matching `save_exam_result`):

- `review_card(p_mistake_id uuid, p_grade text)` — `grade ∈ {again,hard,good,easy}`.
  Applies SM-2 to update `ease/interval_days/reps/next_review_at/last_reviewed_at`,
  then calls the streak update. Server-side write is authoritative.
- `touch_streak()` — bumps `current_streak` if `last_active_date` is yesterday,
  resets to 1 if older, no-op if today; updates `longest_streak`. Called by
  `review_card` and by `save_exam_result`.

RLS: same per-user policies as existing tables (`user_id = auth.uid()`), added to
`002_enable_rls_policies.sql` style. `user_streaks` rows are seeded lazily by
`touch_streak()` itself (`insert ... on conflict (user_id) do nothing`), and
`getDashboardData` falls back to a zeroed streak when no row exists yet — so no
profile-trigger change is required.

## Section 2 — Algorithm & review UX

**SM-2 lite** (deliberately simpler than full SM-2; right-sized for a cohort):

```
review_card(grade):
  if grade == 'again':
    reps = 0;  interval = 0 (due again today);  ease -= 0.20
  else:
    reps += 1
    if   reps == 1: interval = 1
    elif reps == 2: interval = 3
    else:           interval = round(interval * ease)
    if grade == 'hard': interval = max(1, round(interval*0.6)); ease -= 0.15
    if grade == 'easy': interval = round(interval*1.3);        ease += 0.15
  ease = clamp(ease, 1.30, 3.00)
  next_review_at = now() + interval days
  mistake_count unchanged (history);  last_reviewed_at = now()
```

`FlashcardReview` changes (`MistakesClient` / `mistakes/page.tsx`):

- Queue seeded from cards where `next_review_at <= now()` (due today),
  most-overdue first — not the whole notebook.
- Replace the 3 buttons with **four grades: Again / Hard / Good / Easy**. Each
  calls `review_card(id, grade)` instead of resolve-and-delete.
- "Read lesson" deep-link stays (already wired via `hrefForReviewFile`).
- Session-complete panel shows "Next due: tomorrow / in 3 days" instead of
  "removed from notebook."

New lib module `src/lib/srs.ts` — pure functions (`computeNextReview(card, grade)`,
`isDue(card, now)`, `dueCount(cards, now)`), unit-testable without Supabase. The
client computes optimistically for instant UI; the `review_card` RPC is the source
of truth so intervals can't be faked.

## Section 3 — Dashboard & tests

`getDashboardData` gains two cheap queries inside the existing `Promise.all`:

- `dueCount` — `mistake_notebook` count where `next_review_at <= now()`.
- `streak` — the user's `user_streaks` row (or defaults if none yet).

Three new surfaces on `HomeDashboard`, reusing existing `Card`/`ProgressRing`:

1. **"Due today" card** — `N cards due` + primary "Start review" → `/mistakes`.
   When `N=0`: "All caught up — next due in X." The daily hook.
2. **Streak chip** — `🔥 current` with `longest` as subtext + a daily-goal ring
   (`reviews today / daily_goal`), reusing `ProgressRing`.
3. **Activity heatmap** — 12-week calendar grid colored by reviews/day, derived
   from `last_reviewed_at` + attempt dates already in scope. No new table.

**Test plan** (`node:test` + `tsx`, matching existing `*.test.ts`; new files added
to the `test:sql` script in `package.json`):

- `srs.test.ts` — interval progression (0→1→3→ease-scaled), Again resets reps +
  drops ease, Hard/Easy modifiers, ease clamping at 1.30/3.00, `isDue`/`dueCount`
  boundaries.
- `streak.test.ts` (pure helper extracted from RPC logic) — yesterday→increment,
  today→no-op, 2+ day gap→reset to 1, `longest` tracking.
- Manual/SQL test of the two RPCs against local Supabase (per `supabase/README.md`).

## Out of scope (deferred on purpose)

- Reminders / web-push → Phase 4.
- Streak-milestone badges → Phase 5.
- SRS over *learn* flashcards (not just mistakes) → later; current flashcard
  source is the notebook.
- `daily_activity` rollup table — only if per-day heatmap counts get expensive.

## Implementation note

`public-web/AGENTS.md` warns this is a non-standard Next.js with breaking changes;
read `node_modules/next/dist/docs/` before writing route/server code.

---

## Appendix — Full roadmap

- **Phase 1 (this doc):** SRS + streaks — shared data foundation.
- **Phase 2 — Adaptive remediation:** wrong answers auto-enroll into SRS;
  results screen builds a micro-drill from weakest topics; each miss deep-links to
  its lesson + matching SQL lab.
- **Phase 3 — Onboarding & exam realism:** first-run intro → diagnostic →
  personalized roadmap; audit `ExamClient` for timer, flag-for-review,
  review-before-submit.
- **Phase 4 — Reminders:** email / web-push "your queue is due today."
- **Phase 5 — Social & rewards:** achievements/badges (incl. streak + mastery
  milestones) and cohort/weekly challenges on the existing leaderboard.
