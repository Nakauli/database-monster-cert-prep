import assert from "node:assert/strict";
import { test } from "node:test";
import { applyActivity, type StreakState } from "./streak";

const start: StreakState = { currentStreak: 3, longestStreak: 5, lastActiveDate: "2026-06-19" };

test("activity the day after last active increments the streak", () => {
  const next = applyActivity(start, "2026-06-20");
  assert.equal(next.currentStreak, 4);
  assert.equal(next.lastActiveDate, "2026-06-20");
});

test("a second activity on the same day is a no-op", () => {
  const next = applyActivity({ currentStreak: 4, longestStreak: 5, lastActiveDate: "2026-06-20" }, "2026-06-20");
  assert.equal(next.currentStreak, 4);
  assert.equal(next.lastActiveDate, "2026-06-20");
});

test("a gap of 2+ days resets the streak to 1", () => {
  const next = applyActivity(start, "2026-06-22");
  assert.equal(next.currentStreak, 1);
});

test("the first ever activity starts the streak at 1", () => {
  const next = applyActivity({ currentStreak: 0, longestStreak: 0, lastActiveDate: null }, "2026-06-20");
  assert.equal(next.currentStreak, 1);
  assert.equal(next.longestStreak, 1);
});

test("longest streak only ever grows", () => {
  const next = applyActivity({ currentStreak: 5, longestStreak: 5, lastActiveDate: "2026-06-19" }, "2026-06-20");
  assert.equal(next.currentStreak, 6);
  assert.equal(next.longestStreak, 6);
});
