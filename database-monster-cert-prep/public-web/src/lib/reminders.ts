export interface ReminderDecisionInput {
  optIn: boolean;
  dueCount: number;
  lastSentAt: string | null;
}

export interface ReminderEmailInput {
  displayName: string | null;
  dueCount: number;
  topics: string[];
  appUrl: string;
}

function utcDayStart(value: Date): number {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function shouldSendDueReminder(input: ReminderDecisionInput, now = new Date()): boolean {
  if (!input.optIn || input.dueCount <= 0) return false;
  if (!input.lastSentAt) return true;

  const sentAt = new Date(input.lastSentAt);
  if (Number.isNaN(sentAt.getTime())) return true;

  return sentAt.getTime() < utcDayStart(now);
}

export function summarizeDueTopics(topics: string[], limit = 3): string[] {
  const counts = new Map<string, number>();
  for (const topic of topics) {
    const normalized = topic.trim();
    if (!normalized) continue;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([leftTopic, leftCount], [rightTopic, rightCount]) =>
      rightCount - leftCount || leftTopic.localeCompare(rightTopic),
    )
    .slice(0, limit)
    .map(([topic]) => topic);
}

export function reminderSubject(dueCount: number): string {
  return `${dueCount} Database Monster ${dueCount === 1 ? "card is" : "cards are"} due`;
}

export function buildReminderEmail(input: ReminderEmailInput): { subject: string; html: string; text: string } {
  const appUrl = input.appUrl.replace(/\/+$/, "");
  const reviewUrl = `${appUrl}/mistakes`;
  const name = input.displayName?.trim() || "Database learner";
  const escapedName = escapeHtml(name);
  const topicText = input.topics.length ? input.topics.join(", ") : "your saved mistakes";
  const escapedTopics = escapeHtml(topicText);

  return {
    subject: reminderSubject(input.dueCount),
    html: `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.55;color:#0b1f2a">
        <p>Hi ${escapedName},</p>
        <p>You have <strong>${input.dueCount}</strong> spaced-review ${input.dueCount === 1 ? "card" : "cards"} due in Database Monster.</p>
        <p>Focus area: ${escapedTopics}.</p>
        <p><a href="${reviewUrl}" style="display:inline-block;border-radius:10px;background:#00775f;color:#fff;padding:10px 14px;text-decoration:none">Start review</a></p>
        <p style="color:#52707d;font-size:13px">You can turn reminders off anytime in your profile.</p>
      </div>
    `.trim(),
    text: [
      `Hi ${name},`,
      "",
      `You have ${input.dueCount} spaced-review ${input.dueCount === 1 ? "card" : "cards"} due in Database Monster.`,
      `Focus area: ${topicText}.`,
      `Start review: ${reviewUrl}`,
      "",
      "You can turn reminders off anytime in your profile.",
    ].join("\n"),
  };
}
