import assert from "node:assert/strict";
import { test } from "node:test";
import { computeReadiness } from "@/lib/readiness";
import type { ExamResult, ProgressData } from "@/lib/types";

const result: ExamResult = {
  id: "result-1",
  mode: "diagnostic",
  title: "Diagnostic Exam",
  completedAt: "2026-06-18T00:00:00.000Z",
  durationSeconds: 1800,
  score: 80,
  correct: 32,
  total: 40,
  topicStats: {
    SQL: { correct: 9, total: 10, percentage: 90 },
    Joins: { correct: 4, total: 10, percentage: 40 },
    Security: { correct: 7, total: 10, percentage: 70 },
  },
  reviews: [],
};

test("returns an uncalibrated readiness state with no attempts", () => {
  const progress: ProgressData = { attempts: [], mistakes: [] };

  assert.deepEqual(computeReadiness(progress, null), {
    score: 0,
    verdict: "Not calibrated",
    blurb: "Take the diagnostic exam to generate your readiness reading.",
    attempts: 0,
    mastery: [],
  });
});

test("blends recent attempt average with unresolved mistake pressure", () => {
  const progress: ProgressData = {
    attempts: [
      { id: "a", mode: "timed", title: "Timed", score: 90, completedAt: "2026-06-18T00:00:00.000Z" },
      { id: "b", mode: "timed", title: "Timed", score: 80, completedAt: "2026-06-17T00:00:00.000Z" },
      { id: "c", mode: "timed", title: "Timed", score: 70, completedAt: "2026-06-16T00:00:00.000Z" },
    ],
    mistakes: [
      {
        questionId: "q1",
        topic: "Joins",
        question: "Which join keeps unmatched left rows?",
        selectedAnswers: ["INNER JOIN"],
        correctAnswers: ["LEFT JOIN"],
        explanation: "LEFT JOIN preserves rows from the left table.",
        wrongAnswerExplanations: {},
        misses: 5,
        lastMissedAt: "2026-06-18T00:00:00.000Z",
      },
    ],
  };

  const readiness = computeReadiness(progress, result);

  assert.equal(readiness.score, 78);
  assert.equal(readiness.verdict, "Almost there");
  assert.equal(readiness.attempts, 3);
  assert.deepEqual(readiness.mastery.map((item) => item.topic), ["Joins", "Security", "SQL"]);
});
