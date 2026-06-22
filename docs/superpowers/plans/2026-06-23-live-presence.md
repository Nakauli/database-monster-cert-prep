# Live Presence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an opt-in "Live classmates" panel on the leaderboard that shows broad online/practicing status without exposing private study data.

**Architecture:** Add a small Supabase presence table plus safe RPCs for heartbeat writes and public reads. Keep route/status mapping and freshness formatting in a focused `src/lib/presence.ts` module so the heartbeat, UI, and tests share the same behavior.

**Tech Stack:** Next.js App Router, React client components, Supabase RPC + RLS migrations, Node test runner with `tsx`, existing CSS in `src/app/globals.css`.

---

## File Structure

- Create `database-monster-cert-prep/public-web/src/lib/presence.ts`
  - Owns allowed statuses, route-to-status mapping, public row shaping, freshness formatting, and server fetch helper.
- Create `database-monster-cert-prep/public-web/src/lib/presence.test.ts`
  - Tests route mapping, freshness, status validation, stale threshold, and public-safe row shaping.
- Create `database-monster-cert-prep/public-web/src/components/PresenceHeartbeat.tsx`
  - Authenticated client heartbeat that calls `upsert_user_presence`.
- Create `database-monster-cert-prep/public-web/src/components/leaderboard/LiveClassmatesPanel.tsx`
  - Leaderboard sidebar UI for live classmates.
- Create `database-monster-cert-prep/public-web/supabase/migrations/20260623120000_live_presence.sql`
  - Adds `profiles.presence_opt_in`, `user_presence`, RLS, `upsert_user_presence`, and `get_public_presence`.
- Modify `database-monster-cert-prep/public-web/src/lib/progress.ts`
  - Add `presence_opt_in` to `ProfileRow` and profile selects.
- Modify `database-monster-cert-prep/public-web/src/components/profile/ProfileForm.tsx`
  - Add the separate "Show my live status" opt-in and persist it.
- Modify `database-monster-cert-prep/public-web/src/components/AppShell.tsx`
  - Mount `PresenceHeartbeat` once for all signed-in app pages.
- Modify `database-monster-cert-prep/public-web/src/app/leaderboard/page.tsx`
  - Fetch public presence rows and render the sidebar panel.
- Modify `database-monster-cert-prep/public-web/src/app/globals.css`
  - Add responsive leaderboard sidebar and live-classmates styles.
- Modify `database-monster-cert-prep/public-web/package.json`
  - Include `src/lib/presence.test.ts` in `npm run test:sql`.

---

### Task 1: Presence Library And Tests

**Files:**
- Create: `database-monster-cert-prep/public-web/src/lib/presence.ts`
- Create: `database-monster-cert-prep/public-web/src/lib/presence.test.ts`
- Modify: `database-monster-cert-prep/public-web/package.json`

- [ ] **Step 1: Add failing presence tests**

Create `src/lib/presence.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  formatPresenceFreshness,
  isAllowedPresenceStatus,
  mapPathToPresence,
  PRESENCE_STALE_AFTER_MS,
  shapePublicPresenceRows,
} from "./presence";

test("maps routes to coarse presence statuses", () => {
  assert.deepEqual(mapPathToPresence("/practice?topic=Joins"), { status: "practicing", currentArea: "practice" });
  assert.deepEqual(mapPathToPresence("/mistakes"), { status: "reviewing", currentArea: "mistakes" });
  assert.deepEqual(mapPathToPresence("/exam?mode=final_boss"), { status: "taking exam", currentArea: "exam" });
  assert.deepEqual(mapPathToPresence("/learn/core/intro"), { status: "learning", currentArea: "learn" });
  assert.deepEqual(mapPathToPresence("/labs"), { status: "learning", currentArea: "labs" });
  assert.deepEqual(mapPathToPresence("/leaderboard"), { status: "viewing leaderboard", currentArea: "leaderboard" });
  assert.deepEqual(mapPathToPresence("/dashboard"), { status: "online", currentArea: "app" });
});

test("validates allowed presence statuses", () => {
  assert.equal(isAllowedPresenceStatus("online"), true);
  assert.equal(isAllowedPresenceStatus("practicing"), true);
  assert.equal(isAllowedPresenceStatus("reviewing"), true);
  assert.equal(isAllowedPresenceStatus("taking exam"), true);
  assert.equal(isAllowedPresenceStatus("learning"), true);
  assert.equal(isAllowedPresenceStatus("viewing leaderboard"), true);
  assert.equal(isAllowedPresenceStatus("solving Joins question 12"), false);
});

test("formats presence freshness without exposing raw timestamps", () => {
  const now = new Date("2026-06-23T12:00:00.000Z");
  assert.equal(formatPresenceFreshness("2026-06-23T11:59:20.000Z", now), "now");
  assert.equal(formatPresenceFreshness("2026-06-23T11:56:10.000Z", now), "4m ago");
  assert.equal(formatPresenceFreshness("2026-06-23T11:50:00.000Z", now), "10m ago");
  assert.equal(formatPresenceFreshness(null, now), "recently");
});

test("keeps the stale threshold at ten minutes", () => {
  assert.equal(PRESENCE_STALE_AFTER_MS, 10 * 60 * 1000);
});

test("shapes public presence rows with safe fallbacks", () => {
  const rows = shapePublicPresenceRows([
    {
      user_id: "user-1",
      display_name: "",
      course: "IT",
      avatar_path: "avatars/user-1/profile.webp",
      status: "practicing",
      last_seen_at: "2026-06-23T11:59:00.000Z",
    },
    {
      user_id: "user-2",
      display_name: "Mia",
      course: null,
      avatar_path: null,
      status: "exact private topic",
      last_seen_at: "2026-06-23T11:58:00.000Z",
    },
  ], "https://example.supabase.co");

  assert.equal(rows[0].display_name, "Database learner");
  assert.equal(rows[0].status, "practicing");
  assert.equal(rows[0].avatar_url?.includes("avatars/user-1/profile.webp"), true);
  assert.equal(rows[1].display_name, "Mia");
  assert.equal(rows[1].status, "online");
});
```

- [ ] **Step 2: Register the test and verify it fails**

Modify the `test:sql` script in `package.json` by appending `src/lib/presence.test.ts` to the existing command.

Run:

```bash
npm run test:sql
```

Expected: FAIL because `src/lib/presence.ts` does not exist.

- [ ] **Step 3: Implement the presence library**

Create `src/lib/presence.ts`:

```ts
import { getAvatarPublicUrl } from "@/lib/avatar";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const PRESENCE_STALE_AFTER_MS = 10 * 60 * 1000;

export const PRESENCE_STATUSES = [
  "online",
  "practicing",
  "reviewing",
  "taking exam",
  "learning",
  "viewing leaderboard",
] as const;

export type PresenceStatus = typeof PRESENCE_STATUSES[number];

export interface PresenceRouteState {
  status: PresenceStatus;
  currentArea: string;
}

export interface PublicPresenceRow {
  user_id: string;
  display_name: string;
  course: string | null;
  avatar_path: string | null;
  avatar_url: string | null;
  status: PresenceStatus;
  last_seen_at: string | null;
}

type PublicPresenceDatabaseRow = Omit<PublicPresenceRow, "avatar_url" | "status"> & {
  status: string | null;
};

export function isAllowedPresenceStatus(value: unknown): value is PresenceStatus {
  return typeof value === "string" && (PRESENCE_STATUSES as readonly string[]).includes(value);
}

export function mapPathToPresence(pathname: string): PresenceRouteState {
  const path = pathname.split("?")[0] || "/";
  if (path.startsWith("/practice")) return { status: "practicing", currentArea: "practice" };
  if (path.startsWith("/mistakes")) return { status: "reviewing", currentArea: "mistakes" };
  if (path.startsWith("/exam")) return { status: "taking exam", currentArea: "exam" };
  if (path.startsWith("/learn")) return { status: "learning", currentArea: "learn" };
  if (path.startsWith("/labs")) return { status: "learning", currentArea: "labs" };
  if (path.startsWith("/leaderboard")) return { status: "viewing leaderboard", currentArea: "leaderboard" };
  return { status: "online", currentArea: "app" };
}

export function formatPresenceFreshness(value: string | null | undefined, now = new Date()) {
  if (!value) return "recently";
  const seenAt = new Date(value).getTime();
  if (Number.isNaN(seenAt)) return "recently";
  const elapsedMs = Math.max(0, now.getTime() - seenAt);
  if (elapsedMs < 2 * 60 * 1000) return "now";
  return `${Math.round(elapsedMs / 60_000)}m ago`;
}

export function shapePublicPresenceRows(
  rows: PublicPresenceDatabaseRow[],
  supabaseUrl = getSupabaseConfig()?.url,
): PublicPresenceRow[] {
  return rows.map((row) => ({
    ...row,
    display_name: row.display_name?.trim() || "Database learner",
    status: isAllowedPresenceStatus(row.status) ? row.status : "online",
    avatar_url: getAvatarPublicUrl(row.avatar_path, supabaseUrl),
  }));
}

export async function getPublicPresence(limit = 12): Promise<PublicPresenceRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc("get_public_presence", {
    p_limit: limit,
  });
  if (error) throw new Error(error.message);

  return shapePublicPresenceRows((data ?? []) as PublicPresenceDatabaseRow[]);
}
```

- [ ] **Step 4: Run the presence tests**

Run:

```bash
node --import tsx --test src/lib/presence.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json src/lib/presence.ts src/lib/presence.test.ts
git commit -m "feat: add presence helpers"
```

---

### Task 2: Supabase Migration

**Files:**
- Create: `database-monster-cert-prep/public-web/supabase/migrations/20260623120000_live_presence.sql`

- [ ] **Step 1: Add the migration**

Create `supabase/migrations/20260623120000_live_presence.sql`:

```sql
begin;

alter table public.profiles
  add column if not exists presence_opt_in boolean not null default false;

create table if not exists public.user_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'online',
  current_area text,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_presence_status_check check (
    status in ('online', 'practicing', 'reviewing', 'taking exam', 'learning', 'viewing leaderboard')
  ),
  constraint user_presence_area_check check (
    current_area is null or current_area in ('app', 'practice', 'mistakes', 'exam', 'learn', 'labs', 'leaderboard')
  )
);

create index if not exists user_presence_last_seen_idx
  on public.user_presence (last_seen_at desc);

create index if not exists profiles_presence_opt_in_idx
  on public.profiles (presence_opt_in)
  where presence_opt_in = true;

alter table public.user_presence enable row level security;

revoke all on public.user_presence from public, anon;
grant select, insert, update, delete on public.user_presence to authenticated;

drop policy if exists "user_presence_select_own" on public.user_presence;
create policy "user_presence_select_own"
on public.user_presence for select
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "user_presence_insert_own" on public.user_presence;
create policy "user_presence_insert_own"
on public.user_presence for insert
to authenticated
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "user_presence_update_own" on public.user_presence;
create policy "user_presence_update_own"
on public.user_presence for update
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()))
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "user_presence_delete_own" on public.user_presence;
create policy "user_presence_delete_own"
on public.user_presence for delete
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

create or replace function public.upsert_user_presence(
  p_status text,
  p_current_area text default null
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_status text := coalesce(p_status, 'online');
  v_current_area text := p_current_area;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;

  if v_status not in ('online', 'practicing', 'reviewing', 'taking exam', 'learning', 'viewing leaderboard') then
    v_status := 'online';
  end if;

  if v_current_area not in ('app', 'practice', 'mistakes', 'exam', 'learn', 'labs', 'leaderboard') then
    v_current_area := 'app';
  end if;

  insert into public.user_presence (user_id, status, current_area, last_seen_at, updated_at)
  values (v_user_id, v_status, v_current_area, now(), now())
  on conflict (user_id)
  do update set
    status = excluded.status,
    current_area = excluded.current_area,
    last_seen_at = excluded.last_seen_at,
    updated_at = excluded.updated_at;
end;
$$;

create or replace function public.get_public_presence(p_limit integer default 12)
returns table (
  user_id uuid,
  display_name text,
  course text,
  avatar_path text,
  status text,
  last_seen_at timestamptz
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    user_presence.user_id,
    coalesce(nullif(trim(profiles.display_name), ''), 'Database learner') as display_name,
    profiles.course,
    profiles.avatar_path,
    user_presence.status,
    user_presence.last_seen_at
  from public.user_presence
  join public.profiles on profiles.id = user_presence.user_id
  where profiles.presence_opt_in = true
    and user_presence.last_seen_at >= now() - interval '10 minutes'
  order by user_presence.last_seen_at desc, display_name asc
  limit least(greatest(coalesce(p_limit, 12), 1), 24);
$$;

revoke all on function public.upsert_user_presence(text, text) from public, anon;
grant execute on function public.upsert_user_presence(text, text) to authenticated;

revoke all on function public.get_public_presence(integer) from public;
grant execute on function public.get_public_presence(integer) to anon, authenticated;

commit;
```

- [ ] **Step 2: Review migration for privacy invariants**

Run:

```bash
rg -n "presence_opt_in|user_presence|upsert_user_presence|get_public_presence|enable row level security|grant execute" supabase/migrations/20260623120000_live_presence.sql
```

Expected: Output shows `presence_opt_in default false`, RLS enabled, authenticated-only upsert execute, and public-safe `get_public_presence`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260623120000_live_presence.sql
git commit -m "feat: add live presence schema"
```

---

### Task 3: Profile Opt-In

**Files:**
- Modify: `database-monster-cert-prep/public-web/src/lib/progress.ts`
- Modify: `database-monster-cert-prep/public-web/src/components/profile/ProfileForm.tsx`

- [ ] **Step 1: Update profile type and selects**

In `src/lib/progress.ts`, add `presence_opt_in: boolean;` to `ProfileRow`.

Update both profile selects to include `presence_opt_in`:

```ts
.select("id, display_name, school, course, avatar_path, leaderboard_opt_in, presence_opt_in, review_reminders_opt_in, review_reminders_last_sent_at, created_at, updated_at")
```

- [ ] **Step 2: Add form state and upsert field**

In `ProfileForm`, add state after `leaderboardOptIn`:

```ts
const [presenceOptIn, setPresenceOptIn] = useState(Boolean(profile?.presence_opt_in));
```

Add `presence_opt_in: presenceOptIn,` to the `profiles` upsert payload.

- [ ] **Step 3: Add the checkbox UI**

Insert this block after the leaderboard helper paragraph:

```tsx
<label className="check-field" htmlFor="profile-presence">
  <input
    id="profile-presence"
    type="checkbox"
    checked={presenceOptIn}
    onChange={(event) => setPresenceOptIn(event.target.checked)}
  />
  <span>Show my live status</span>
</label>
<p className="field-help">
  Let classmates see when you are online and whether you are generally practicing, reviewing, taking an exam, or learning. Exact questions, topics, scores, and answers stay private.
</p>
```

- [ ] **Step 4: Typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/progress.ts src/components/profile/ProfileForm.tsx
git commit -m "feat: add presence profile opt-in"
```

---

### Task 4: Presence Heartbeat

**Files:**
- Create: `database-monster-cert-prep/public-web/src/components/PresenceHeartbeat.tsx`
- Modify: `database-monster-cert-prep/public-web/src/components/AppShell.tsx`

- [ ] **Step 1: Create the heartbeat component**

Create `src/components/PresenceHeartbeat.tsx`:

```tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { mapPathToPresence } from "@/lib/presence";
import { createClient } from "@/lib/supabase/client";

const HEARTBEAT_INTERVAL_MS = 60_000;

export function PresenceHeartbeat() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const presence = useMemo(() => mapPathToPresence(routeKey), [routeKey]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    let cancelled = false;

    async function sendHeartbeat() {
      if (cancelled || document.visibilityState === "hidden") return;

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) return;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("presence_opt_in")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (profileError || !profile?.presence_opt_in) return;

      await supabase.rpc("upsert_user_presence", {
        p_status: presence.status,
        p_current_area: presence.currentArea,
      });
    }

    void sendHeartbeat();
    const intervalId = window.setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [presence.currentArea, presence.status]);

  return null;
}
```

- [ ] **Step 2: Mount it in the app shell**

In `src/components/AppShell.tsx`, import the component:

```tsx
import { PresenceHeartbeat } from "@/components/PresenceHeartbeat";
```

Render it at the top of the returned shell:

```tsx
<div className="flex min-h-screen flex-col">
  <PresenceHeartbeat />
  <header className="sticky top-0 z-40 border-b bg-background/88 backdrop-blur-xl">
```

- [ ] **Step 3: Typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/PresenceHeartbeat.tsx src/components/AppShell.tsx
git commit -m "feat: add presence heartbeat"
```

---

### Task 5: Leaderboard Live Classmates Panel

**Files:**
- Create: `database-monster-cert-prep/public-web/src/components/leaderboard/LiveClassmatesPanel.tsx`
- Modify: `database-monster-cert-prep/public-web/src/app/leaderboard/page.tsx`
- Modify: `database-monster-cert-prep/public-web/src/app/globals.css`

- [ ] **Step 1: Create the panel component**

Create `src/components/leaderboard/LiveClassmatesPanel.tsx`:

```tsx
import { Activity } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { formatPresenceFreshness, type PublicPresenceRow } from "@/lib/presence";

export function LiveClassmatesPanel({ rows }: { rows: PublicPresenceRow[] }) {
  return (
    <aside className="live-classmates-panel" aria-label="Live classmates">
      <div className="live-classmates-heading">
        <Badge variant="secondary" className="w-fit">Live</Badge>
        <h2><Activity className="size-5" aria-hidden="true" /> Live classmates</h2>
        <p>Opt-in status only. Exact topics, scores, and answers stay private.</p>
      </div>

      {rows.length ? (
        <div className="live-classmates-list">
          {rows.map((row) => (
            <div className="live-classmate-row" key={row.user_id}>
              <span className="presence-dot" aria-hidden="true" />
              <UserAvatar name={row.display_name} src={row.avatar_url} size="sm" />
              <span className="live-classmate-main">
                <strong>{row.display_name}</strong>
                <small>{row.status} · {formatPresenceFreshness(row.last_seen_at)}</small>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="live-classmates-empty">
          <strong>No classmates online right now.</strong>
          <span>Turn on live status in your profile when you want to appear here.</span>
        </div>
      )}
    </aside>
  );
}
```

- [ ] **Step 2: Fetch and render presence on the leaderboard page**

In `src/app/leaderboard/page.tsx`, import:

```ts
import { LiveClassmatesPanel } from "@/components/leaderboard/LiveClassmatesPanel";
import { getPublicPresence } from "@/lib/presence";
```

Change the data load:

```ts
const [user, rows, presenceRows] = await Promise.all([
  getCurrentUser(),
  getPublicLeaderboard(selectedCourse).catch(() => []),
  getPublicPresence().catch(() => []),
]);
```

Replace the standalone table render:

```tsx
<div className="leaderboard-content-grid">
  <LeaderboardTable
    currentUserId={user?.id}
    rows={rows}
    selectedCourse={selectedCourse}
  />
  <LiveClassmatesPanel rows={presenceRows} />
</div>
```

- [ ] **Step 3: Add responsive styles**

Append near the leaderboard styles in `src/app/globals.css`:

```css
.leaderboard-content-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 18px; align-items: start; }
.live-classmates-panel { position: sticky; top: 86px; display: grid; gap: 14px; padding: 18px; border: 1px solid color-mix(in srgb, var(--green) 24%, var(--line)); border-radius: 18px; background: color-mix(in srgb, var(--surface) 94%, var(--green-soft)); box-shadow: var(--shadow); }
.live-classmates-heading h2 { display: flex; gap: 8px; align-items: center; margin: 8px 0 5px; font-family: var(--font-display), "Segoe UI", sans-serif; font-size: 24px; letter-spacing: -.04em; }
.live-classmates-heading p { margin: 0; color: var(--muted); font-size: 13px; }
.live-classmates-list { display: grid; gap: 10px; }
.live-classmate-row { display: grid; grid-template-columns: auto auto minmax(0, 1fr); gap: 10px; align-items: center; padding: 10px; border: 1px solid var(--line); border-radius: 13px; background: var(--surface); }
.presence-dot { width: 9px; height: 9px; border-radius: 999px; background: var(--green); box-shadow: 0 0 0 4px color-mix(in srgb, var(--green) 16%, transparent); }
.live-classmate-main { display: grid; min-width: 0; }
.live-classmate-main strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
.live-classmate-main small { color: var(--muted); font-size: 11px; }
.live-classmates-empty { display: grid; gap: 5px; padding: 14px; border: 1px dashed var(--line-strong); border-radius: 13px; background: var(--surface); }
.live-classmates-empty strong { font-size: 13px; }
.live-classmates-empty span { color: var(--muted); font-size: 12px; line-height: 1.45; }
```

Inside the existing `@media (max-width: 900px)` block, add:

```css
.leaderboard-content-grid { grid-template-columns: 1fr; }
.live-classmates-panel { position: static; }
```

- [ ] **Step 4: Typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/leaderboard/LiveClassmatesPanel.tsx src/app/leaderboard/page.tsx src/app/globals.css
git commit -m "feat: show live classmates"
```

---

### Task 6: Final Verification

**Files:**
- Read/check only unless failures require fixes.

- [ ] **Step 1: Run focused tests**

Run:

```bash
node --import tsx --test src/lib/presence.test.ts src/lib/leaderboard.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full checks**

Run:

```bash
npm run test:data
npm run typecheck
npm run test:sql
```

Expected: all PASS.

- [ ] **Step 3: Review git status and migration safety**

Run:

```bash
git status --short --branch
rg -n "presence_opt_in boolean not null default false|alter table public.user_presence enable row level security|grant execute on function public.get_public_presence|grant execute on function public.upsert_user_presence" supabase/migrations/20260623120000_live_presence.sql
```

Expected: working tree clean after task commits; migration grep shows the privacy-critical lines.

- [ ] **Step 4: If any verification-only fixes were needed, commit them**

Only if Step 1-3 required changes:

```bash
git add <changed-files>
git commit -m "fix: verify live presence"
```

---

## Self-Review Notes

- Spec coverage: the plan covers opt-in profile setting, database heartbeat, safe public RPC, leaderboard sidebar UI, stale filtering, broad statuses, fallback states, and tests.
- Placeholder scan: no placeholder markers or repeated-reference steps are used.
- Type consistency: `PresenceStatus`, `PublicPresenceRow`, `presence_opt_in`, `upsert_user_presence`, and `get_public_presence` are named consistently across tasks.
