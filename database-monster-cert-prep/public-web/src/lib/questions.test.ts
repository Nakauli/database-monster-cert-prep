import assert from "node:assert/strict";
import test from "node:test";
import { createExamQuestions, questions, topics } from "./questions";

const unverifiedContextFields = ["schema", "sampleData", "code", "outputTable"] as const;

test("all exam modes select only verified questions from the shared bank", () => {
  // Requested defaults per mode; the actual selection is capped by how many
  // questions the focused whiteboard bank can supply for that mode.
  const requestedCounts = {
    practice: 15,
    timed: 40,
    diagnostic: 40,
    final: 45,
    panic: 10,
  };
  const finalPool = questions.filter((question) =>
    ["hard", "final boss"].includes(question.difficulty)).length;
  const poolForMode = (mode: string) => (mode === "final" ? finalPool : questions.length);
  const questionIds = new Set(questions.map((question) => question.id));

  for (const [mode, requestedCount] of Object.entries(requestedCounts)) {
    const selected = createExamQuestions(mode);
    const expectedCount = Math.min(requestedCount, poolForMode(mode));

    assert.equal(selected.length, expectedCount, `${mode} should select ${expectedCount} questions`);
    assert.ok(
      selected.every((question) => questionIds.has(question.id)),
      `${mode} should select only questions from the shared bank`,
    );
    assert.ok(
      selected.every((question) =>
        unverifiedContextFields.every((field) => !(field in question))),
      `${mode} should not reintroduce unverified supplemental context`,
    );
  }
});

test("topic practice stays within its selected topic", () => {
  for (const topic of topics) {
    const selected = createExamQuestions("practice", topic);
    const topicPool = questions.filter((question) => question.topic === topic).length;

    assert.equal(selected.length, Math.min(15, topicPool));
    assert.ok(selected.every((question) => question.topic === topic));
  }
});

test("final mode uses only hard and final-boss questions", () => {
  const selected = createExamQuestions("final");

  assert.ok(
    selected.every((question) => ["hard", "final boss"].includes(question.difficulty)),
  );
});
