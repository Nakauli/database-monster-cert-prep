import assert from "node:assert/strict";
import { test } from "node:test";
import { computeNextReview, dueCount, isDue } from "./srs";

const base = { ease: 2.5, intervalDays: 0, reps: 0 };
const now = new Date("2026-06-20T00:00:00.000Z");

function daysBetween(fromIso: string, to: Date): number {
  return Math.round((new Date(fromIso).getTime() - to.getTime()) / 86_400_000);
}

test("first 'good' review schedules 1 day out and increments reps", () => {
  const next = computeNextReview(base, "good", now);
  assert.equal(next.reps, 1);
  assert.equal(next.intervalDays, 1);
  assert.equal(daysBetween(next.nextReviewAt, now), 1);
});

test("second 'good' review schedules 3 days out", () => {
  const next = computeNextReview({ ease: 2.5, intervalDays: 1, reps: 1 }, "good", now);
  assert.equal(next.reps, 2);
  assert.equal(next.intervalDays, 3);
});

test("third 'good' review scales the interval by ease", () => {
  const next = computeNextReview({ ease: 2.5, intervalDays: 3, reps: 2 }, "good", now);
  assert.equal(next.reps, 3);
  assert.equal(next.intervalDays, 8); // round(3 * 2.5)
});

test("'again' resets reps, makes the card due today, and lowers ease", () => {
  const next = computeNextReview({ ease: 2.5, intervalDays: 8, reps: 3 }, "again", now);
  assert.equal(next.reps, 0);
  assert.equal(next.intervalDays, 0);
  assert.equal(next.ease, 2.3);
  assert.equal(daysBetween(next.nextReviewAt, now), 0);
});

test("'hard' shortens the interval and lowers ease", () => {
  const next = computeNextReview({ ease: 2.5, intervalDays: 10, reps: 3 }, "hard", now);
  assert.equal(next.intervalDays, 15); // round(round(10*2.5)=25 *0.6)=15
  assert.equal(next.ease, 2.35);
});

test("'easy' lengthens the interval and raises ease", () => {
  const next = computeNextReview({ ease: 2.5, intervalDays: 3, reps: 2 }, "easy", now);
  assert.equal(next.intervalDays, 10); // round(round(3*2.5)=8 *1.3)=10
  assert.equal(next.ease, 2.65);
});

test("ease never drops below 1.30", () => {
  const next = computeNextReview({ ease: 1.35, intervalDays: 5, reps: 3 }, "again", now);
  assert.equal(next.ease, 1.3);
});

test("ease never rises above 3.00", () => {
  const next = computeNextReview({ ease: 2.95, intervalDays: 5, reps: 3 }, "easy", now);
  assert.equal(next.ease, 3);
});

test("isDue and dueCount use next_review_at vs now", () => {
  const cards = [
    { nextReviewAt: "2026-06-19T00:00:00.000Z" }, // overdue
    { nextReviewAt: "2026-06-20T00:00:00.000Z" }, // due exactly now
    { nextReviewAt: "2026-06-21T00:00:00.000Z" }, // future
  ];
  assert.equal(isDue(cards[0], now), true);
  assert.equal(isDue(cards[2], now), false);
  assert.equal(dueCount(cards, now), 2);
});
