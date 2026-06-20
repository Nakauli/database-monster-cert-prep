export interface OnboardingStep {
  title: string;
  detail: string;
}

/**
 * The first-run walkthrough of the exam-prep loop, shown on `/welcome`.
 * Mirrors the dashboard guided path but explains *why* each step matters,
 * including the spaced-repetition + streak features added in Phase 1.
 */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Take the diagnostic",
    detail:
      "A balanced baseline exam maps your strengths and weak topics, and seeds your private mistake notebook — so the app knows what to drill.",
  },
  {
    title: "Repair your weak topics",
    detail:
      "Your dashboard turns those results into one clear next move: the lowest-mastery topic to practice next.",
  },
  {
    title: "Review mistakes with spaced repetition",
    detail:
      "Missed questions resurface as flashcards exactly when you're about to forget them. Grade each one and the schedule adapts.",
  },
  {
    title: "Build a streak, then prove it under the clock",
    detail:
      "Studying every day grows your streak. When your repair queue is clear, run a timed exam to confirm the score holds.",
  },
];

/**
 * A learner is in their first run until they have completed at least one exam
 * attempt. Defensive against non-positive / NaN counts so a bad value never
 * accidentally forces the onboarding flow on a returning user.
 */
export function isFirstRun(attemptCount: number): boolean {
  return Number.isFinite(attemptCount) && attemptCount === 0;
}
