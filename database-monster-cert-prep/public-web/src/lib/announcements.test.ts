import test from "node:test";
import assert from "node:assert/strict";
import { CURRENT_ANNOUNCEMENT_VERSION, shouldShowAnnouncement } from "./announcements";

test("shows when nothing has been dismissed", () => {
  assert.equal(shouldShowAnnouncement(null), true);
  assert.equal(shouldShowAnnouncement(undefined), true);
  assert.equal(shouldShowAnnouncement(""), true);
});

test("hides when the current announcement version was dismissed", () => {
  assert.equal(shouldShowAnnouncement(CURRENT_ANNOUNCEMENT_VERSION), false);
});

test("shows again when a newer version is published", () => {
  assert.equal(shouldShowAnnouncement("2025-01-previous", CURRENT_ANNOUNCEMENT_VERSION), true);
});
