import assert from "node:assert/strict";
import test from "node:test";
import { getAvatarInitials } from "./avatar";
import { COURSE_OPTIONS, normalizeCourse } from "./courses";
import { formatLastActive } from "./leaderboard";

test("normalizes allowed course values", () => {
  assert.deepEqual(COURSE_OPTIONS, ["IT", "CS"]);
  assert.equal(normalizeCourse("it"), "IT");
  assert.equal(normalizeCourse("CS"), "CS");
  assert.equal(normalizeCourse("engineering"), null);
});

test("creates stable avatar initials", () => {
  assert.equal(getAvatarInitials("Ryan Deniega"), "RD");
  assert.equal(getAvatarInitials("aljun"), "A");
  assert.equal(getAvatarInitials(""), "DB");
});

test("formats last active labels without exposing raw history", () => {
  assert.equal(formatLastActive(null), "No activity yet");
  assert.match(formatLastActive("2026-06-19T00:00:00.000Z"), /2026/);
});
