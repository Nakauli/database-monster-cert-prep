import test from "node:test";
import assert from "node:assert/strict";
import { labs } from "@/data/labs";
import {
  buildTopicPracticeHref,
  hrefForQuestionLab,
  hrefForQuestionLesson,
  rankWeakTopics,
  spacedReviewSummary,
} from "@/lib/remediation";
import type { AnswerReview, Question, TopicStat } from "@/lib/types";

function question(overrides: Partial<Question> = {}): Question {
  return {
    id: "q1",
    topic: "Joins",
    difficulty: "hard",
    type: "single-choice",
    question: "Which join returns only matching rows from both tables?",
    choices: ["A", "B"],
    correctAnswers: ["A"],
    explanation: "An inner join returns only matched rows.",
    wrongAnswerExplanations: {},
    reviewFile: "notes/05_joins.md",
    relatedConcept: "inner join",
    ...overrides,
  };
}

test("ranks weakest attempted topics by percentage, then missed count", () => {
  const stats: Record<string, TopicStat> = {
    SQL: { correct: 7, total: 10, percentage: 70 },
    Joins: { correct: 1, total: 5, percentage: 20 },
    Aggregation: { correct: 2, total: 10, percentage: 20 },
    "No attempts": { correct: 0, total: 0, percentage: 0 },
  };

  assert.deepEqual(
    rankWeakTopics(stats).map((topic) => [topic.topic, topic.missed]),
    [
      ["Aggregation", 8],
      ["Joins", 4],
      ["SQL", 3],
    ],
  );
});

test("builds a focused untimed drill href for one weak topic", () => {
  assert.equal(
    buildTopicPracticeHref("Advanced Queries", 8),
    "/exam?mode=practice&topic=Advanced%20Queries&difficulty=all&count=8",
  );
});

test("maps missed questions to lessons and matching labs", () => {
  const missed = question();

  assert.equal(hrefForQuestionLesson(missed), "/learn/joins/inner-join");
  assert.equal(hrefForQuestionLab(missed, labs), "/labs#joins");
});

test("falls back to the labs page filtered by topic when there is no clean lab match", () => {
  assert.equal(
    hrefForQuestionLab(
      question({
        topic: "Security & Admin",
        reviewFile: "notes/11_security_admin_backup.md",
        relatedConcept: "least privilege",
      }),
      labs,
    ),
    "/labs?topic=Security%20%26%20Admin",
  );
});

test("summarizes missed reviews as auto-tracked spaced review cards", () => {
  const reviews: AnswerReview[] = [
    { question: question({ id: "q1" }), selectedAnswers: ["B"], correct: false },
    { question: question({ id: "q2" }), selectedAnswers: ["A"], correct: true },
    { question: question({ id: "q3" }), selectedAnswers: [], correct: false },
  ];

  assert.deepEqual(spacedReviewSummary(reviews), {
    dueCount: 2,
    label: "2 cards now due",
  });
});
