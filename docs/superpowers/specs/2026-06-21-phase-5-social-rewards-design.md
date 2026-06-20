# Phase 5 Social & Rewards Design

**Date:** 2026-06-21
**Status:** Approved for implementation
**Scope:** `database-monster-cert-prep/public-web`

## Summary

Phase 5 adds a lightweight rewards layer to the existing opt-in leaderboard:
achievement badges and a weekly class challenge. Rewards are computed from
existing progress signals instead of introducing a separate unlock ledger in
this pass. That keeps the feature safe for the exam-prep timeline, avoids
exposing private history, and lets classmates understand the leaderboard at a
glance.

## Chosen Approach

Use computed rewards.

- Derive badges from public-safe aggregate signals: streak, best score, exam
  attempts, average mastery, final boss completion, and due/mistake repair.
- Surface badges on the dashboard, leaderboard rows, and public student cards.
- Add a weekly challenge summary to `/leaderboard`, based on current-week
  activity and opt-in leaderboard profiles.
- Extend existing public leaderboard RPCs to return only aggregate reward
  fields. Do not expose raw question attempts, emails, mistake details, or full
  private history.

Alternatives considered:

- Full reward tables: better for permanent history later, but adds more RLS and
  data maintenance than Phase 5 needs.
- Challenge-first competition: fun, but likely too distracting before the
  certification exam.

## Reward Rules

Initial badge set:

- `hot_streak`: current streak is at least 3 days.
- `locked_in`: current streak is at least 7 days.
- `exam_ready`: best public exam score is at least 80%.
- `final_boss`: at least one `final_boss` attempt exists.
- `repair_mode`: the user has tracked mistake/SRS repair activity.
- `topic_climber`: average topic mastery is at least 75%.

Badges have stable ids, labels, short descriptions, and tone values. The app can
compute them from dashboard data for private views and from leaderboard RPC
fields for public views.

Weekly challenge:

- Name: `Weekly Repair Sprint`.
- Window: Monday through Sunday in UTC.
- Public ranking uses opt-in leaderboard students only.
- Score favors current-week activity without raw detail leakage:
  current-week exam attempts + current-week question volume + current streak.
- Empty state should invite students to take a diagnostic, review mistakes, or
  practice a topic.

## Data And Privacy

No private table is made public. Existing public access remains through safe RPCs.

The leaderboard RPC can expose:

- `current_streak`, `longest_streak`
- `final_boss_count`
- `mistake_count`
- `due_count`
- `week_attempt_count`
- `week_question_count`
- `weekly_challenge_score`

The RPC must not expose:

- emails
- exact answers
- question-level attempt records
- mistake notebook content
- non-opted-in students

Because Supabase changed Data API auto-exposure behavior for new public tables,
this phase avoids new public tables and uses existing RPC patterns.

## UI

Dashboard:

- Add a compact rewards card below the SRS/streak area.
- Show earned badges and the next badge to unlock.
- Keep it study-oriented, not arcade-like.

Leaderboard:

- Add a weekly challenge panel above the leaderboard list.
- Add badge chips to leaderboard rows.
- Keep course filters.

Public student card:

- Add public-safe achievement badges.
- Add streak and weekly challenge stats.
- Keep the existing privacy disclaimer.

## Testing

Add pure utility tests for:

- badge rule thresholds
- next badge recommendation
- weekly challenge date window and score
- public leaderboard row normalization

Run the full public-web gate:

- `npm run typecheck`
- `npm run lint`
- `npm run test:sql`
- `npm run test:data`
- `npm run build`

## Out Of Scope

- Stored badge history.
- Push notifications.
- Comments, follows, or direct student-to-student interaction.
- Reward points spend/redeem mechanics.
