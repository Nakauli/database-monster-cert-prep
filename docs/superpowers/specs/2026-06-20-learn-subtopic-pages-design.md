# Learn Subtopic Pages Design

## Summary
Expand the Learn area from compact topic summaries into a course-style reader with detailed subtopic pages. The audience is classmates preparing for a database certification exam, so the experience should make concepts easy to study before attempting practice, labs, or timed exams.

The chosen structure is Topic -> Subtopic Reader. Each major certification topic remains visible as a group, and each group contains individual lessons with their own page and URL, such as `/learn/normalization/1nf` or `/learn/stored-routines-functions-triggers/stored-functions`.

## Goals
- Make Learn feel like a complete study section, not a short glossary.
- Give high-confusion concepts their own pages, especially normalization forms, joins, aggregation, advanced queries, and stored routines.
- Keep every lesson focused on one idea: definition, exam relevance, example, common trap, checklist, and practice links.
- Preserve current app behavior, routes, scoring, auth, Supabase schema, and saved result shapes.
- Keep old `/learn?topic=...` and review-file links useful by sending them to the best matching lesson.

## Non-Goals
- No Supabase migrations.
- No user progress tracking for lesson reading in this pass.
- No long textbook chapters or video-style course player.
- No changes to exam scoring, practice history, leaderboard scoring, or mistake history.

## Information Architecture
`/learn` becomes the course entry point and should default to the first lesson. New lesson pages use route params:

- `/learn/[topicSlug]/[lessonSlug]`
- Example: `/learn/normalization/1nf`
- Example: `/learn/joins/left-join`
- Example: `/learn/stored-routines-functions-triggers/stored-procedures`

Compatibility behavior:
- `/learn?topic=normalization` should resolve to the first lesson in Normalization.
- Existing review links using `reviewFile` should still return a Learn destination.
- If a topic or lesson slug is invalid, fall back to the first lesson rather than breaking the page.

## Data Model
Replace the flat `LearnTopic` shape with a nested topic/lesson model:

```ts
interface LearnTopic {
  title: string;
  slug: string;
  summary: string;
  reviewFile: string;
  lessons: LearnLesson[];
}

interface LearnLesson {
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
```

The first implementation can keep lesson content in `src/data/learn-topics.ts`. This keeps the app static and avoids new data-loading complexity.

## Lesson Set

### Database Concepts
- DBMS, database, schema, and instance
- Tables, rows, and columns
- Primary, candidate, composite, and surrogate keys
- Foreign keys and relationships
- NULL meaning and common mistakes

### ERD & Design
- Entities and attributes
- Cardinality and optionality
- One-to-many relationships
- Many-to-many and junction tables
- Turning business rules into tables

### Normalization
- Why normalization exists
- 1NF
- 2NF
- 3NF
- BCNF basics
- Functional dependencies
- Insert, update, and delete anomalies

### SQL
- SELECT and FROM
- WHERE predicates
- NULL checks
- ORDER BY and LIMIT
- Aliases and expressions

### Joins
- INNER JOIN
- LEFT JOIN
- RIGHT and FULL JOIN concepts
- CROSS JOIN
- SELF JOIN
- Join keys and ON vs WHERE

### Aggregation
- COUNT, SUM, and AVG
- GROUP BY
- HAVING
- NULL behavior in aggregates
- Grouping mistakes

### Advanced Queries
- Scalar subqueries
- IN subqueries
- EXISTS and NOT EXISTS
- CASE expressions
- Views and CTE-style reasoning
- Set operations

### Constraints & Indexes
- CREATE TABLE basics
- NOT NULL, UNIQUE, CHECK, and DEFAULT
- Primary and foreign key constraints
- Index purpose
- When indexes hurt

### Transactions
- DML: INSERT, UPDATE, and DELETE
- ACID
- BEGIN, COMMIT, and ROLLBACK
- Savepoints
- Safe update workflow

### Stored Routines, Functions & Triggers
- What stored routines are
- Stored procedures
- Stored functions
- Procedure vs function differences
- Parameters: IN, OUT, and INOUT
- Return values
- Calling procedures and functions
- Trigger basics
- BEFORE vs AFTER triggers
- OLD and NEW values
- Audit triggers
- Hidden side effects and portability

### Security & Admin
- Authentication vs authorization
- Least privilege
- SQL injection defense
- Backups, RPO, and RTO
- Auditing and logs

### Troubleshooting
- Wrong row counts
- NULL surprises
- Join duplicates
- Constraint errors
- Slow query first checks

## UI Design
Desktop layout:
- Keep the current Learn page header.
- Use a sticky left course outline.
- Each topic in the outline shows title, lesson count, and nested lesson links.
- The active lesson is visually highlighted.
- The main area shows one lesson at a time.

Mobile layout:
- Show a topic selector and a lesson selector above the reader.
- Avoid a long nested mobile list that requires excessive scrolling.

Lesson reader layout:
- Header: lesson badge, topic title, lesson title, short summary.
- Section 1: Definition.
- Section 2: Why it matters for the exam.
- Section 3: Example, including SQL/code where useful.
- Section 4: Common exam trap.
- Section 5: Quick recall checklist.
- Footer actions: Previous lesson, Next lesson, Practice this, and Open matching lab when available.

## Navigation And Linking
Add Learn helpers for:
- Finding topic by slug.
- Finding lesson by topic slug and lesson slug.
- Finding the first lesson for a topic.
- Flattening all lessons for previous/next navigation.
- Mapping a `reviewFile` to a topic's first lesson.

Old helpers should continue returning valid Learn URLs, but they can now return the first lesson URL instead of `/learn?topic=...`.

## Error Handling
- Missing or invalid topic slug: show the first topic's first lesson.
- Missing or invalid lesson slug: show the selected topic's first lesson.
- Topic with no lessons should fail data validation.
- Lesson with missing core content should fail data validation.

## Testing
Add or update tests for:
- `learnTopicBySlug`.
- `learnLessonBySlug`.
- first lesson fallback.
- previous/next lesson navigation.
- `hrefForLearnTopic`.
- `hrefForLearnLesson`.
- `hrefForReviewFile`.

Update data validation so:
- every topic has at least one lesson.
- every lesson has title, slug, summary, definition, examWhy, example, trap, checklist, and practiceHref.
- topic slugs are unique.
- lesson slugs are unique within each topic.

Run:
- `npm run test:sql`
- `npm run test:data`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Rollout Notes
This is a static frontend content expansion. It can ship without database changes. The first pass should prioritize clear study content and stable navigation over tracking read progress.
