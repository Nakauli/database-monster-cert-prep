import { getAvatarPublicUrl } from "@/lib/avatar";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const PRESENCE_STALE_AFTER_MS = 10 * 60 * 1000;

export const PRESENCE_STATUSES = [
  "online",
  "practicing",
  "reviewing",
  "taking exam",
  "learning",
  "viewing leaderboard",
] as const;

export type PresenceStatus = (typeof PRESENCE_STATUSES)[number];

export interface PresenceRouteState {
  status: PresenceStatus;
  currentArea: string;
}

export interface PublicPresenceRow {
  user_id: string;
  display_name: string;
  course: string | null;
  avatar_path: string | null;
  avatar_url: string | null;
  status: PresenceStatus;
  last_seen_at: string | null;
}

type PublicPresenceDatabaseRow = Omit<PublicPresenceRow, "avatar_url" | "status"> & {
  status: string | null;
};

export function isAllowedPresenceStatus(value: unknown): value is PresenceStatus {
  return typeof value === "string" && (PRESENCE_STATUSES as readonly string[]).includes(value);
}

export function mapPathToPresence(pathname: string): PresenceRouteState {
  const path = pathname.split("?")[0] || "/";

  if (path.startsWith("/practice")) return { status: "practicing", currentArea: "practice" };
  if (path.startsWith("/mistakes")) return { status: "reviewing", currentArea: "mistakes" };
  if (path.startsWith("/exam")) return { status: "taking exam", currentArea: "exam" };
  if (path.startsWith("/learn")) return { status: "learning", currentArea: "learn" };
  if (path.startsWith("/labs")) return { status: "learning", currentArea: "labs" };
  if (path.startsWith("/leaderboard")) {
    return { status: "viewing leaderboard", currentArea: "leaderboard" };
  }
  return { status: "online", currentArea: "app" };
}

export function formatPresenceFreshness(value: string | null | undefined, now = new Date()) {
  if (!value) return "recently";

  const seenAt = new Date(value).getTime();
  if (Number.isNaN(seenAt)) return "recently";

  const elapsedMs = Math.max(0, now.getTime() - seenAt);
  if (elapsedMs < 2 * 60 * 1000) return "now";

  return `${Math.round(elapsedMs / 60_000)}m ago`;
}

export function shapePublicPresenceRows(
  rows: PublicPresenceDatabaseRow[],
  supabaseUrl = getSupabaseConfig()?.url,
): PublicPresenceRow[] {
  return rows.map((row) => ({
    user_id: row.user_id,
    display_name: row.display_name?.trim() || "Database learner",
    course: row.course,
    avatar_path: row.avatar_path,
    avatar_url: getAvatarPublicUrl(row.avatar_path, supabaseUrl),
    status: isAllowedPresenceStatus(row.status) ? row.status : "online",
    last_seen_at: row.last_seen_at,
  }));
}

export async function getPublicPresence(limit = 12): Promise<PublicPresenceRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc("get_public_presence", {
    p_limit: limit,
  });

  if (error) throw new Error(error.message);

  return shapePublicPresenceRows((data ?? []) as PublicPresenceDatabaseRow[]);
}
