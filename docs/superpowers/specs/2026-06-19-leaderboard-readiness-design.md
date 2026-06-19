# Leaderboard Readiness Design

## Summary

Add an opt-in class leaderboard for Database Monster so classmates can see who looks most ready for the database certification exam. The leaderboard should motivate practice without exposing private study data. It ranks students by a readiness score, supports `IT` and `CS` course filtering, appears as a subtle animated preview on the home hero, and links to public student study cards.

This work should happen on a separate branch from `main`.

## Goals

- Make the home page feel more alive with a lowkey animated leaderboard preview.
- Add a full leaderboard page that ranks opt-in students by exam readiness.
- Add clickable public student profiles from leaderboard rows.
- Add a course dropdown to account creation with `IT` and `CS`.
- Let students opt into or out of public leaderboard visibility.
- Keep raw exam attempts, mistake notebook rows, question answers, emails, and private history protected.

## Non-Goals

- No public access to raw user tables.
- No question-level public profile data.
- No email display on leaderboard or public student profiles.
- No gamified points system in this pass.
- No destructive database migration.
- No paid Supabase features required.

## Product Decisions

### Visibility

Leaderboard visibility is opt-in. New accounts default to hidden unless the student chooses to appear on the leaderboard during registration or later in Profile.

### Ranking Metric

The main leaderboard rank is a `readiness_score` from existing progress data. It should answer: "Who looks most ready for the certification exam this week?"

Readiness formula:

- 50% best exam score from the student's 10 most recent diagnostic, timed, or final-boss attempts.
- 25% average topic mastery from `user_topic_progress.mastery_score`.
- 15% mistake repair health, calculated as `100 - least(unresolved_mistakes * 5, 100)`.
- 10% activity freshness, calculated from `last_active_at`: `100` within 7 days, `60` within 14 days, `30` within 30 days, otherwise `0`.

The exact SQL should clamp the final score from `0` to `100` and handle users with incomplete data gracefully.

### Public Student Profile

Clicking a leaderboard row opens a public study card. It shows only:

- Display name.
- Course.
- Avatar initials.
- Current rank.
- Readiness score.
- Best recent exam score.
- Attempts completed.
- Average mastery.
- Last active date.
- Strongest topics.
- Weakest topics.

It must not show:

- Email address.
- Full exam history.
- Mistake notebook.
- Question-level answers.
- Private profile fields beyond display name and course.

## UX Design

### Home Hero Preview

The hero keeps the diagnostic-first message. A compact "Class readiness" panel should sit in the hero area and show the top three opt-in students.

The animation should be subtle:

- Rows gently slide or rise into place.
- Scores can softly pulse once on load.
- Motion must respect reduced-motion preferences.
- Avoid confetti, medals overload, or flashy arcade styling.

Empty state:

- If no leaderboard data exists, show "Join the leaderboard from your profile" with a link to register or profile depending on auth state.

### Leaderboard Page

Add route `/leaderboard`.

The page should include:

- Header explaining that rankings are opt-in and based on readiness.
- Course filters: `All`, `IT`, `CS`.
- Ranked rows/cards with rank, avatar initials, display name, course, readiness score, best score, attempts, and last active.
- Subtle highlight for the signed-in student's row when available.
- Empty states for no opt-in students and no students in the selected course.

### Public Student Page

Add route `/students/[id]`.

The page should include:

- Public study card layout.
- Readiness score and rank as the primary stat.
- Course and avatar initials.
- Best score, attempts, average mastery, and last active.
- Strongest and weakest topic chips.
- Link back to `/leaderboard`.
- Not-found state if the user is hidden, missing, or has no public leaderboard row.

### Registration And Profile

Registration gets:

- Course dropdown with `IT` and `CS`.
- Optional leaderboard opt-in checkbox.

Profile gets:

- Course dropdown with `IT` and `CS`.
- Leaderboard visibility checkbox.
- Clear helper text explaining what becomes public.

## Supabase Design

### Existing Tables

The existing remote project has:

- `profiles`: `id`, `display_name`, `school`, `course`, `created_at`, `updated_at`.
- `exam_attempts`: per-user exam results.
- `question_attempts`: per-question answers.
- `mistake_notebook`: private repair list.
- `user_topic_progress`: aggregate topic mastery.

All current public tables have RLS enabled.

### Migration

Add one migration:

- Add `profiles.leaderboard_opt_in boolean not null default false`.
- Add `profiles_leaderboard_course_idx` on `(leaderboard_opt_in, course)` to support opt-in/course filtering.
- Update `handle_new_user()` so it stores `display_name`, `course`, and `leaderboard_opt_in` from signup metadata.
- Keep existing `course text`; enforce `IT` and `CS` in the app UI for now to avoid breaking existing rows with null or legacy values.

### Public Access Pattern

Do not loosen RLS policies on raw tables.

Add security-definer RPCs that return only safe aggregate fields:

- `get_public_leaderboard(p_course text default null)`
- `get_public_student_profile(p_user_id uuid)`

The functions should:

- Include only `profiles.leaderboard_opt_in = true`.
- Filter by `course` when provided.
- Calculate rank and readiness in the database.
- Return public-safe rows only.
- Avoid returning email, raw attempt IDs, raw answer data, or mistake contents.
- Use `security definer` with an explicit `search_path`.

The frontend can call these RPCs from server components.

## Data Contract

Leaderboard rows should include:

- `user_id`
- `display_name`
- `course`
- `rank`
- `readiness_score`
- `best_score`
- `attempt_count`
- `average_mastery`
- `last_active_at`
- `strongest_topics`
- `weakest_topics`

Topic lists should be short arrays, ideally capped to three items each.
`last_active_at` should be the greatest available timestamp from recent exam attempts and topic progress.

## Components And Routes

New or updated units:

- `src/app/leaderboard/page.tsx`
- `src/app/students/[id]/page.tsx`
- `src/components/leaderboard/LeaderboardPreview.tsx`
- `src/components/leaderboard/LeaderboardTable.tsx`
- `src/components/leaderboard/PublicStudentProfile.tsx`
- `src/lib/leaderboard.ts`
- Registration and profile form updates.
- `src/lib/courses.ts` for shared `IT` / `CS` options.

Keep the top nav simplified. Do not add leaderboard as a fourth primary nav item unless later requested. Link to it contextually from the home hero preview and progress/home cards.

## Error Handling

- If Supabase is not configured, show an explanatory empty state instead of crashing.
- If leaderboard RPC returns no rows, show an opt-in empty state.
- If a public student profile is hidden or missing, show a friendly not-found message with a link back to the leaderboard.
- If register/profile save fails, surface the Supabase error in the existing form message pattern.

## Accessibility

- Leaderboard rows must be keyboard-accessible links.
- Animated preview must not be the only way to understand rankings.
- Respect `prefers-reduced-motion`.
- Course filters must have visible focus states and clear selected state.
- Avatar initials need accessible names or adjacent text labels.

## Testing

Run from `database-monster-cert-prep/public-web`:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Add focused tests where practical:

- Readiness/leaderboard scoring utility if calculation is split into TypeScript.
- Data contract helper for formatting initials/topics.

Manual checks:

- Register flow captures `IT` or `CS` and opt-in state.
- Profile can change course and leaderboard visibility.
- Hidden users do not appear on leaderboard.
- Public leaderboard filters by `All`, `IT`, and `CS`.
- Leaderboard rows link to public student profiles.
- Public profile does not expose email, mistakes, raw answers, or full history.
- Home hero preview animates subtly and respects reduced motion.
- Empty states work for no Supabase config and no opt-in students.

## Open Implementation Notes

- Prefer database aggregation for leaderboard rankings so all users see consistent ranks.
- Keep the public profile route unauthenticated, but only show opt-in aggregate data.
- If remote migration drift appears, inspect Supabase MCP migrations before applying any changes.
- Preserve existing localStorage and exam result shapes.
