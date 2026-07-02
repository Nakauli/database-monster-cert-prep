import assert from "node:assert/strict";
import test from "node:test";
import { createExamQuestions, fixedExamPacks, questions, topics } from "./questions";

const unsupportedContextFields = ["code", "outputTable"] as const;
const tableContextFields = ["schema", "sampleData"] as const;

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
        unsupportedContextFields.every((field) => !(field in question)) &&
        tableContextFields.every((field) => !(field in question) || Boolean(question.examPack))),
      `${mode} should not reintroduce unverified supplemental context`,
    );
  }
});

test("fixed exam packs use the source pack order without shuffling choices", () => {
  for (const mode of Object.keys(fixedExamPacks)) {
    const source = questions.filter((question) => question.examPack === mode);
    const selected = createExamQuestions(mode);

    assert.equal(selected.length, source.length);
    assert.deepEqual(selected.map((question) => question.id), source.map((question) => question.id));
    assert.deepEqual(selected.map((question) => question.choices), source.map((question) => question.choices));
  }
});

test("fixed exam packs can include verified table context", () => {
  const fixedPackQuestions = questions.filter((question) => question.examPack);
  const tableQuestions = fixedPackQuestions.filter((question) =>
    tableContextFields.some((field) => field in question));

  assert.ok(tableQuestions.length >= 30, "fixed exam packs should include table-backed questions");
  assert.ok(
    tableQuestions.every((question) =>
      question.sampleData?.every((table) =>
        table.columns.length > 0 &&
        table.rows.length > 0 &&
        table.rows.every((row) => row.length === table.columns.length))),
    "sample tables should have complete columns and row values",
  );
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
