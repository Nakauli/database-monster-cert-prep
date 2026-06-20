# SRS + Streaks (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing mistake notebook into a spaced-repetition review queue and add study streaks, surfaced on the dashboard.

**Architecture:** Add SM-2-lite scheduling columns to the existing `mistake_notebook` table (no parallel table) plus a `user_streaks` table. Pure scheduling/streak math lives in tiny testable TS modules (`srs.ts`, `streak.ts`); the authoritative writes go through two `security invoker` Postgres RPCs (`review_card`, `touch_streak`). The mistakes flashcard view grades cards Again/Hard/Good/Easy and reschedules instead of deleting; the dashboard shows a "due today" card, a streak chip, and a 12-week activity heatmap.

**Tech Stack:** Next.js (non-standard fork — read `node_modules/next/dist/docs/` before route/server edits), TypeScript, Supabase Postgres + RLS, `node:test` + `tsx` for unit tests, Tailwind + existing shadcn-style UI components.

**Design doc:** `docs/plans/2026-06-20-srs-and-streaks-design.md`

**Working directory for all paths below:** `database-monster-cert-prep/public-web/`

---

## File Structure

- Create: `supabase/migrations/007_srs_and_streaks.sql` — SRS columns, `user_streaks` table, RLS, `review_card` + `touch_streak` RPCs.
- Create: `src/lib/srs.ts` — pure SM-2-lite scheduling (`computeNextReview`, `isDue`, `dueCount`).
- Create: `src/lib/srs.test.ts` — unit tests for scheduling.
- Create: `src/lib/streak.ts` — pure streak transition (`applyActivity`, `todayUtc`).
- Create: `src/lib/streak.test.ts` — unit tests for streak transitions.
- Modify: `package.json` — add the two new test files to `test:sql`.
- Modify: `src/lib/progress.ts` — extend `MistakeRow`, select SRS columns, add `getDashboardData` due-count + streak queries, add `UserStreakRow`.
- Modify: `src/lib/exam-save.ts` — call `touch_streak` after a successful exam save.
- Modify: `src/components/FlashcardReview.tsx` — 4 grade buttons calling `review_card`; due-only queue; "next due" completion copy.
- Modify: `src/components/MistakesClient.tsx` — seed flashcard queue from due cards; pass a `reviewCard` handler.
- Modify: `src/lib/progress.ts` consumers + `src/components/HomeDashboard.tsx` — due-today card, streak chip, heatmap. (HomeDashboard exact wiring confirmed during Task 8.)

---

## Task 1: Database migration (SRS columns, streaks table, RPCs)

**Files:**
- Create: `supabase/migrations/007_srs_and_streaks.sql`

This task has no automated test (SQL migration). Verification is applying it to a local Supabase per `supabase/README.md` and confirming the columns/functions exist.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/007_srs_and_streaks.sql`:

```sql
begin;

-- 1. SRS scheduling fields on the existing notebook (SM-2 lite).
alter table public.mistake_notebook
  add column if not exists ease numeric(4,2) not null default 2.50,
  add column if not exists interval_days integer not null default 0,
  add column if not exists reps integer not null default 0,
  add column if not exists next_review_at timestamptz not null default now(),
  add column if not exists last_reviewed_at timestamptz;

create index if not exists mistake_notebook_user_due_idx
  on public.mistake_notebook (user_id, next_review_at);

-- 2. One streak row per user.
create table if not exists public.user_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_active_date date,
  daily_goal integer not null default 10 check (daily_goal > 0),
  updated_at timestamptz not null default now()
);

alter table public.user_streaks enable row level security;
revoke all on public.user_streaks from public, anon;
grant select, insert, update, delete on public.user_streaks to authenticated;

drop policy if exists "user_streaks_select_own" on public.user_streaks;
create policy "user_streaks_select_own"
on public.user_streaks for select
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "user_streaks_insert_own" on public.user_streaks;
create policy "user_streaks_insert_own"
on public.user_streaks for insert
to authenticated
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "user_streaks_update_own" on public.user_streaks;
create policy "user_streaks_update_own"
on public.user_streaks for update
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()))
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "user_streaks_delete_own" on public.user_streaks;
create policy "user_streaks_delete_own"
on public.user_streaks for delete
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

-- 3. Streak bump (idempotent per UTC day).
create or replace function public.touch_streak()
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_last date;
  v_current integer;
  v_longest integer;
  v_today date := (now() at time zone 'utc')::date;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;

  insert into public.user_streaks (user_id, current_streak, longest_streak, last_active_date)
  values (v_user_id, 1, 1, v_today)
  on conflict (user_id) do nothing;

  select last_active_date, current_streak, longest_streak
    into v_last, v_current, v_longest
  from public.user_streaks
  where user_id = v_user_id
  for update;

  if v_last = v_today then
    return; -- already counted today
  elsif v_last = v_today - 1 then
    v_current := v_current + 1;
  else
    v_current := 1;
  end if;

  v_longest := greatest(v_longest, v_current);

  update public.user_streaks
  set current_streak = v_current,
      longest_streak = v_longest,
      last_active_date = v_today,
      updated_at = now()
  where user_id = v_user_id;
end;
$$;

revoke all on function public.touch_streak() from public, anon;
grant execute on function public.touch_streak() to authenticated;

-- 4. Review a card: apply SM-2 lite, then bump the streak.
create or replace function public.review_card(p_mistake_id uuid, p_grade text)
returns timestamptz
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_ease numeric(4,2);
  v_interval integer;
  v_reps integer;
  v_next timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;
  if p_grade not in ('again', 'hard', 'good', 'easy') then
    raise exception 'Invalid grade: %', p_grade;
  end if;

  select ease, interval_days, reps
    into v_ease, v_interval, v_reps
  from public.mistake_notebook
  where id = p_mistake_id and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Card not found';
  end if;

  if p_grade = 'again' then
    v_reps := 0;
    v_interval := 0;
    v_ease := v_ease - 0.20;
  else
    v_reps := v_reps + 1;
    if v_reps = 1 then
      v_interval := 1;
    elsif v_reps = 2 then
      v_interval := 3;
    else
      v_interval := round(v_interval * v_ease);
    end if;

    if p_grade = 'hard' then
      v_interval := greatest(1, round(v_interval * 0.6));
      v_ease := v_ease - 0.15;
    elsif p_grade = 'easy' then
      v_interval := round(v_interval * 1.3);
      v_ease := v_ease + 0.15;
    end if;
  end if;

  v_ease := least(3.00, greatest(1.30, v_ease));
  v_next := now() + (v_interval || ' days')::interval;

  update public.mistake_notebook
  set ease = v_ease,
      interval_days = v_interval,
      reps = v_reps,
      next_review_at = v_next,
      last_reviewed_at = now()
  where id = p_mistake_id and user_id = v_user_id;

  perform public.touch_streak();
  return v_next;
end;
$$;

revoke all on function public.review_card(uuid, text) from public, anon;
grant execute on function public.review_card(uuid, text) to authenticated;

commit;
```

- [ ] **Step 2: Verify it applies against local Supabase**

Run (per `supabase/README.md`):
```bash
supabase db reset
```
Expected: all migrations apply with no error, ending at `007_srs_and_streaks.sql`. If `supabase` CLI is unavailable locally, instead paste the file into the Supabase SQL editor and confirm "Success".

- [ ] **Step 3: Spot-check the schema**

Run in the SQL editor (or `supabase db` psql):
```sql
select column_name from information_schema.columns
where table_name = 'mistake_notebook' and column_name in ('ease','interval_days','reps','next_review_at','last_reviewed_at');
select proname from pg_proc where proname in ('review_card','touch_streak');
```
Expected: 5 column rows and 2 function rows returned.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/007_srs_and_streaks.sql
git commit -m "feat: add SRS scheduling and streaks schema with RPCs"
```

---

## Task 2: SRS scheduling module (TDD)

**Files:**
- Create: `src/lib/srs.ts`
- Test: `src/lib/srs.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/srs.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { computeNextReview, dueCount, isDue } from "./srs";

const base = { ease: 2.5, intervalDays: 0, reps: 0 };
const now = new Date("2026-06-20T00:00:00.000Z");

function daysBetween(fromIso: string, to: Date): number {
  return Math.round((new Date(fromIso).getTime() - to.getTime()) / 86_400_000);
}

test("first 'good' review schedules 1 day out and increments reps", () => {
  const next = computeNextReview(base, "good", now);
  assert.equal(next.reps, 1);
  assert.equal(next.intervalDays, 1);
  assert.equal(daysBetween(next.nextReviewAt, now), 1);
});

test("second 'good' review schedules 3 days out", () => {
  const next = computeNextReview({ ease: 2.5, intervalDays: 1, reps: 1 }, "good", now);
  assert.equal(next.reps, 2);
  assert.equal(next.intervalDays, 3);
});

test("third 'good' review scales the interval by ease", () => {
  const next = computeNextReview({ ease: 2.5, intervalDays: 3, reps: 2 }, "good", now);
  assert.equal(next.reps, 3);
  assert.equal(next.intervalDays, 8); // round(3 * 2.5)
});

test("'again' resets reps, makes the card due today, and lowers ease", () => {
  const next = computeNextReview({ ease: 2.5, intervalDays: 8, reps: 3 }, "again", now);
  assert.equal(next.reps, 0);
  assert.equal(next.intervalDays, 0);
  assert.equal(next.ease, 2.3);
  assert.equal(daysBetween(next.nextReviewAt, now), 0);
});

test("'hard' shortens the interval and lowers ease", () => {
  const next = computeNextReview({ ease: 2.5, intervalDays: 10, reps: 3 }, "hard", now);
  assert.equal(next.intervalDays, 15); // round(round(10*2.5)=25 *0.6)=15
  assert.equal(next.ease, 2.35);
});

test("'easy' lengthens the interval and raises ease", () => {
  const next = computeNextReview({ ease: 2.5, intervalDays: 3, reps: 2 }, "easy", now);
  assert.equal(next.intervalDays, 10); // round(round(3*2.5)=8 *1.3)=10
  assert.equal(next.ease, 2.65);
});

test("ease never drops below 1.30", () => {
  const next = computeNextReview({ ease: 1.35, intervalDays: 5, reps: 3 }, "again", now);
  assert.equal(next.ease, 1.3);
});

test("ease never rises above 3.00", () => {
  const next = computeNextReview({ ease: 2.95, intervalDays: 5, reps: 3 }, "easy", now);
  assert.equal(next.ease, 3);
});

test("isDue and dueCount use next_review_at vs now", () => {
  const cards = [
    { nextReviewAt: "2026-06-19T00:00:00.000Z" }, // overdue
    { nextReviewAt: "2026-06-20T00:00:00.000Z" }, // due exactly now
    { nextReviewAt: "2026-06-21T00:00:00.000Z" }, // future
  ];
  assert.equal(isDue(cards[0], now), true);
  assert.equal(isDue(cards[2], now), false);
  assert.equal(dueCount(cards, now), 2);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --import tsx --test src/lib/srs.test.ts`
Expected: FAIL — cannot find module `./srs` / `computeNextReview is not a function`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/lib/srs.ts`:

```ts
export type ReviewGrade = "again" | "hard" | "good" | "easy";

export interface SrsCard {
  ease: number;
  intervalDays: number;
  reps: number;
}

export interface SrsState extends SrsCard {
  nextReviewAt: string;
}

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const DAY_MS = 86_400_000;

export function computeNextReview(card: SrsCard, grade: ReviewGrade, now: Date = new Date()): SrsState {
  let ease = card.ease;
  let reps = card.reps;
  let intervalDays: number;

  if (grade === "again") {
    reps = 0;
    intervalDays = 0;
    ease -= 0.2;
  } else {
    reps += 1;
    if (reps === 1) {
      intervalDays = 1;
    } else if (reps === 2) {
      intervalDays = 3;
    } else {
      intervalDays = Math.round(card.intervalDays * ease);
    }

    if (grade === "hard") {
      intervalDays = Math.max(1, Math.round(intervalDays * 0.6));
      ease -= 0.15;
    } else if (grade === "easy") {
      intervalDays = Math.round(intervalDays * 1.3);
      ease += 0.15;
    }
  }

  ease = Math.min(MAX_EASE, Math.max(MIN_EASE, ease));
  const nextReviewAt = new Date(now.getTime() + intervalDays * DAY_MS).toISOString();
  return { ease: Number(ease.toFixed(2)), intervalDays, reps, nextReviewAt };
}

export function isDue(card: { nextReviewAt: string }, now: Date = new Date()): boolean {
  return new Date(card.nextReviewAt).getTime() <= now.getTime();
}

export function dueCount(cards: Array<{ nextReviewAt: string }>, now: Date = new Date()): number {
  return cards.reduce((count, card) => (isDue(card, now) ? count + 1 : count), 0);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --import tsx --test src/lib/srs.test.ts`
Expected: PASS — 9 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/lib/srs.ts src/lib/srs.test.ts
git commit -m "feat: add SM-2-lite spaced-repetition scheduling module"
```

---

## Task 3: Streak transition module (TDD)

**Files:**
- Create: `src/lib/streak.ts`
- Test: `src/lib/streak.test.ts`

This mirrors the `touch_streak` RPC rules so the dashboard can reason about and (optionally) optimistically update streak state. The RPC remains authoritative.

- [ ] **Step 1: Write the failing test**

Create `src/lib/streak.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { applyActivity, type StreakState } from "./streak";

const start: StreakState = { currentStreak: 3, longestStreak: 5, lastActiveDate: "2026-06-19" };

test("activity the day after last active increments the streak", () => {
  const next = applyActivity(start, "2026-06-20");
  assert.equal(next.currentStreak, 4);
  assert.equal(next.lastActiveDate, "2026-06-20");
});

test("a second activity on the same day is a no-op", () => {
  const next = applyActivity({ currentStreak: 4, longestStreak: 5, lastActiveDate: "2026-06-20" }, "2026-06-20");
  assert.equal(next.currentStreak, 4);
  assert.equal(next.lastActiveDate, "2026-06-20");
});

test("a gap of 2+ days resets the streak to 1", () => {
  const next = applyActivity(start, "2026-06-22");
  assert.equal(next.currentStreak, 1);
});

test("the first ever activity starts the streak at 1", () => {
  const next = applyActivity({ currentStreak: 0, longestStreak: 0, lastActiveDate: null }, "2026-06-20");
  assert.equal(next.currentStreak, 1);
  assert.equal(next.longestStreak, 1);
});

test("longest streak only ever grows", () => {
  const next = applyActivity({ currentStreak: 5, longestStreak: 5, lastActiveDate: "2026-06-19" }, "2026-06-20");
  assert.equal(next.currentStreak, 6);
  assert.equal(next.longestStreak, 6);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --import tsx --test src/lib/streak.test.ts`
Expected: FAIL — cannot find module `./streak`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/lib/streak.ts`:

```ts
export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // YYYY-MM-DD (UTC)
}

const DAY_MS = 86_400_000;

export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function isPreviousDay(last: string, today: string): boolean {
  const diff = Date.parse(`${today}T00:00:00.000Z`) - Date.parse(`${last}T00:00:00.000Z`);
  return diff === DAY_MS;
}

export function applyActivity(state: StreakState, today: string): StreakState {
  if (state.lastActiveDate === today) {
    return state;
  }
  const currentStreak =
    state.lastActiveDate && isPreviousDay(state.lastActiveDate, today) ? state.currentStreak + 1 : 1;
  return {
    currentStreak,
    longestStreak: Math.max(state.longestStreak, currentStreak),
    lastActiveDate: today,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --import tsx --test src/lib/streak.test.ts`
Expected: PASS — 5 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/lib/streak.ts src/lib/streak.test.ts
git commit -m "feat: add pure streak transition helper"
```

---

## Task 4: Register new tests in the suite

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add the two files to `test:sql`**

In `package.json`, find the `test:sql` script and append the two new files to the `node --test` file list (keep the existing files):

```json
"test:sql": "node --import tsx --test src/lib/avatar.test.ts src/lib/sql-patterns.test.ts src/lib/sql-engine.test.ts src/lib/practice-drills.test.ts src/lib/readiness.test.ts src/lib/storage.test.ts src/lib/leaderboard.test.ts src/lib/learn.test.ts src/lib/suggestions.test.ts src/lib/srs.test.ts src/lib/streak.test.ts"
```

- [ ] **Step 2: Run the full suite**

Run: `npm run test:sql`
Expected: PASS — previous 30 tests plus the 14 new (9 SRS + 5 streak) = 44 tests, 0 failures.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "test: include SRS and streak suites in test:sql"
```

---

## Task 5: Surface SRS columns + streak/due data in the data layer

**Files:**
- Modify: `src/lib/progress.ts`

No new unit test (this is Supabase query plumbing, consistent with the rest of `progress.ts`, which is verified by typecheck + the dashboard rendering). Type correctness is the gate.

- [ ] **Step 1: Extend `MistakeRow` with SRS fields**

In `src/lib/progress.ts`, add these fields to the `MistakeRow` interface (after `last_mistaken_at`):

```ts
  next_review_at: string;
  interval_days: number;
  ease: number;
  reps: number;
  last_reviewed_at: string | null;
```

- [ ] **Step 2: Select the new columns in `getMistakes`**

In `getMistakes`, extend the `.select(...)` string to include the SRS columns:

```ts
    .select("id, question_id, topic, difficulty, question_snapshot, selected_answers, correct_answers, explanation, mistake_count, last_mistaken_at, next_review_at, interval_days, ease, reps, last_reviewed_at")
```

- [ ] **Step 3: Add a `UserStreakRow` type and dashboard queries**

Add the type near the other `*Row` interfaces:

```ts
export interface UserStreakRow {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  daily_goal: number;
}
```

In `getDashboardData`, add two more queries to the existing `Promise.all([...])` array:

```ts
    supabase
      .from("mistake_notebook")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .lte("next_review_at", new Date().toISOString()),
    supabase
      .from("user_streaks")
      .select("current_streak, longest_streak, last_active_date, daily_goal")
      .eq("user_id", userId)
      .maybeSingle(),
```

Destructure them (update the array destructuring to include the two new results, in order):

```ts
  const [attemptsResult, topicsResult, mistakesResult, profileResult, dueResult, streakResult] =
    await Promise.all([
```

Add error checks alongside the existing ones:

```ts
  if (dueResult.error) throw new Error(dueResult.error.message);
  if (streakResult.error) throw new Error(streakResult.error.message);
```

Extend the returned object:

```ts
  return {
    attempts: (attemptsResult.data ?? []) as ExamAttemptRow[],
    topics: (topicsResult.data ?? []) as TopicProgressRow[],
    mistakeCount: mistakesResult.count ?? 0,
    profile: profileResult.data as ProfileRow | null,
    dueCount: dueResult.count ?? 0,
    streak: (streakResult.data as UserStreakRow | null) ?? {
      current_streak: 0,
      longest_streak: 0,
      last_active_date: null,
      daily_goal: 10,
    },
  };
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS — no type errors. (If `HomeDashboard`/dashboard page reference the return type and break, that is expected and fixed in Task 8; if so, stop here and proceed — do not "fix" by reverting.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/progress.ts
git commit -m "feat: surface SRS due-count and streak data in dashboard query"
```

---

## Task 6: Grade-based flashcard review (replace delete-on-master)

**Files:**
- Modify: `src/components/FlashcardReview.tsx`
- Modify: `src/components/MistakesClient.tsx`

No component test framework exists in this repo; verification is `npm run typecheck` + `npm run lint` + a manual dev-server check.

- [ ] **Step 1: Change the `FlashcardReview` contract to grade cards**

In `src/components/FlashcardReview.tsx`, replace the `onResolve` prop with an `onGrade` handler and a 4-button grade row. Full new file:

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { EmptyPanel } from "@/components/DesignSystem";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hrefForReviewFile } from "@/lib/learn";
import type { MistakeRow } from "@/lib/progress";
import type { ReviewGrade } from "@/lib/srs";

const GRADES: Array<{ grade: ReviewGrade; label: string; variant: "outline" | "secondary" | "default" }> = [
  { grade: "again", label: "Again", variant: "outline" },
  { grade: "hard", label: "Hard", variant: "secondary" },
  { grade: "good", label: "Good", variant: "default" },
  { grade: "easy", label: "Easy", variant: "outline" },
];

function describeNext(intervalDays: number): string {
  if (intervalDays <= 0) return "due again today";
  if (intervalDays === 1) return "due tomorrow";
  return `due in ${intervalDays} days`;
}

export function FlashcardReview({
  mistakes,
  onGrade,
}: {
  mistakes: MistakeRow[];
  onGrade: (id: string, grade: ReviewGrade) => Promise<number | null>;
}) {
  const [queue, setQueue] = useState<MistakeRow[]>(() => [...mistakes]);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [grading, setGrading] = useState(false);
  const card = queue[0];

  async function grade(grade: ReviewGrade) {
    if (!card) return;
    setGrading(true);
    const intervalDays = await onGrade(card.id, grade);
    setGrading(false);
    if (intervalDays === null) return;
    setReviewed((current) => current + 1);
    setFlipped(false);
    // 'again' keeps the card in this session (requeue at the end); otherwise it leaves the queue.
    setQueue((current) =>
      grade === "again" && current.length > 1 ? [...current.slice(1), current[0]] : current.slice(1),
    );
  }

  if (!card) {
    return (
      <EmptyPanel
        description={`You reviewed ${reviewed} card${reviewed === 1 ? "" : "s"}. Come back when more are due.`}
        title="Review session complete."
      />
    );
  }

  const snapshot = card.question_snapshot as { question?: string; reviewFile?: string };
  const learnHref = hrefForReviewFile(snapshot.reviewFile);

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{queue.length} due</Badge>
          <Badge variant="outline">{reviewed} reviewed</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Most-overdue questions appear first.</p>
      </div>

      <Card
        className="flashcard-panel min-h-80 cursor-pointer transition hover:-translate-y-0.5 hover:shadow-[0_18px_60px_rgb(23_37_44_/_0.09)]"
        onClick={() => setFlipped((value) => !value)}
      >
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{card.topic}</Badge>
            <Badge variant="outline">{describeNext(card.interval_days)}</Badge>
          </div>
          <CardDescription>{flipped ? "Answer side" : "Question side"}</CardDescription>
          <span className="mono-label">Question</span>
          <CardTitle className="text-2xl leading-tight">{snapshot.question ?? `Question ${card.question_id}`}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {flipped ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                  <span className="mono-label">Your latest answer</span>
                  <strong className="mt-1 block">{card.selected_answers.join(", ") || "Unanswered"}</strong>
                </div>
                <div className="rounded-xl border border-primary/30 bg-accent/55 p-4">
                  <span className="mono-label">Correct answer</span>
                  <strong className="mt-1 block">{card.correct_answers.join(", ")}</strong>
                </div>
              </div>
              <Alert>
                <AlertTitle>Rule to remember</AlertTitle>
                <AlertDescription>{card.explanation ?? "Review the correct answer and try this topic again."}</AlertDescription>
              </Alert>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Answer it in your head first, then tap the card to reveal the answer and grade how well you knew it.
            </p>
          )}
        </CardContent>
      </Card>

      {flipped && (
        <div className="grid gap-3 sm:grid-cols-5" onClick={(event) => event.stopPropagation()}>
          {GRADES.map(({ grade: value, label, variant }) => (
            <Button key={value} type="button" variant={variant} disabled={grading} onClick={() => void grade(value)}>
              {label}
            </Button>
          ))}
          <Button asChild variant="ghost">
            <Link href={learnHref ?? "/learn"}>Read lesson</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Replace `removeMistake` with a `reviewCard` handler in `MistakesClient`**

In `src/components/MistakesClient.tsx`:

Add the import:
```ts
import { computeNextReview, isDue, type ReviewGrade } from "@/lib/srs";
```

Replace the `removeMistake` function (lines ~28-42) with:

```ts
  async function reviewCard(id: string, grade: ReviewGrade): Promise<number | null> {
    const supabase = createClient();
    if (!supabase) {
      setMessage("Account storage is not configured.");
      return null;
    }
    const { data, error } = await supabase.rpc("review_card", { p_mistake_id: id, p_grade: grade });
    if (error) {
      setMessage(error.message);
      return null;
    }
    const nextReviewAt = typeof data === "string" ? data : new Date().toISOString();
    const target = mistakes.find((mistake) => mistake.id === id);
    const local = computeNextReview(
      target
        ? { ease: target.ease, intervalDays: target.interval_days, reps: target.reps }
        : { ease: 2.5, intervalDays: 0, reps: 0 },
      grade,
    );
    setMistakes((current) =>
      current.map((mistake) =>
        mistake.id === id
          ? {
              ...mistake,
              next_review_at: nextReviewAt,
              interval_days: local.intervalDays,
              ease: local.ease,
              reps: local.reps,
              last_reviewed_at: new Date().toISOString(),
            }
          : mistake,
      ),
    );
    return local.intervalDays;
  }
```

Add a memo for the due queue (near the existing `repeated` memo):

```ts
  const dueMistakes = useMemo(() => {
    const now = new Date();
    return mistakes
      .filter((mistake) => isDue({ nextReviewAt: mistake.next_review_at }, now))
      .sort((a, b) => new Date(a.next_review_at).getTime() - new Date(b.next_review_at).getTime());
  }, [mistakes]);
```

Update the flashcards button's `disabled` and the flashcards render branch to use `dueMistakes`:

```tsx
              <Button type="button" variant={view === "flashcards" ? "secondary" : "outline"} onClick={() => setView("flashcards")} disabled={!dueMistakes.length}>
```

```tsx
      {view === "flashcards" && dueMistakes.length > 0 ? (
        <div className="mt-6">
          <FlashcardReview mistakes={dueMistakes} onGrade={reviewCard} />
        </div>
      ) : !visible.length ? (
```

In the notebook list's per-card button row, replace the "Mark as mastered" button with a "Review now" affordance that switches to flashcards (the SRS flow replaces manual deletion):

```tsx
                    <Button type="button" variant="outline" onClick={() => setView("flashcards")}>
                      Review in flashcards
                    </Button>
```

> Note: the `description`/copy `"Repeated misses rise to the top."` and the message string `"Mistake marked as mastered and removed."` are no longer accurate — update the success path: after a grade, set `setMessage(null)` is unnecessary; leave `message` for error display only. Remove the now-unused `setMessage("Mistake marked as mastered and removed.")` line (it lived in the deleted `removeMistake`).

- [ ] **Step 3: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS — no errors, no unused-symbol warnings (ensure `RotateCcw`/`CheckCircle` imports removed from `FlashcardReview` since the new version doesn't use them, and `hrefForReviewFile` import is still used by `MistakesClient`).

- [ ] **Step 4: Manual smoke check**

Run: `npm run dev`, sign in, open `/mistakes` with at least one saved mistake, switch to Flashcards, flip a card, click each grade once.
Expected: card advances, badge "N due" decrements (except `again`, which requeues), no console errors. (If Supabase env is not configured locally, this step is observation-only — confirm the UI renders and grade buttons appear; the RPC call will surface the "not configured" message, which is acceptable for this check.)

- [ ] **Step 5: Commit**

```bash
git add src/components/FlashcardReview.tsx src/components/MistakesClient.tsx
git commit -m "feat: grade flashcards with SRS instead of deleting mistakes"
```

---

## Task 7: Count exam activity toward the streak

**Files:**
- Modify: `src/lib/exam-save.ts`

- [ ] **Step 1: Call `touch_streak` after a successful save**

In `src/lib/exam-save.ts`, after the existing `save_exam_result` success check and before `return data`, add a best-effort streak bump (a streak failure must not fail the save):

```ts
  await supabase.rpc("touch_streak").catch(() => {
    /* streak bump is best-effort; never block exam save */
  });

  return data;
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/exam-save.ts
git commit -m "feat: count completed exams toward study streak"
```

---

## Task 8: Dashboard surfaces (due-today card, streak chip, heatmap)

**Files:**
- Modify: `src/components/HomeDashboard.tsx` (and, if the dashboard page passes typed props, `src/app/dashboard/page.tsx`)

Before editing, read the two files to confirm how `getDashboardData`'s result flows into `HomeDashboard` and which existing card/grid components are in use (`Card`, `ProgressRing`, `StatGrid`). Match the existing layout idiom rather than inventing a new one.

- [ ] **Step 1: Read the current dashboard wiring**

Run: open `src/components/HomeDashboard.tsx` and `src/app/dashboard/page.tsx`. Confirm the prop name carrying `getDashboardData`'s return (e.g. `data`) and where the top cards render.

- [ ] **Step 2: Add a "Due today" review card**

In `HomeDashboard`, add a card near the top of the primary grid. Use the existing `Card`/`Button` components:

```tsx
<Card>
  <CardHeader>
    <span className="mono-label">Spaced repetition</span>
    <CardTitle className="text-2xl">
      {data.dueCount > 0 ? `${data.dueCount} card${data.dueCount === 1 ? "" : "s"} due` : "All caught up"}
    </CardTitle>
    <CardDescription>
      {data.dueCount > 0
        ? "Clear your queue to lock in the topics you missed."
        : "No reviews due right now — great work."}
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Button asChild disabled={data.dueCount === 0}>
      <Link href="/mistakes">{data.dueCount > 0 ? "Start review" : "Open notebook"}</Link>
    </Button>
  </CardContent>
</Card>
```

(Import `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `Button`, and `Link` if not already imported.)

- [ ] **Step 3: Add a streak chip with a daily-goal ring**

Reuse `ProgressRing`. Add near the due card:

```tsx
<Card>
  <CardHeader>
    <span className="mono-label">Study streak</span>
    <CardTitle className="text-2xl">🔥 {data.streak.current_streak} day{data.streak.current_streak === 1 ? "" : "s"}</CardTitle>
    <CardDescription>Longest: {data.streak.longest_streak} days · Goal: {data.streak.daily_goal}/day</CardDescription>
  </CardHeader>
</Card>
```

> The daily-goal ring (reviews-done-today / `daily_goal`) needs a per-day "reviews today" count. That count is not in the current query and would require either a `last_reviewed_at = today` count or a future `daily_activity` rollup. For Phase 1, render the streak numbers above and defer the live ring; add a `// TODO(phase-1.1): live daily-goal ring needs reviews-today count` comment so it is not silently dropped. (This is an intentional scope trim, consistent with the design doc's heatmap note.)

- [ ] **Step 4: Add a lightweight 12-week activity heatmap**

Create a small inline grid driven by attempt dates already available in `data.attempts` (each has `created_at`). Build a `Set` of active `YYYY-MM-DD` strings and render 84 cells:

```tsx
function ActivityHeatmap({ activeDays }: { activeDays: Set<string> }) {
  const cells: Array<{ key: string; active: boolean }> = [];
  const today = new Date();
  for (let i = 83; i >= 0; i -= 1) {
    const day = new Date(today.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    cells.push({ key: day, active: activeDays.has(day) });
  }
  return (
    <div className="grid grid-flow-col grid-rows-7 gap-1" aria-label="Activity over the last 12 weeks">
      {cells.map((cell) => (
        <span
          key={cell.key}
          title={cell.key}
          className={`size-3 rounded-sm ${cell.active ? "bg-primary" : "bg-muted"}`}
        />
      ))}
    </div>
  );
}
```

Wrap it in a `Card` and compute `activeDays` from `data.attempts`:

```tsx
const activeDays = new Set(data.attempts.map((attempt) => attempt.created_at.slice(0, 10)));
```

(Phase 1 heatmap reflects exam activity; once a per-review activity feed exists it can fold `last_reviewed_at` in — note this with a `// TODO(phase-1.1)` comment.)

- [ ] **Step 5: Typecheck, lint, full test suite**

Run: `npm run typecheck && npm run lint && npm run test:sql`
Expected: PASS — 0 type errors, 0 lint errors, 44 tests passing.

- [ ] **Step 6: Manual smoke check**

Run: `npm run dev`, open `/dashboard`.
Expected: due-today card, streak chip, and heatmap render without console errors; "Start review" links to `/mistakes`.

- [ ] **Step 7: Commit**

```bash
git add src/components/HomeDashboard.tsx src/app/dashboard/page.tsx
git commit -m "feat: add due-today, streak, and activity heatmap to dashboard"
```

---

## Task 9: Final verification

- [ ] **Step 1: Full local gate**

Run: `npm run typecheck && npm run lint && npm run test:sql && npm run build`
Expected: all pass; `next build` completes. (If `build` requires Supabase env vars and fails only on missing env, note it and rely on typecheck/lint/tests as the gate — do not fabricate env values.)

- [ ] **Step 2: Update the design doc status**

In `docs/plans/2026-06-20-srs-and-streaks-design.md`, change `Status:` to `Implemented (Phase 1)` and commit:

```bash
git add docs/plans/2026-06-20-srs-and-streaks-design.md
git commit -m "docs: mark SRS + streaks Phase 1 as implemented"
```

---

## Notes for the implementer

- **Read `node_modules/next/dist/docs/` before editing any server component, route, or `page.tsx`** — this Next.js fork has breaking changes (`public-web/AGENTS.md`).
- The RPCs are authoritative; the TS modules exist for instant UI + tests. Never trust client-computed intervals for storage.
- `again` is the only grade that keeps a card in the current session; all others remove it from the due queue until `next_review_at`.
- Streak day boundaries are **UTC** in both the RPC and `streak.ts` — keep them consistent.
- Scope trims deferred to later (per design doc): live daily-goal ring, review-driven heatmap, reminders, badges, SRS over learn flashcards.
