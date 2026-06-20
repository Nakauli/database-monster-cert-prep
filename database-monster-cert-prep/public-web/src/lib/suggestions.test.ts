import assert from "node:assert/strict";
import test from "node:test";
import {
  formatVoteCount,
  normalizeSuggestionCategory,
  normalizeSuggestionStatus,
  statusTone,
} from "@/lib/suggestions";

test("normalizes suggestion categories", () => {
  assert.equal(normalizeSuggestionCategory("feature"), "Feature");
  assert.equal(normalizeSuggestionCategory(" UI "), "UI");
  assert.equal(normalizeSuggestionCategory("random"), null);
});

test("normalizes suggestion statuses", () => {
  assert.equal(normalizeSuggestionStatus("planned"), "Planned");
  assert.equal(normalizeSuggestionStatus("DONE"), "Done");
  assert.equal(normalizeSuggestionStatus("waiting"), null);
});

test("formats vote counts", () => {
  assert.equal(formatVoteCount(0), "0 votes");
  assert.equal(formatVoteCount(1), "1 vote");
  assert.equal(formatVoteCount(12), "12 votes");
});

test("maps suggestion status tones", () => {
  assert.equal(statusTone("Open"), "secondary");
  assert.equal(statusTone("Planned"), "warning");
  assert.equal(statusTone("Done"), "success");
  assert.equal(statusTone("Declined"), "destructive");
});
