# Phase 2 — Adaptive Remediation

**Date:** 2026-06-20
**Branch:** `feat/phase-2-adaptive-remediation`
**Status:** Implemented

## Goal

Turn a completed exam result into the next study action. A result should not stop
at a score; it should tell the student what to repair, where to study it, and how
to start a focused drill immediately.

## Implementation Notes

- Added `src/lib/remediation.ts` with pure helpers for:
  - ranking weakest attempted topics
  - building focused untimed practice URLs
  - resolving missed questions to the best lesson URL
  - resolving missed questions to a matching SQL lab or topic-filtered lab page
  - summarizing the missed cards that are auto-tracked for spaced review
- Updated `ResultsClient` with a dedicated **Repair plan** section:
  - top three weak topics become one-click micro-drills
  - missed cards are surfaced as "now due" spaced-review work
  - every missed question links to mistakes, lesson, SQL lab, and a focused topic drill
- Kept existing routes and result shapes stable. Focused drills reuse the current
  `/exam?mode=practice&topic=...&difficulty=all&count=...` flow.

## Verification Plan

Run from `database-monster-cert-prep/public-web`:

```sh
npm run typecheck
npm run lint
npm run test:sql
npm run build
```

Manual smoke checks:

- Complete an exam and confirm the result page shows a Repair plan.
- Start a weak-topic drill and confirm it opens untimed topic practice.
- Open a missed question's lesson and SQL lab links.
- Open `/mistakes` from the spaced-review card count.
