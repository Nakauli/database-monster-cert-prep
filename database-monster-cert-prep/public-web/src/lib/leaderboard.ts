import { normalizeCourse } from "@/lib/courses";
import { getAvatarPublicUrl } from "@/lib/avatar";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface PublicLeaderboardRow {
  user_id: string;
  display_name: string;
  course: string | null;
  avatar_path: string | null;
  avatar_url: string | null;
  rank: number;
  readiness_score: number;
  best_score: number;
  attempt_count: number;
  average_mastery: number;
  last_active_at: string | null;
  strongest_topics: string[];
  weakest_topics: string[];
}

export function formatPercent(value: number | null | undefined) {
  return `${Math.round(Number(value ?? 0))}%`;
}

export function formatLastActive(value: string | null | undefined) {
  if (!value) return "No activity yet";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function withAvatarUrls(rows: Omit<PublicLeaderboardRow, "avatar_url">[]): PublicLeaderboardRow[] {
  const supabaseUrl = getSupabaseConfig()?.url;
  return rows.map((row) => ({
    ...row,
    avatar_url: getAvatarPublicUrl(row.avatar_path, supabaseUrl),
  }));
}

export async function getPublicLeaderboard(course?: string | null, limit?: number): Promise<PublicLeaderboardRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc("get_public_leaderboard", {
    p_course: normalizeCourse(course),
  });
  if (error) throw new Error(error.message);

  const rows = withAvatarUrls((data ?? []) as Omit<PublicLeaderboardRow, "avatar_url">[]);
  return typeof limit === "number" ? rows.slice(0, limit) : rows;
}

export async function getPublicStudentProfile(userId: string): Promise<PublicLeaderboardRow | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("get_public_student_profile", {
    p_user_id: userId,
  });
  if (error) throw new Error(error.message);

  const rows = withAvatarUrls((data ?? []) as Omit<PublicLeaderboardRow, "avatar_url">[]);
  return rows[0] ?? null;
}
