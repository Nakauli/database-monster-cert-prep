import test from "node:test";
import assert from "node:assert/strict";
import { checkSqlPatterns, findUnresolvedSqlHints } from "./sql-patterns";

const patterns = [
  { id: "select", label: "Use SELECT", pattern: "\\bselect\\b" },
  { id: "from", label: "Use FROM students", pattern: "\\bfrom\\s+students\\b" },
  { id: "order", label: "Sort by last_name", pattern: "\\border\\s+by\\s+last_name\\b" },
];

test("matches SQL patterns regardless of case and extra whitespace", () => {
  const result = checkSqlPatterns("  Select first_name, last_name\nFROM   students\nORDER BY last_name; ", patterns);

  assert.deepEqual(result.matched.map((item) => item.id), ["select", "from", "order"]);
  assert.deepEqual(result.missing, []);
  assert.equal(result.score, 100);
  assert.equal(result.executed, false);
});

test("reports missing SQL patterns without executing submitted SQL", () => {
  const result = checkSqlPatterns("SELECT first_name FROM teachers;", patterns);

  assert.deepEqual(result.matched.map((item) => item.id), ["select"]);
  assert.deepEqual(result.missing.map((item) => item.id), ["from", "order"]);
  assert.equal(result.score, 33);
  assert.equal(result.executed, false);
});

test("finds unresolved SQL hint comments before SQLite sees broken syntax", () => {
  const hints = findUnresolvedSqlHints(
    "SELECT DISTINCT s.full_name\nFROM students AS s\nWHERE e.grade > (/* scalar subquery */);",
  );

  assert.deepEqual(hints, [
    {
      label: "scalar subquery",
      message: "Replace the scalar subquery hint with a real SQL clause before running.",
    },
  ]);
});

test("finds common starter placeholders and explains what to replace", () => {
  const hints = findUnresolvedSqlHints(
    "SELECT full_name\nFROM students\nWHERE /* condition */\nORDER BY /* column */;",
  );

  assert.deepEqual(hints.map((hint) => hint.label), ["condition", "column"]);
  assert.match(hints[0].message, /condition/);
  assert.match(hints[1].message, /column/);
});

test("finds TODO-style starter placeholders", () => {
  const hints = findUnresolvedSqlHints(
    "WHERE e.grade > (/* TODO: SELECT AVG(grade) FROM enrollments */);",
  );

  assert.deepEqual(hints.map((hint) => hint.label), ["SELECT AVG(grade) FROM enrollments"]);
});

test("does not flag ordinary SQL comments after the answer is complete", () => {
  const hints = findUnresolvedSqlHints(
    "-- This query keeps the answer readable.\nSELECT full_name FROM students WHERE status = 'active';",
  );

  assert.deepEqual(hints, []);
});
