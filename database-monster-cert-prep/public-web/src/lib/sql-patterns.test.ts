import test from "node:test";
import assert from "node:assert/strict";
import { checkSqlPatterns } from "./sql-patterns";

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
