export type ReviewGrade = "again" | "hard" | "good" | "easy";

export interface SrsCard {
  ease: number;
  intervalDays: number;
  reps: number;
}

export interface SrsState extends SrsCard {
  nextReviewAt: string;
}

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const DAY_MS = 86_400_000;

export function computeNextReview(card: SrsCard, grade: ReviewGrade, now: Date = new Date()): SrsState {
  let ease = card.ease;
  let reps = card.reps;
  let intervalDays: number;

  if (grade === "again") {
    reps = 0;
    intervalDays = 0;
    ease -= 0.2;
  } else {
    reps += 1;
    if (reps === 1) {
      intervalDays = 1;
    } else if (reps === 2) {
      intervalDays = 3;
    } else {
      intervalDays = Math.round(card.intervalDays * ease);
    }

    if (grade === "hard") {
      intervalDays = Math.max(1, Math.round(intervalDays * 0.6));
      ease -= 0.15;
    } else if (grade === "easy") {
      intervalDays = Math.round(intervalDays * 1.3);
      ease += 0.15;
    }
  }

  ease = Math.min(MAX_EASE, Math.max(MIN_EASE, ease));
  const nextReviewAt = new Date(now.getTime() + intervalDays * DAY_MS).toISOString();
  return { ease: Number(ease.toFixed(2)), intervalDays, reps, nextReviewAt };
}

export function isDue(card: { nextReviewAt: string }, now: Date = new Date()): boolean {
  return new Date(card.nextReviewAt).getTime() <= now.getTime();
}

export function dueCount(cards: Array<{ nextReviewAt: string }>, now: Date = new Date()): number {
  return cards.reduce((count, card) => (isDue(card, now) ? count + 1 : count), 0);
}
