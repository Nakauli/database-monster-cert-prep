# Learn Page Design

## Summary
Add a public `/learn` page that teaches database certification topics before students answer questions. The page should use the approved Lesson Reader direction: a topic rail plus focused lesson content with definitions, examples, common traps, and direct links into practice.

## Goals
- Give classmates a place to learn concepts, not only answer quizzes.
- Reuse the existing `notes/` and cheatsheet material as the source of truth.
- Keep the diagnostic-first flow intact while adding `Learn` as the natural place to read before practice.
- Make review links from questions and mistakes meaningful by routing `reviewFile` references to Learn topics.

## User Experience
- Add `Learn` to the main navigation between `Start` and `Practice`.
- `/learn` is public and does not require authentication.
- The page opens with a compact topic overview and a focused lesson reader.
- Desktop layout uses a sticky left topic rail and a main lesson area.
- Mobile layout collapses the topic rail into a scrollable topic selector above the lesson.
- Each topic lesson includes:
  - Definition
  - Why it matters for the certification exam
  - Small SQL, schema, or scenario example
  - Common exam trap
  - Quick recall checklist
  - CTA to practice the topic
  - CTA to open SQL Labs when the topic has a runnable lab

## Content Model
- Create a static local Learn data module in `public-web`.
- Represent the 12 current exam topics:
  - Database Concepts
  - ERD & Design
  - Normalization
  - SQL
  - Joins
  - Aggregation
  - Advanced Queries
  - Constraints & Indexes
  - Transactions
  - Triggers & Procedures
  - Security & Admin
  - Troubleshooting
- Each topic should map to its existing `reviewFile` path from `questions.json`.
- Content may be summarized manually from existing markdown notes for the first pass. Do not build a markdown parser unless it clearly reduces implementation complexity.
- Keep the content concise enough for exam review: short definitions and examples, not long textbook chapters.

## Integration
- Update primary navigation to `Start`, `Learn`, `Practice`, `Progress`.
- Add `Learn` to home secondary cards or next-action helper copy where appropriate.
- Update Results and Mistakes review references so `reviewFile` links to the matching Learn topic instead of showing a raw file path.
- Keep all existing routes stable.
- No Supabase schema changes.
- No saved result or localStorage shape changes.

## Components
- `LearnClient` or equivalent page component for topic selection and lesson rendering.
- `LearnTopicRail` for topic navigation.
- `LearnLesson` for definition/example/trap/checklist sections.
- Reuse existing design primitives, cards, badges, code blocks, and buttons.
- Use existing `CodeBlock` for SQL examples and keep examples readable on mobile.

## Testing
- Run:
  - `npm run test:data`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
- Add or update data validation so every Learn topic has:
  - title
  - slug
  - source review file
  - definition
  - example or scenario
  - at least one practice CTA
- Manually verify:
  - `/learn` loads for guests.
  - Main nav includes `Learn`.
  - Topic switching works on desktop and mobile.
  - Code examples do not overflow horizontally.
  - Practice and lab CTAs route correctly.
  - Existing Start, Practice, Progress routes still work.

## Assumptions
- The first pass is static and local-only.
- Lesson Reader is the approved layout direction.
- The page teaches enough to unblock studying, but quizzes and labs remain the main practice tools.
- Generated Learn content should stay aligned with the existing notes and current 12-topic question taxonomy.
