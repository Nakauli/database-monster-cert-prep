# Learn Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public `/learn` lesson-reader page that teaches the 12 database certification topics with definitions, examples, traps, and links into practice/labs.

**Architecture:** Use static local TypeScript data for the lesson content and a small set of focused React components for the lesson reader. Add route/navigation integration and a helper that maps existing `reviewFile` values to Learn topic URLs so Results and Mistakes can link to lessons.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind 4, existing shadcn/Radix primitives, Node test runner through existing npm scripts.

---

### Task 1: Learn Data Contract And Tests

**Files:**
- Create: `database-monster-cert-prep/public-web/src/data/learn-topics.ts`
- Create: `database-monster-cert-prep/public-web/src/lib/learn.ts`
- Create: `database-monster-cert-prep/public-web/src/lib/learn.test.ts`
- Modify: `database-monster-cert-prep/public-web/package.json`
- Modify: `database-monster-cert-prep/public-web/tools/validate-data.mjs`

- [ ] **Step 1: Write failing tests**
  - Test that there are 12 Learn topics.
  - Test that every topic has title, slug, reviewFile, definition, example, trap, checklist, and practice href.
  - Test that `hrefForReviewFile("notes/05_joins.md")` returns `/learn?topic=joins`.

- [ ] **Step 2: Run the Learn tests and verify RED**
  - Run: `npm run test:sql`
  - Expected: fail because `src/lib/learn.test.ts` is included but Learn data/helpers do not exist yet.

- [ ] **Step 3: Implement Learn data and helpers**
  - Define `LearnTopic` and `learnTopics`.
  - Add `hrefForLearnTopic`, `learnTopicByReviewFile`, and `hrefForReviewFile`.
  - Keep the content concise and aligned with the existing notes.

- [ ] **Step 4: Update validation**
  - Include `src/lib/learn.test.ts` in `test:sql`.
  - Update `test:data` validation so Learn topic count and required fields are enforced.

- [ ] **Step 5: Verify GREEN**
  - Run: `npm run test:sql`
  - Run: `npm run test:data`
  - Expected: both pass.

### Task 2: Learn Page UI

**Files:**
- Create: `database-monster-cert-prep/public-web/src/components/LearnClient.tsx`
- Create: `database-monster-cert-prep/public-web/src/app/learn/page.tsx`

- [ ] **Step 1: Build `LearnClient`**
  - Render topic overview cards.
  - Render a sticky desktop topic rail and mobile topic selector.
  - Render selected lesson sections: definition, exam relevance, example, trap, checklist, and CTA buttons.
  - Use `CodeBlock` for SQL/code examples.

- [ ] **Step 2: Build `/learn` route**
  - Add metadata.
  - Read `searchParams.topic`.
  - Choose the matching topic or default to the first topic.
  - Render `LearnClient`.

- [ ] **Step 3: Verify route compiles**
  - Run: `npm run typecheck`
  - Expected: pass.

### Task 3: Navigation And Review Links

**Files:**
- Modify: `database-monster-cert-prep/public-web/src/lib/navigation.ts`
- Modify: `database-monster-cert-prep/public-web/src/components/HomeDashboard.tsx`
- Modify: `database-monster-cert-prep/public-web/src/components/ResultsClient.tsx`
- Modify: `database-monster-cert-prep/public-web/src/components/MistakesClient.tsx`
- Modify: `database-monster-cert-prep/public-web/src/components/FlashcardReview.tsx`

- [ ] **Step 1: Add Learn to nav**
  - Primary nav becomes `Start`, `Learn`, `Practice`, `Progress`.
  - `Learn` is active for `/learn`.

- [ ] **Step 2: Add Learn as a useful side quest**
  - Home useful side quests include Learn, SQL Labs, Roadmap, and How it works.

- [ ] **Step 3: Link review files to Learn**
  - Results wrong-answer cards link to matching Learn topic when `question.reviewFile` exists.
  - Mistakes notebook and flashcards link to matching Learn topic when `snapshot.reviewFile` exists.
  - Raw review file paths should no longer be the primary visible review action.

- [ ] **Step 4: Verify**
  - Run: `npm run lint`
  - Run: `npm run typecheck`
  - Expected: both pass.

### Task 4: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Run full suite**
  - Run: `npm run test:sql && npm run test:data && npm run lint && npm run typecheck && npm run build`
  - Expected: all pass.

- [ ] **Step 2: Browser smoke test**
  - Visit `/learn`.
  - Confirm guests can read the page.
  - Confirm topic switching through `?topic=` works.
  - Confirm nav shows Learn.
  - Confirm code examples do not visually overflow.
