import assert from "node:assert/strict";
import { test } from "node:test";
import { ONBOARDING_STEPS, isFirstRun } from "./onboarding";

test("isFirstRun is true only when the learner has no exam attempts", () => {
  assert.equal(isFirstRun(0), true);
  assert.equal(isFirstRun(1), false);
  assert.equal(isFirstRun(42), false);
});

test("isFirstRun treats negative/NaN attempt counts as not first-run (defensive)", () => {
  assert.equal(isFirstRun(-1), false);
  assert.equal(isFirstRun(Number.NaN), false);
});

test("ONBOARDING_STEPS lists ordered, non-empty steps", () => {
  assert.ok(ONBOARDING_STEPS.length >= 3);
  for (const step of ONBOARDING_STEPS) {
    assert.equal(typeof step.title, "string");
    assert.ok(step.title.length > 0);
    assert.ok(step.detail.length > 0);
  }
});
