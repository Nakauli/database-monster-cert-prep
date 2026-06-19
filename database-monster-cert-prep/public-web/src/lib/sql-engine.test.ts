import assert from "node:assert/strict";
import { test } from "node:test";
import { compareSqlResults, type SqlResultSet } from "@/lib/sql-engine";

const expected: SqlResultSet = {
  columns: ["full_name", "grade"],
  rows: [
    ["Ana Reyes", 92],
    ["Ben Cruz", 88],
  ],
};

test("compares equivalent SQL result sets without requiring row order by default", () => {
  const user: SqlResultSet = {
    columns: ["name", "score"],
    rows: [
      ["Ben Cruz", 88],
      ["Ana Reyes", 92],
    ],
  };

  assert.equal(compareSqlResults(user, expected, { ordered: false }), true);
});

test("can require row order when an ORDER BY result matters", () => {
  const user: SqlResultSet = {
    columns: ["full_name", "grade"],
    rows: [
      ["Ben Cruz", 88],
      ["Ana Reyes", 92],
    ],
  };

  assert.equal(compareSqlResults(user, expected, { ordered: true }), false);
});

test("treats duplicate rows as a multiset, not just a set", () => {
  const user: SqlResultSet = {
    columns: ["full_name", "grade"],
    rows: [
      ["Ana Reyes", 92],
      ["Ben Cruz", 88],
      ["Ben Cruz", 88],
    ],
  };

  assert.equal(compareSqlResults(user, expected, { ordered: false }), false);
});
