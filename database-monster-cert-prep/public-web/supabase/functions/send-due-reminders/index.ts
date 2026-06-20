declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

interface ProfileRow {
  id: string;
  display_name: string | null;
  review_reminders_last_sent_at: string | null;
}

interface MistakeRow {
  user_id: string;
  topic: string;
}

interface AuthUser {
  id: string;
  email?: string;
}

const jsonHeaders = { "Content-Type": "application/json" };

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function env(name: string): string {
  return Deno.env.get(name)?.trim() ?? "";
}

function secretKey(): string {
  const legacy = env("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;

  const secretKeys = env("SUPABASE_SECRET_KEYS");
  if (!secretKeys) return "";

  try {
    const parsed = JSON.parse(secretKeys) as Record<string, string>;
    return parsed.default ?? "";
  } catch {
    return "";
  }
}

function dayStartUtc(value: Date): number {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

function shouldSend(dueCount: number, lastSentAt: string | null, now: Date): boolean {
  if (dueCount <= 0) return false;
  if (!lastSentAt) return true;
  const sentAt = new Date(lastSentAt);
  if (Number.isNaN(sentAt.getTime())) return true;
  return sentAt.getTime() < dayStartUtc(now);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function topTopics(topics: string[], limit = 3): string[] {
  const counts = new Map<string, number>();
  for (const topic of topics) {
    const trimmed = topic.trim();
    if (!trimmed) continue;
    counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([leftTopic, leftCount], [rightTopic, rightCount]) =>
      rightCount - leftCount || leftTopic.localeCompare(rightTopic),
    )
    .slice(0, limit)
    .map(([topic]) => topic);
}

function emailBody(input: { name: string; dueCount: number; topics: string[]; appUrl: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const appUrl = input.appUrl.replace(/\/+$/, "");
  const reviewUrl = `${appUrl}/mistakes`;
  const topicText = input.topics.length ? input.topics.join(", ") : "your saved mistakes";
  const subject = `${input.dueCount} Database Monster ${input.dueCount === 1 ? "card is" : "cards are"} due`;

  return {
    subject,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.55;color:#0b1f2a">
        <p>Hi ${escapeHtml(input.name)},</p>
        <p>You have <strong>${input.dueCount}</strong> spaced-review ${input.dueCount === 1 ? "card" : "cards"} due in Database Monster.</p>
        <p>Focus area: ${escapeHtml(topicText)}.</p>
        <p><a href="${reviewUrl}" style="display:inline-block;border-radius:10px;background:#00775f;color:#fff;padding:10px 14px;text-decoration:none">Start review</a></p>
        <p style="color:#52707d;font-size:13px">You can turn reminders off anytime in your profile.</p>
      </div>
    `.trim(),
    text: [
      `Hi ${input.name},`,
      "",
      `You have ${input.dueCount} spaced-review ${input.dueCount === 1 ? "card" : "cards"} due in Database Monster.`,
      `Focus area: ${topicText}.`,
      `Start review: ${reviewUrl}`,
      "",
      "You can turn reminders off anytime in your profile.",
    ].join("\n"),
  };
}

async function supabaseFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = env("SUPABASE_URL");
  const key = secretKey();
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${detail}`);
  }

  return (await response.json()) as T;
}

async function sendEmail(input: { to: string; subject: string; html: string; text: string }): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env("REMINDER_EMAIL_FROM"),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend request failed (${response.status}): ${detail}`);
  }
}

async function updateLastSent(userId: string, nowIso: string): Promise<void> {
  await supabaseFetch(
    `/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: { ...jsonHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({ review_reminders_last_sent_at: nowIso }),
    },
  );
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Expected POST" }, 405);
  }

  const expectedSecret = env("REMINDER_CRON_SECRET");
  if (!expectedSecret) {
    return jsonResponse({ sent: 0, skipped: true, reason: "REMINDER_CRON_SECRET is not set" });
  }
  if (request.headers.get("x-cron-secret") !== expectedSecret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const required = ["SUPABASE_URL", "RESEND_API_KEY", "REMINDER_EMAIL_FROM", "REMINDER_APP_URL"];
  const missing = required.filter((name) => !env(name));
  if (!secretKey()) missing.push("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEYS");
  if (missing.length) {
    return jsonResponse({ sent: 0, skipped: true, reason: "Missing required secrets", missing });
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const profiles = await supabaseFetch<ProfileRow[]>(
    "/rest/v1/profiles?select=id,display_name,review_reminders_last_sent_at&review_reminders_opt_in=eq.true",
  );

  if (!profiles.length) return jsonResponse({ sent: 0, skipped: false, reason: "No opted-in users" });

  const userIds = profiles.map((profile) => profile.id);
  const dueRows = await supabaseFetch<MistakeRow[]>(
    `/rest/v1/mistake_notebook?select=user_id,topic&next_review_at=lte.${encodeURIComponent(nowIso)}&user_id=in.(${userIds.join(",")})`,
  );
  const dueByUser = new Map<string, string[]>();
  for (const row of dueRows) {
    dueByUser.set(row.user_id, [...(dueByUser.get(row.user_id) ?? []), row.topic]);
  }

  const authData = await supabaseFetch<{ users: AuthUser[] }>("/auth/v1/admin/users?per_page=1000");
  const emailByUser = new Map(authData.users.map((user) => [user.id, user.email ?? ""]));

  let sent = 0;
  const failed: Array<{ userId: string; error: string }> = [];

  for (const profile of profiles) {
    const topics = dueByUser.get(profile.id) ?? [];
    if (!shouldSend(topics.length, profile.review_reminders_last_sent_at, now)) continue;

    const to = emailByUser.get(profile.id);
    if (!to) {
      failed.push({ userId: profile.id, error: "No email found" });
      continue;
    }

    try {
      const body = emailBody({
        name: profile.display_name?.trim() || "Database learner",
        dueCount: topics.length,
        topics: topTopics(topics),
        appUrl: env("REMINDER_APP_URL"),
      });
      await sendEmail({ to, ...body });
      await updateLastSent(profile.id, nowIso);
      sent += 1;
    } catch (error) {
      failed.push({
        userId: profile.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return jsonResponse({ sent, failed });
});
