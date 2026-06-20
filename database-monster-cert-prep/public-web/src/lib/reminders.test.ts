import assert from "node:assert/strict";
import test from "node:test";
import {
  buildReminderEmail,
  reminderSubject,
  shouldSendDueReminder,
  summarizeDueTopics,
} from "@/lib/reminders";

const now = new Date("2026-06-20T23:00:00.000Z");

test("shouldSendDueReminder requires opt-in and due cards", () => {
  assert.equal(shouldSendDueReminder({ optIn: false, dueCount: 3, lastSentAt: null }, now), false);
  assert.equal(shouldSendDueReminder({ optIn: true, dueCount: 0, lastSentAt: null }, now), false);
  assert.equal(shouldSendDueReminder({ optIn: true, dueCount: 3, lastSentAt: null }, now), true);
});

test("shouldSendDueReminder sends at most once per UTC day", () => {
  assert.equal(
    shouldSendDueReminder({ optIn: true, dueCount: 2, lastSentAt: "2026-06-19T23:59:59.000Z" }, now),
    true,
  );
  assert.equal(
    shouldSendDueReminder({ optIn: true, dueCount: 2, lastSentAt: "2026-06-20T00:00:00.000Z" }, now),
    false,
  );
});

test("summarizeDueTopics ranks most common due topics", () => {
  assert.deepEqual(
    summarizeDueTopics(["SQL", "Joins", "SQL", "Advanced Queries"], 2),
    ["SQL", "Advanced Queries"],
  );
});

test("buildReminderEmail creates a safe reminder body", () => {
  const email = buildReminderEmail({
    displayName: "Ryan <script>",
    dueCount: 3,
    topics: ["SQL", "Joins"],
    appUrl: "https://example.com/",
  });

  assert.equal(reminderSubject(3), "3 Database Monster cards are due");
  assert.match(email.html, /Ryan &lt;script&gt;/);
  assert.match(email.html, /https:\/\/example.com\/mistakes/);
  assert.match(email.text, /SQL, Joins/);
});
