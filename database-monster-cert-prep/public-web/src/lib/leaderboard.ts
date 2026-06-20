import { normalizeCourse } from "@/lib/courses";
import { getAvatarPublicUrl } from "@/lib/avatar";
import { ACHIEVEMENTS, achievementForId, type Achievement } from "@/lib/rewards";
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
  achievements: string[];
  achievement_details: Achievement[];
  current_streak: number;
  longest_streak: number;
  final_boss_count: number;
  mistake_count: number;
  due_count: number;
  week_attempt_count: number;
  week_question_count: number;
  weekly_challenge_score: number;
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

export function normalizeAchievementIds(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const known = new Set(ACHIEVEMENTS.map((achievement) => achievement.id));
  const seen = new Set<string>();
  return values.flatMap((value) => {
    if (typeof value !== "string" || !known.has(value) || seen.has(value)) return [];
    seen.add(value);
    return [value];
  });
}

type PublicLeaderboardDatabaseRow = Omit<PublicLeaderboardRow, "avatar_url" | "achievement_details">;

function withAvatarUrls(rows: PublicLeaderboardDatabaseRow[]): PublicLeaderboardRow[] {
  const supabaseUrl = getSupabaseConfig()?.url;
  return rows.map((row) => ({
    ...row,
    achievements: normalizeAchievementIds(row.achievements),
    achievement_details: normalizeAchievementIds(row.achievements).flatMap((id) => {
      const achievement = achievementForId(id);
      return achievement ? [achievement] : [];
    }),
    avatar_url: getAvatarPublicUrl(row.avatar_path, supabaseUrl),
    current_streak: Number(row.current_streak ?? 0),
    longest_streak: Number(row.longest_streak ?? 0),
    final_boss_count: Number(row.final_boss_count ?? 0),
    mistake_count: Number(row.mistake_count ?? 0),
    due_count: Number(row.due_count ?? 0),
    week_attempt_count: Number(row.week_attempt_count ?? 0),
    week_question_count: Number(row.week_question_count ?? 0),
    weekly_challenge_score: Number(row.weekly_challenge_score ?? 0),
  }));
}

export async function getPublicLeaderboard(course?: string | null, limit?: number): Promise<PublicLeaderboardRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc("get_public_leaderboard", {
    p_course: normalizeCourse(course),
  });
  if (error) throw new Error(error.message);

  const rows = withAvatarUrls((data ?? []) as PublicLeaderboardDatabaseRow[]);
  return typeof limit === "number" ? rows.slice(0, limit) : rows;
}

export async function getPublicStudentProfile(userId: string): Promise<PublicLeaderboardRow | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("get_public_student_profile", {
    p_user_id: userId,
  });
  if (error) throw new Error(error.message);

  const rows = withAvatarUrls((data ?? []) as PublicLeaderboardDatabaseRow[]);
  return rows[0] ?? null;
}
