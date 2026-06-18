# Database Monster Redesign Design

## Summary
Redesign `public-web` as a light-first certification exam simulator for classmates preparing this week. The experience should feel focused, credible, and interactive: polished shadcn/Radix UI, clearer SQL/code displays, stronger exam navigation, and typed SQL practice in labs plus topic practice. The app remains static, localStorage-only, and unofficial.

## Key Changes
- Initialize shadcn/Radix for the existing Next 16, React 19, Tailwind 4 app, using customized semantic tokens in `src/app/globals.css`: off-white background, ink text, teal/green primary accent, amber warning, red destructive, and consistent 12px-ish radius.
- Replace the single large global CSS pattern with shared primitives and layout components: app shell/nav, page header, stat summary, exam panel, question map, code/schema/table display, empty/loading/error states, review cards, lab workspace, and roadmap plan cards.
- Redesign all pages in scope: dashboard, practice, exam, review, results, mistakes, labs, roadmap, footer/header, and shared data displays.
- Add typed SQL practice for labs and topic practice using a `CodeAnswerWorkspace`: users type SQL, run pattern checks, see clause-level feedback, and can reveal the answer key/rubric. SQL is never executed in-browser.
- Keep timed exams mostly multiple-choice for certification realism and predictable scoring.
- Use CSS-first micro-interactions: tactile buttons, choice selection feedback, smoother answer reveal, timer urgency, progress transitions, skeleton loading, and reduced-motion-safe transitions.

## Interfaces And Data
- Extend question/lab data only where needed for typed SQL:
  - `expectedPatterns`: required regex/string checks such as `SELECT`, `FROM`, `JOIN`, `GROUP BY`, table names, or key predicates.
  - `rubric`: short checklist shown after self-check.
  - `answer`: existing answer key remains the final reference.
- Add a small pure utility for SQL pattern checking that returns matched/missing items and never evaluates SQL.
- Preserve existing localStorage keys and result history shape.
- No account, API, database writes, or network data collection.

## Implementation Direction
- Use a customized shadcn/Radix component layer, not stock defaults.
- Make the page light-first only in the redesigned first pass: no dark hero/results sections and no theme toggle.
- Keep the motion layer restrained and purposeful because exam screens need speed and clarity.
- Treat every public-web page as in scope for this first pass.

## Test Plan
- Run `npm run test:data`, `npm run lint`, `npm run typecheck`, and `npm run build` from `database-monster-cert-prep/public-web`.
- Add or update tests for SQL pattern-check behavior: equivalent casing, missing clauses, extra whitespace, and no false execution behavior.
- Manually verify dashboard start, topic practice setup, typed SQL self-check, timed exam navigation, mark for review, final review, result saving, mistake notebook filtering/reset, labs answer reveal, roadmap checklist, and mobile nav.
- Check accessibility basics: keyboard navigation, focus rings, labels above inputs, readable contrast, reduced motion behavior, and no button text wrapping on desktop.
