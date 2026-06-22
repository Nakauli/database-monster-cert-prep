import assert from "node:assert/strict";
import test from "node:test";
import { buildAvatarPath, getAvatarPublicUrl } from "./avatar";
import {
  formatPresenceFreshness,
  isAllowedPresenceStatus,
  mapPathToPresence,
  PRESENCE_STALE_AFTER_MS,
  shapePublicPresenceRows,
} from "./presence";

test("maps routes to coarse presence statuses", () => {
  assert.deepEqual(mapPathToPresence("/practice?topic=Joins"), { status: "practicing", currentArea: "practice" });
  assert.deepEqual(mapPathToPresence("/mistakes"), { status: "reviewing", currentArea: "mistakes" });
  assert.deepEqual(mapPathToPresence("/exam?mode=final_boss"), { status: "taking exam", currentArea: "exam" });
  assert.deepEqual(mapPathToPresence("/learn/core/intro"), { status: "learning", currentArea: "learn" });
  assert.deepEqual(mapPathToPresence("/labs"), { status: "learning", currentArea: "labs" });
  assert.deepEqual(mapPathToPresence("/leaderboard"), { status: "viewing leaderboard", currentArea: "leaderboard" });
  assert.deepEqual(mapPathToPresence("/dashboard"), { status: "online", currentArea: "app" });
});

test("validates allowed presence statuses", () => {
  assert.equal(isAllowedPresenceStatus("online"), true);
  assert.equal(isAllowedPresenceStatus("practicing"), true);
  assert.equal(isAllowedPresenceStatus("reviewing"), true);
  assert.equal(isAllowedPresenceStatus("taking exam"), true);
  assert.equal(isAllowedPresenceStatus("learning"), true);
  assert.equal(isAllowedPresenceStatus("viewing leaderboard"), true);
  assert.equal(isAllowedPresenceStatus("solving Joins question 12"), false);
});

test("formats presence freshness without exposing raw timestamps", () => {
  const now = new Date("2026-06-23T12:00:00.000Z");
  assert.equal(formatPresenceFreshness("2026-06-23T11:59:20.000Z", now), "now");
  assert.equal(formatPresenceFreshness("2026-06-23T11:56:10.000Z", now), "4m ago");
  assert.equal(formatPresenceFreshness("2026-06-23T11:50:00.000Z", now), "10m ago");
  assert.equal(formatPresenceFreshness(null, now), "recently");
});

test("keeps the stale threshold at ten minutes", () => {
  assert.equal(PRESENCE_STALE_AFTER_MS, 10 * 60 * 1000);
});

test("shapes public presence rows with safe fallbacks", () => {
  const avatarPath = buildAvatarPath("user-1", "image/webp", "44b6e832-cb85-4bc1-89fa-1af73ed19331");
  const rows = shapePublicPresenceRows([
    {
      user_id: "user-1",
      display_name: "",
      course: "IT",
      avatar_path: avatarPath,
      status: "practicing",
      last_seen_at: "2026-06-23T11:59:00.000Z",
    },
    {
      user_id: "user-2",
      display_name: "Mia",
      course: null,
      avatar_path: "../private.txt",
      status: "exact private topic",
      last_seen_at: "2026-06-23T11:58:00.000Z",
    },
  ], "https://example.supabase.co");

  assert.equal(rows[0].display_name, "Database learner");
  assert.equal(rows[0].status, "practicing");
  assert.equal(rows[0].avatar_url, getAvatarPublicUrl(avatarPath, "https://example.supabase.co"));
  assert.equal(rows[1].display_name, "Mia");
  assert.equal(rows[1].status, "online");
  assert.equal(rows[1].avatar_url, null);
});
