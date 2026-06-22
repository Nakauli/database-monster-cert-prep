# Live Classmates Presence Design

## Goal

Add an opt-in "Live classmates" feature so learners can see who is currently online or generally studying without exposing private progress, exact questions, scores, topics, or answer history.

The feature should make the leaderboard feel more alive while preserving the app's current privacy posture: public social surfaces use aggregate or intentionally shared signals only.

## Product Behavior

- Add a "Live classmates" panel to the leaderboard page sidebar.
- Show only users who are signed in and have enabled a separate presence opt-in setting.
- Each row shows avatar, display name, general status, and freshness.
- Example rows:
  - `Ryan · practicing · now`
  - `Aljun · reviewing · 4m ago`
  - `Mia · online · 8m ago`
- Hide users whose last presence heartbeat is stale, with an initial stale threshold of 10 minutes.
- Keep statuses intentionally broad:
  - `online`
  - `practicing`
  - `reviewing`
  - `taking exam`
  - `learning`
  - `viewing leaderboard`
- Do not show exact topic, exact question, score, exam result, mistake detail, or private answer history.

## Privacy Model

Presence is off by default and separate from leaderboard opt-in.

Add `profiles.presence_opt_in boolean not null default false`. Users can join the leaderboard without showing live status. A user appears in the live list only when all of these are true:

- They are authenticated.
- Their profile has `presence_opt_in = true`.
- They have a recent presence heartbeat.
- The public presence RPC includes them after stale-row filtering.

Raw presence rows should not be directly readable as a broad public table. Public reads should go through a security-definer RPC that returns only the safe display fields needed by the UI.

## Data Model

Add a `public.user_presence` table:

- `user_id uuid primary key references auth.users(id) on delete cascade`
- `status text not null`
- `current_area text`
- `last_seen_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Use a check constraint or helper function to keep `status` within the approved general statuses. `current_area` is optional and should stay coarse if used, such as `practice`, `mistakes`, `exam`, `learn`, `labs`, or `leaderboard`.

Recommended indexes:

- `user_presence_last_seen_idx` on `last_seen_at desc`
- `profiles_presence_opt_in_idx` on `presence_opt_in` if useful for the RPC join

## Database Access

Add an authenticated write path that lets a user update only their own presence. This can be either:

- RLS-backed `insert/update` policies on `user_presence`, or
- a security-invoker RPC such as `upsert_user_presence(p_status text, p_current_area text)`.

The RPC option is preferred because it centralizes status validation and timestamp handling.

Add `get_public_presence(p_limit integer default 12)` returning safe fields:

- `user_id`
- `display_name`
- `course` if needed for context
- `avatar_path`
- `status`
- `last_seen_at`

The function should:

- join `user_presence` to `profiles`
- require `profiles.presence_opt_in = true`
- filter `last_seen_at >= now() - interval '10 minutes'`
- order by newest `last_seen_at`
- cap rows with a conservative limit
- grant execute to `anon` and `authenticated` only if the result remains public-safe

## Client Heartbeat

Add a small authenticated client component mounted near the app shell or authenticated areas. It should:

- read the current route
- map the route to a coarse presence status
- update presence when the route changes
- update again on a low-frequency interval, such as every 60 seconds
- pause or skip writes when the document is hidden if practical
- do nothing when the user is signed out, Supabase is not configured, or presence opt-in is false

Route-to-status mapping:

- `/practice` -> `practicing`
- `/mistakes` -> `reviewing`
- `/exam` -> `taking exam`
- `/learn` -> `learning`
- `/labs` -> `learning`
- `/leaderboard` -> `viewing leaderboard`
- other app pages -> `online`

The heartbeat must fail quietly. Presence should never block navigation, studying, exam submission, or dashboard rendering.

## UI

Place the initial UI on the leaderboard page as a sidebar panel titled "Live classmates".

Panel states:

- Loading: compact skeleton rows if the panel is client-refreshed.
- Populated: list recent classmates with avatar, name, status label, and freshness.
- Empty: "No classmates online right now."
- Signed-out or no public rows: use the same empty state; do not imply which users opted out.

Freshness formatting:

- under 2 minutes: `now`
- 2-9 minutes: rounded minute label such as `4m ago`
- stale rows: not returned by the RPC

The panel can server-render its initial rows and optionally refresh client-side every 30-60 seconds so freshness labels stay useful.

## Profile Setting

Add a profile setting labeled "Show my live status" with short helper copy:

"Let classmates see when you are online and whether you are generally practicing, reviewing, taking an exam, or learning. We never show exact questions, topics, scores, or answers."

Default is off.

## Error Handling

- If the heartbeat update fails, swallow the error or log a development-only debug message.
- If `get_public_presence()` fails, render the empty state instead of breaking the leaderboard page.
- If a status cannot be mapped, fall back to `online`.
- If display name is blank, use the existing safe fallback, such as `Database learner`.

## Testing

Add focused tests for:

- route-to-status mapping
- freshness formatting
- stale threshold behavior
- allowed status validation
- safe public row shaping

Migration review should verify:

- RLS is enabled on `user_presence`
- users can write only their own presence
- raw presence reads are not broadly exposed
- public visibility goes through `get_public_presence()`
- `presence_opt_in` defaults to false

Run the existing project checks after implementation:

- `npm run test:data`
- `npm run typecheck`
- `npm run test:sql`

## Out Of Scope For MVP

- Realtime broadcast presence.
- Exact topic or question sharing.
- Chat or direct messages.
- Notifications when a classmate comes online.
- Global header dropdown presence.
- Instructor-only monitoring views.

These can be revisited after the database heartbeat version proves useful.
