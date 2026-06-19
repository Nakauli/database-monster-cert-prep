# Leaderboard Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an opt-in readiness leaderboard with course filtering, public student study cards, signup/profile course fields, and a subtle home hero preview.

**Architecture:** Supabase owns public-safe leaderboard aggregation through security-definer RPCs while RLS stays strict on raw tables. Next server components fetch public leaderboard rows through `src/lib/leaderboard.ts`; client components handle course filter links and profile/register form updates. The home page shows a compact animated preview that links into the full leaderboard.

**Tech Stack:** Next 16 App Router, React 19, Supabase Auth/Postgres/RPC, TypeScript, shadcn/Radix primitives, Tailwind 4/global CSS, Node test runner.

---

## File Structure

- Create `database-monster-cert-prep/public-web/supabase/migrations/004_public_leaderboard.sql`: add `leaderboard_opt_in`, update auth profile trigger, add public-safe RPCs.
- Create `database-monster-cert-prep/public-web/src/lib/courses.ts`: shared `IT` / `CS` constants and validation helpers.
- Create `database-monster-cert-prep/public-web/src/lib/leaderboard.ts`: typed leaderboard fetching, formatter helpers, and fallback handling.
- Create `database-monster-cert-prep/public-web/src/lib/leaderboard.test.ts`: helper tests for initials/course validation/formatting.
- Create `database-monster-cert-prep/public-web/src/components/leaderboard/LeaderboardPreview.tsx`: animated top-three hero panel.
- Create `database-monster-cert-prep/public-web/src/components/leaderboard/LeaderboardTable.tsx`: full leaderboard filter/table/cards.
- Create `database-monster-cert-prep/public-web/src/components/leaderboard/PublicStudentProfile.tsx`: public-safe profile card.
- Create `database-monster-cert-prep/public-web/src/app/leaderboard/page.tsx`: public leaderboard page.
- Create `database-monster-cert-prep/public-web/src/app/students/[id]/page.tsx`: public student profile page.
- Modify `database-monster-cert-prep/public-web/src/lib/progress.ts`: include `leaderboard_opt_in` in profile type/selects.
- Modify `database-monster-cert-prep/public-web/src/components/auth/RegisterForm.tsx`: course dropdown and opt-in metadata.
- Modify `database-monster-cert-prep/public-web/src/components/profile/ProfileForm.tsx`: course dropdown and opt-in edit.
- Modify `database-monster-cert-prep/public-web/src/components/HomeDashboard.tsx`: insert leaderboard preview and contextual link.
- Modify `database-monster-cert-prep/public-web/src/app/page.tsx`: fetch public leaderboard preview rows.
- Modify `database-monster-cert-prep/public-web/src/app/globals.css`: leaderboard motion/styles and keep primary button contrast rule.
- Modify `database-monster-cert-prep/public-web/package.json`: add leaderboard test to `test:sql`.

---

### Task 1: Database Migration

**Files:**
- Create: `database-monster-cert-prep/public-web/supabase/migrations/004_public_leaderboard.sql`

- [ ] **Step 1: Add migration with opt-in column and RPCs**

Create `004_public_leaderboard.sql` with:

```sql
begin;

alter table public.profiles
  add column if not exists leaderboard_opt_in boolean not null default false;

create index if not exists profiles_leaderboard_course_idx
  on public.profiles (leaderboard_opt_in, course);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    course,
    leaderboard_opt_in
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'course', ''),
    coalesce((new.raw_user_meta_data ->> 'leaderboard_opt_in')::boolean, false)
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    course = excluded.course,
    leaderboard_opt_in = excluded.leaderboard_opt_in;

  return new;
end;
$$;

create or replace function public.get_public_leaderboard(p_course text default null)
returns table (
  user_id uuid,
  display_name text,
  course text,
  rank integer,
  readiness_score numeric,
  best_score numeric,
  attempt_count integer,
  average_mastery numeric,
  last_active_at timestamptz,
  strongest_topics text[],
  weakest_topics text[]
)
language sql
security definer
set search_path = public, pg_temp
as $$
with eligible_profiles as (
  select
    profiles.id,
    nullif(trim(profiles.display_name), '') as display_name,
    profiles.course
  from public.profiles
  where profiles.leaderboard_opt_in = true
    and (p_course is null or p_course = '' or profiles.course = p_course)
),
recent_attempts as (
  select *
  from (
    select
      exam_attempts.user_id,
      exam_attempts.score,
      exam_attempts.created_at,
      row_number() over (
        partition by exam_attempts.user_id
        order by exam_attempts.created_at desc
      ) as attempt_position
    from public.exam_attempts
    where exam_attempts.exam_mode in ('diagnostic', 'timed', 'final_boss')
  ) ranked_attempts
  where ranked_attempts.attempt_position <= 10
),
attempt_summary as (
  select
    recent_attempts.user_id,
    max(recent_attempts.score) as best_score,
    count(*)::integer as attempt_count,
    max(recent_attempts.created_at) as last_attempt_at
  from recent_attempts
  group by recent_attempts.user_id
),
topic_summary as (
  select
    user_topic_progress.user_id,
    round(avg(user_topic_progress.mastery_score), 2) as average_mastery,
    max(user_topic_progress.last_practiced_at) as last_practiced_at
  from public.user_topic_progress
  group by user_topic_progress.user_id
),
topic_rankings as (
  select
    user_topic_progress.user_id,
    array_remove(array_agg(user_topic_progress.topic order by user_topic_progress.mastery_score desc, user_topic_progress.topic) filter (where user_topic_progress.topic is not null), null)[1:3] as strongest_topics,
    array_remove(array_agg(user_topic_progress.topic order by user_topic_progress.mastery_score asc, user_topic_progress.topic) filter (where user_topic_progress.topic is not null), null)[1:3] as weakest_topics
  from public.user_topic_progress
  group by user_topic_progress.user_id
),
mistake_summary as (
  select
    mistake_notebook.user_id,
    count(*)::integer as unresolved_mistakes
  from public.mistake_notebook
  group by mistake_notebook.user_id
),
scored as (
  select
    eligible_profiles.id as user_id,
    coalesce(eligible_profiles.display_name, 'Database learner') as display_name,
    eligible_profiles.course,
    coalesce(attempt_summary.best_score, 0) as best_score,
    coalesce(attempt_summary.attempt_count, 0) as attempt_count,
    coalesce(topic_summary.average_mastery, 0) as average_mastery,
    greatest(
      coalesce(attempt_summary.last_attempt_at, '-infinity'::timestamptz),
      coalesce(topic_summary.last_practiced_at, '-infinity'::timestamptz)
    ) as last_active_at,
    coalesce(topic_rankings.strongest_topics, array[]::text[]) as strongest_topics,
    coalesce(topic_rankings.weakest_topics, array[]::text[]) as weakest_topics,
    least(
      100,
      greatest(
        0,
        round(
          coalesce(attempt_summary.best_score, 0) * 0.50
          + coalesce(topic_summary.average_mastery, 0) * 0.25
          + (100 - least(coalesce(mistake_summary.unresolved_mistakes, 0) * 5, 100)) * 0.15
          + (
            case
              when greatest(coalesce(attempt_summary.last_attempt_at, '-infinity'::timestamptz), coalesce(topic_summary.last_practiced_at, '-infinity'::timestamptz)) >= now() - interval '7 days' then 100
              when greatest(coalesce(attempt_summary.last_attempt_at, '-infinity'::timestamptz), coalesce(topic_summary.last_practiced_at, '-infinity'::timestamptz)) >= now() - interval '14 days' then 60
              when greatest(coalesce(attempt_summary.last_attempt_at, '-infinity'::timestamptz), coalesce(topic_summary.last_practiced_at, '-infinity'::timestamptz)) >= now() - interval '30 days' then 30
              else 0
            end
          ) * 0.10,
          2
        )
      )
    ) as readiness_score
  from eligible_profiles
  left join attempt_summary on attempt_summary.user_id = eligible_profiles.id
  left join topic_summary on topic_summary.user_id = eligible_profiles.id
  left join topic_rankings on topic_rankings.user_id = eligible_profiles.id
  left join mistake_summary on mistake_summary.user_id = eligible_profiles.id
)
select
  scored.user_id,
  scored.display_name,
  scored.course,
  dense_rank() over (order by scored.readiness_score desc, scored.best_score desc, scored.display_name asc)::integer as rank,
  scored.readiness_score,
  scored.best_score,
  scored.attempt_count,
  scored.average_mastery,
  nullif(scored.last_active_at, '-infinity'::timestamptz) as last_active_at,
  scored.strongest_topics,
  scored.weakest_topics
from scored
order by scored.readiness_score desc, scored.best_score desc, scored.display_name asc;
$$;

create or replace function public.get_public_student_profile(p_user_id uuid)
returns table (
  user_id uuid,
  display_name text,
  course text,
  rank integer,
  readiness_score numeric,
  best_score numeric,
  attempt_count integer,
  average_mastery numeric,
  last_active_at timestamptz,
  strongest_topics text[],
  weakest_topics text[]
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select *
  from public.get_public_leaderboard(null)
  where get_public_leaderboard.user_id = p_user_id
  limit 1;
$$;

revoke all on function public.get_public_leaderboard(text) from public;
revoke all on function public.get_public_student_profile(uuid) from public;
grant execute on function public.get_public_leaderboard(text) to anon, authenticated;
grant execute on function public.get_public_student_profile(uuid) to anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

commit;
```

- [ ] **Step 2: Verify local SQL has no obvious syntax placeholders**

Run:

```bash
rg -n "TODO|TBD|placeholder" database-monster-cert-prep/public-web/supabase/migrations/004_public_leaderboard.sql
```

Expected: no matches.

---

### Task 2: Shared Course And Leaderboard Helpers

**Files:**
- Create: `database-monster-cert-prep/public-web/src/lib/courses.ts`
- Create: `database-monster-cert-prep/public-web/src/lib/leaderboard.ts`
- Create: `database-monster-cert-prep/public-web/src/lib/leaderboard.test.ts`
- Modify: `database-monster-cert-prep/public-web/package.json`

- [ ] **Step 1: Add helper tests first**

Create `src/lib/leaderboard.test.ts` with tests for initials, course parsing, and date labels:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { COURSE_OPTIONS, normalizeCourse } from "./courses";
import { formatLastActive, getAvatarInitials } from "./leaderboard";

test("normalizes allowed course values", () => {
  assert.deepEqual(COURSE_OPTIONS, ["IT", "CS"]);
  assert.equal(normalizeCourse("it"), "IT");
  assert.equal(normalizeCourse("CS"), "CS");
  assert.equal(normalizeCourse("engineering"), null);
});

test("creates stable avatar initials", () => {
  assert.equal(getAvatarInitials("Ryan Deniega"), "RD");
  assert.equal(getAvatarInitials("aljun"), "A");
  assert.equal(getAvatarInitials(""), "DB");
});

test("formats last active labels without exposing raw history", () => {
  assert.equal(formatLastActive(null), "No activity yet");
  assert.match(formatLastActive("2026-06-19T00:00:00.000Z"), /2026/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd database-monster-cert-prep/public-web
node --import tsx --test src/lib/leaderboard.test.ts
```

Expected: FAIL because helper modules/functions are missing.

- [ ] **Step 3: Implement `courses.ts`**

Create:

```ts
export const COURSE_OPTIONS = ["IT", "CS"] as const;

export type CourseOption = (typeof COURSE_OPTIONS)[number];

export function normalizeCourse(value: string | null | undefined): CourseOption | null {
  const normalized = value?.trim().toUpperCase();
  return normalized === "IT" || normalized === "CS" ? normalized : null;
}
```

- [ ] **Step 4: Implement `leaderboard.ts`**

Create data access and helpers:

```ts
import { createClient } from "@/lib/supabase/server";
import { normalizeCourse, type CourseOption } from "@/lib/courses";

export interface PublicLeaderboardRow {
  user_id: string;
  display_name: string;
  course: string | null;
  rank: number;
  readiness_score: number;
  best_score: number;
  attempt_count: number;
  average_mastery: number;
  last_active_at: string | null;
  strongest_topics: string[];
  weakest_topics: string[];
}

export function getAvatarInitials(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "DB";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export function formatPercent(value: number | null | undefined) {
  return `${Math.round(Number(value ?? 0))}%`;
}

export function formatLastActive(value: string | null | undefined) {
  if (!value) return "No activity yet";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export async function getPublicLeaderboard(course?: string | null, limit?: number): Promise<PublicLeaderboardRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const normalizedCourse = normalizeCourse(course);
  const { data, error } = await supabase.rpc("get_public_leaderboard", {
    p_course: normalizedCourse,
  });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as PublicLeaderboardRow[];
  return typeof limit === "number" ? rows.slice(0, limit) : rows;
}

export async function getPublicStudentProfile(userId: string): Promise<PublicLeaderboardRow | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_public_student_profile", {
    p_user_id: userId,
  });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as PublicLeaderboardRow[];
  return rows[0] ?? null;
}
```

- [ ] **Step 5: Add test to `test:sql`**

Update `package.json` script:

```json
"test:sql": "node --import tsx --test src/lib/sql-patterns.test.ts src/lib/sql-engine.test.ts src/lib/practice-drills.test.ts src/lib/readiness.test.ts src/lib/storage.test.ts src/lib/leaderboard.test.ts"
```

- [ ] **Step 6: Run helper tests**

Run:

```bash
cd database-monster-cert-prep/public-web
npm run test:sql
```

Expected: all tests pass.

---

### Task 3: Profile Types And Account Forms

**Files:**
- Modify: `database-monster-cert-prep/public-web/src/lib/progress.ts`
- Modify: `database-monster-cert-prep/public-web/src/components/auth/RegisterForm.tsx`
- Modify: `database-monster-cert-prep/public-web/src/components/profile/ProfileForm.tsx`

- [ ] **Step 1: Extend `ProfileRow`**

Add `leaderboard_opt_in: boolean` and include it in profile selects:

```ts
export interface ProfileRow {
  id: string;
  display_name: string;
  school: string | null;
  course: string | null;
  leaderboard_opt_in: boolean;
  created_at: string;
  updated_at: string;
}
```

Select:

```ts
.select("id, display_name, school, course, leaderboard_opt_in, created_at, updated_at")
```

- [ ] **Step 2: Add register course and opt-in state**

In `RegisterForm.tsx`, import `COURSE_OPTIONS`, add:

```ts
const [course, setCourse] = useState("IT");
const [leaderboardOptIn, setLeaderboardOptIn] = useState(false);
```

Update signup metadata:

```ts
data: {
  display_name: displayName.trim(),
  course,
  leaderboard_opt_in: leaderboardOptIn,
},
```

Add a required course `<select>` and opt-in checkbox before password fields.

- [ ] **Step 3: Add profile course dropdown and opt-in checkbox**

In `ProfileForm.tsx`, import `COURSE_OPTIONS`, initialize:

```ts
const [course, setCourse] = useState(profile?.course === "CS" ? "CS" : "IT");
const [leaderboardOptIn, setLeaderboardOptIn] = useState(Boolean(profile?.leaderboard_opt_in));
```

Upsert:

```ts
course,
leaderboard_opt_in: leaderboardOptIn,
```

Replace course input with a `<select>` and add a checkbox with helper text explaining public fields.

---

### Task 4: Leaderboard UI Components And Pages

**Files:**
- Create: `database-monster-cert-prep/public-web/src/components/leaderboard/LeaderboardPreview.tsx`
- Create: `database-monster-cert-prep/public-web/src/components/leaderboard/LeaderboardTable.tsx`
- Create: `database-monster-cert-prep/public-web/src/components/leaderboard/PublicStudentProfile.tsx`
- Create: `database-monster-cert-prep/public-web/src/app/leaderboard/page.tsx`
- Create: `database-monster-cert-prep/public-web/src/app/students/[id]/page.tsx`

- [ ] **Step 1: Build `LeaderboardPreview`**

Create a server-compatible component that accepts `rows`, renders top three, and handles empty state with links.

- [ ] **Step 2: Build `LeaderboardTable`**

Create a component that renders course filter links, leaderboard rows as keyboard-accessible links, and empty states.

- [ ] **Step 3: Build `PublicStudentProfile`**

Create a component that renders the public study card, topic chips, and back link.

- [ ] **Step 4: Add `/leaderboard` route**

Use `searchParams.course`, `getCurrentUser()`, and `getPublicLeaderboard(course)` to render the full leaderboard.

- [ ] **Step 5: Add `/students/[id]` route**

Use `getPublicStudentProfile(params.id)`. If no row returns, render not-found-style content with a leaderboard link.

---

### Task 5: Home Hero Integration And Styles

**Files:**
- Modify: `database-monster-cert-prep/public-web/src/app/page.tsx`
- Modify: `database-monster-cert-prep/public-web/src/components/HomeDashboard.tsx`
- Modify: `database-monster-cert-prep/public-web/src/app/globals.css`

- [ ] **Step 1: Fetch preview rows on home**

In `page.tsx`, call:

```ts
const leaderboardRows = await getPublicLeaderboard(null, 3).catch(() => []);
```

Pass rows into `HomeDashboard`.

- [ ] **Step 2: Render preview in hero grid**

Place `LeaderboardPreview` in the right hero column or directly after the guided path card, keeping the diagnostic CTA dominant.

- [ ] **Step 3: Add reduced-motion-safe styles**

Add classes/keyframes for gentle row entrance and score pulse with:

```css
@media (prefers-reduced-motion: reduce) {
  .leaderboard-preview-row,
  .leaderboard-score-pulse {
    animation: none;
  }
}
```

Keep the existing primary button contrast override.

---

### Task 6: Verification And Remote Migration Decision

**Files:**
- No code files unless checks reveal errors.

- [ ] **Step 1: Run tests**

Run:

```bash
cd database-monster-cert-prep/public-web
npm run test:sql
npm run test:data
npm run lint
npm run typecheck
npm run build
```

Expected: all pass.

- [ ] **Step 2: Use Supabase MCP to inspect remote state before applying migration**

Call `list_tables` and `list_migrations`. If migration `004_public_leaderboard` is absent and the user wants the connected project updated immediately, apply the migration via MCP. Otherwise leave it as a repo migration for review/merge.

- [ ] **Step 3: Commit implementation**

Stage only relevant files:

```bash
git add docs/superpowers/plans/2026-06-19-leaderboard-readiness.md \
  database-monster-cert-prep/public-web/package.json \
  database-monster-cert-prep/public-web/supabase/migrations/004_public_leaderboard.sql \
  database-monster-cert-prep/public-web/src/app/globals.css \
  database-monster-cert-prep/public-web/src/app/leaderboard \
  database-monster-cert-prep/public-web/src/app/page.tsx \
  database-monster-cert-prep/public-web/src/app/students \
  database-monster-cert-prep/public-web/src/components/HomeDashboard.tsx \
  database-monster-cert-prep/public-web/src/components/auth/RegisterForm.tsx \
  database-monster-cert-prep/public-web/src/components/leaderboard \
  database-monster-cert-prep/public-web/src/components/profile/ProfileForm.tsx \
  database-monster-cert-prep/public-web/src/lib/courses.ts \
  database-monster-cert-prep/public-web/src/lib/leaderboard.ts \
  database-monster-cert-prep/public-web/src/lib/leaderboard.test.ts \
  database-monster-cert-prep/public-web/src/lib/progress.ts
git commit -m "feat: add opt-in readiness leaderboard"
```

Do not stage `.claude/` or `.superpowers/`.

---
