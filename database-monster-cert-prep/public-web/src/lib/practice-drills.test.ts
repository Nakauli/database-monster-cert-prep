import test from "node:test";
import assert from "node:assert/strict";
import { getPracticeDrill } from "@/lib/practice-drills";

test("uses a runnable SQL challenge for advanced query warmups", () => {
  const drill = getPracticeDrill("Advanced Queries");

  assert.ok(drill);
  assert.equal(drill.title, "Advanced Queries drill");
  assert.match(drill.starter, /\bstudents\b/);
  assert.match(drill.starter, /\benrollments\b/);
  assert.match(drill.expectedSql, /\bAVG\s*\(\s*grade\s*\)/i);
  assert.doesNotMatch(drill.starter, /\btable_name\b/);
  assert.doesNotMatch(drill.starter, /\bcolumn_name\b/);
  assert.deepEqual(drill.schema?.map((schema) => schema.table), ["students", "enrollments"]);
});

test("does not create fake SQL warmups for conceptual topics", () => {
  assert.equal(getPracticeDrill("Security"), null);
});
