# Phase 5 Social Rewards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add public-safe achievement badges and a weekly class challenge to the existing leaderboard and progress surfaces.

**Architecture:** Rewards are computed from existing aggregate data rather than persisted as a new badge ledger. A pure `rewards` module owns badge and challenge rules, Supabase RPCs expose safe aggregate fields for opted-in leaderboard rows, and React components render badges on dashboard, leaderboard, and public student pages.

**Tech Stack:** Next.js App Router, React Server Components, Supabase Postgres RPCs, TypeScript `node:test`, shadcn/Radix UI primitives, existing global CSS.

---

## File Map

- Create `database-monster-cert-prep/public-web/src/lib/rewards.ts`: pure badge/challenge rules.
- Create `database-monster-cert-prep/public-web/src/lib/rewards.test.ts`: red-green tests for rules.
- Modify `database-monster-cert-prep/public-web/package.json`: include rewards tests in `test:sql`.
- Modify `database-monster-cert-prep/public-web/src/lib/leaderboard.ts`: add public reward fields and normalize badges.
- Modify `database-monster-cert-prep/public-web/src/lib/progress.ts`: expose enough private dashboard fields for reward calculation.
- Create `database-monster-cert-prep/public-web/src/components/rewards/AchievementBadges.tsx`: reusable badge chips and next badge card.
- Modify `database-monster-cert-prep/public-web/src/components/HomeDashboard.tsx`: add earned/next rewards card.
- Modify `database-monster-cert-prep/public-web/src/components/leaderboard/LeaderboardTable.tsx`: render public badges per row.
- Modify `database-monster-cert-prep/public-web/src/components/leaderboard/PublicStudentProfile.tsx`: render public badges/streak/challenge stats.
- Modify `database-monster-cert-prep/public-web/src/app/leaderboard/page.tsx`: add weekly challenge panel.
- Create `database-monster-cert-prep/public-web/supabase/migrations/20260621090000_phase_5_social_rewards.sql`: replace leaderboard RPCs with safe reward aggregates.
- Modify `database-monster-cert-prep/public-web/supabase/README.md`: document Phase 5 public reward aggregates.
- Modify `docs/plans/2026-06-20-srs-and-streaks-design.md`: mark Phase 5 as implemented.

## Tasks

### Task 1: Reward Rules

- [ ] Write failing tests in `src/lib/rewards.test.ts` for earned badges, next badge, weekly window, and challenge score.
- [ ] Run `npm run test:sql` and confirm it fails because `@/lib/rewards` does not exist.
- [ ] Implement `src/lib/rewards.ts` with badge definitions, `getEarnedAchievements`, `getNextAchievement`, `getWeeklyChallengeWindow`, and `computeWeeklyChallengeScore`.
- [ ] Run `npm run test:sql` and confirm the new tests pass.

### Task 2: Supabase Public Aggregates

- [ ] Add a migration replacing `get_public_leaderboard(text)` and `get_public_student_profile(uuid)` with reward aggregate columns.
- [ ] Keep RPCs public-safe: only opted-in profiles, aggregate fields, no email or question-level data.
- [ ] Apply the migration through Supabase MCP.
- [ ] Verify new RPC columns and no non-opted-in records leak through.

### Task 3: Typed Data Flow

- [ ] Extend `PublicLeaderboardRow` with streak, mistake, due, final boss, weekly activity, challenge score, and achievements.
- [ ] Normalize row achievements in `getPublicLeaderboard` and `getPublicStudentProfile`.
- [ ] Extend dashboard data with final boss count and recent review/repair signals.
- [ ] Keep failures graceful: if Supabase is unavailable, pages still render empty states.

### Task 4: Rewards UI

- [ ] Add `AchievementBadges` and `NextAchievementCard`.
- [ ] Add dashboard rewards card near the SRS/streak section.
- [ ] Add a weekly challenge panel on `/leaderboard`.
- [ ] Add badge chips on leaderboard rows and public student cards.
- [ ] Add compact CSS for badges/challenge cards with reduced-motion-safe interactions.

### Task 5: Verification And PR

- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run test:sql`.
- [ ] Run `npm run test:data`.
- [ ] Run `npm run build`.
- [ ] Commit, push `feat/phase-5-social-rewards`, and open PR titled `Phase 5: Social Rewards`.
