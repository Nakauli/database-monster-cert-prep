# Learn Subtopic Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Learn into a course-style reader with topic groups and detailed subtopic pages.

**Architecture:** Keep Learn static and local by nesting lessons inside `src/data/learn-topics.ts`. Add route helpers in `src/lib/learn.ts`, render route-param pages at `/learn/[topicSlug]/[lessonSlug]`, and keep `/learn?topic=...` compatible by resolving old topic links to each topic's first lesson.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind 4, node:test, static TypeScript data.

---

### Task 1: Expand Learn Data Model

**Files:**
- Modify: `database-monster-cert-prep/public-web/src/data/learn-topics.ts`

- [ ] **Step 1: Replace the flat `LearnTopic` model with nested topic and lesson types**

Define:

```ts
export interface LearnLesson {
  title: string;
  slug: string;
  summary: string;
  definition: string;
  examWhy: string;
  example: {
    title: string;
    body: string;
    code?: string;
  };
  trap: string;
  checklist: string[];
  practiceHref: string;
  labHref?: string;
}

export interface LearnTopic {
  title: string;
  slug: string;
  summary: string;
  reviewFile: string;
  lessons: LearnLesson[];
}
```

- [ ] **Step 2: Convert each current topic into a topic with `lessons`**

For example, Normalization should become:

```ts
{
  title: "Normalization",
  slug: "normalization",
  summary: "1NF, 2NF, 3NF, BCNF basics, dependencies, and update anomalies.",
  reviewFile: "notes/03_normalization.md",
  lessons: [
    {
      title: "Why normalization exists",
      slug: "why-normalization-exists",
      summary: "Use normalization to reduce duplication and prevent unsafe updates.",
      definition: "Normalization organizes data so each table stores one kind of fact. The goal is to reduce repeated data and prevent insert, update, and delete anomalies.",
      examWhy: "Exam questions often show a table with repeated facts and ask what problem normalization fixes or which design is safer.",
      example: {
        title: "Repeated department facts",
        body: "If every student row repeats the same department name and office, changing one department means updating many rows.",
      },
      trap: "Normalization is not about making every table tiny. It is about placing facts where they depend on the right key.",
      checklist: [
        "Can name insert, update, and delete anomalies.",
        "Can spot repeated facts in one table.",
        "Can explain why splitting tables can make updates safer.",
      ],
      practiceHref: "/practice?topic=Normalization",
    },
  ],
}
```

- [ ] **Step 3: Add all approved lesson groups**

Include the lesson set from `docs/superpowers/specs/2026-06-20-learn-subtopic-pages-design.md`, including the expanded `Stored Routines, Functions & Triggers` topic with procedures, functions, parameters, return values, and trigger behavior.

### Task 2: Update Learn Helpers And Tests

**Files:**
- Modify: `database-monster-cert-prep/public-web/src/lib/learn.ts`
- Modify: `database-monster-cert-prep/public-web/src/lib/learn.test.ts`

- [ ] **Step 1: Write helper tests first**

Tests should assert:

```ts
assert.equal(hrefForLearnTopic(normalization), "/learn/normalization/why-normalization-exists");
assert.equal(hrefForLearnLesson("normalization", "1nf"), "/learn/normalization/1nf");
assert.equal(learnLessonBySlug("normalization", "1nf")?.title, "1NF");
assert.equal(firstLessonForTopic(normalization)?.slug, "why-normalization-exists");
assert.equal(hrefForReviewFile("notes/05_joins.md"), "/learn/joins/inner-join");
assert.equal(previousAndNextLesson("normalization", "1nf").next?.slug, "2nf");
```

- [ ] **Step 2: Implement helpers**

Add:

```ts
export function firstLessonForTopic(topic: LearnTopic): LearnLesson | null;
export function learnLessonBySlug(topicSlug: string | null | undefined, lessonSlug: string | null | undefined): LearnLesson | null;
export function hrefForLearnLesson(topicSlug: string, lessonSlug: string): string;
export function hrefForLearnTopic(topic: LearnTopic): string;
export function allLearnLessonEntries(): LearnLessonEntry[];
export function previousAndNextLesson(topicSlug: string, lessonSlug: string): { previous: LearnLessonEntry | null; next: LearnLessonEntry | null };
```

`hrefForLearnTopic` should return the first lesson URL.

### Task 3: Add Route-Param Learn Pages

**Files:**
- Modify: `database-monster-cert-prep/public-web/src/app/learn/page.tsx`
- Create: `database-monster-cert-prep/public-web/src/app/learn/[topicSlug]/[lessonSlug]/page.tsx`

- [ ] **Step 1: Keep `/learn` and old query links compatible**

`/learn` should select the first topic's first lesson. `/learn?topic=normalization` should select Normalization's first lesson and render the same reader.

- [ ] **Step 2: Add `/learn/[topicSlug]/[lessonSlug]`**

Resolve the topic and lesson from route params. If either is missing, render the first lesson fallback rather than throwing.

### Task 4: Refactor Learn Reader UI

**Files:**
- Modify: `database-monster-cert-prep/public-web/src/components/LearnClient.tsx`

- [ ] **Step 1: Change props**

`LearnClient` should accept:

```ts
{
  selectedTopic: LearnTopic;
  selectedLesson: LearnLesson;
}
```

- [ ] **Step 2: Render nested desktop outline**

The sidebar should show topic titles, lesson counts, and nested lesson links. Highlight the active lesson.

- [ ] **Step 3: Render mobile selectors**

Use one topic selector and one lesson selector. Changing topic sends the user to the topic's first lesson. Changing lesson sends the user to that exact lesson URL.

- [ ] **Step 4: Render lesson reader**

Use the lesson fields for definition, exam relevance, example, trap, checklist, practice, lab, previous, and next controls.

### Task 5: Update Validation

**Files:**
- Modify: `database-monster-cert-prep/public-web/tools/validate-data.mjs`

- [ ] **Step 1: Update Learn validation for nested data**

Validation should confirm:
- exactly 12 topics
- unique topic slugs
- every topic has at least one lesson
- unique lesson slugs within a topic
- every lesson has `title`, `slug`, `summary`, `definition`, `examWhy`, `example`, `trap`, `checklist`, and `practiceHref`

### Task 6: Verify

**Files:**
- No file changes unless tests expose a bug.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm run test:sql
npm run test:data
```

- [ ] **Step 2: Run static checks**

Run:

```bash
npm run lint
npm run typecheck
```

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: all commands pass. If `next/font` fails from network restrictions, rerun only when network is available and report the limitation.
