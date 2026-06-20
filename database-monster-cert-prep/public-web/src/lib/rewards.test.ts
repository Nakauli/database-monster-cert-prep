import assert from "node:assert/strict";
import test from "node:test";
import {
  computeWeeklyChallengeScore,
  getEarnedAchievementIds,
  getNextAchievement,
  getWeeklyChallengeWindow,
} from "@/lib/rewards";

test("awards achievements from aggregate study signals", () => {
  const earned = getEarnedAchievementIds({
    currentStreak: 7,
    longestStreak: 9,
    bestScore: 84,
    attemptCount: 3,
    averageMastery: 78,
    finalBossCount: 1,
    mistakeCount: 4,
    dueCount: 2,
    weekAttemptCount: 1,
    weekQuestionCount: 40,
  });

  assert.deepEqual(earned, [
    "hot_streak",
    "locked_in",
    "exam_ready",
    "final_boss",
    "repair_mode",
    "topic_climber",
  ]);
});

test("suggests the closest next achievement with progress", () => {
  const next = getNextAchievement({
    currentStreak: 2,
    longestStreak: 2,
    bestScore: 40,
    attemptCount: 1,
    averageMastery: 20,
    finalBossCount: 0,
    mistakeCount: 0,
    dueCount: 0,
    weekAttemptCount: 0,
    weekQuestionCount: 0,
  });

  assert.equal(next?.achievement.id, "hot_streak");
  assert.equal(next?.current, 2);
  assert.equal(next?.target, 3);
  assert.equal(next?.percent, 67);
});

test("computes the current UTC weekly challenge window", () => {
  const window = getWeeklyChallengeWindow(new Date("2026-06-21T12:00:00.000Z"));

  assert.equal(window.startsAt, "2026-06-15T00:00:00.000Z");
  assert.equal(window.endsAt, "2026-06-22T00:00:00.000Z");
  assert.equal(window.label, "Jun 15-21");
});

test("scores weekly challenge activity without private details", () => {
  assert.equal(
    computeWeeklyChallengeScore({
      currentStreak: 4,
      weekAttemptCount: 2,
      weekQuestionCount: 25,
    }),
    110,
  );
});
