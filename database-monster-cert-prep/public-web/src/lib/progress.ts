import { createClient } from "@/lib/supabase/server";
import { examModeLabel, questions } from "@/lib/questions";
import { getWeeklyChallengeWindow } from "@/lib/rewards";
import type { ExamResult, TopicStat } from "@/lib/types";

export interface ExamAttemptRow {
  id: string;
  exam_mode: string;
  score: number;
  total_questions: number;
  correct_count: number;
  time_spent_seconds: number | null;
  topic_breakdown: Record<string, TopicStat>;
  created_at: string;
}

export interface TopicProgressRow {
  id: string;
  topic: string;
  attempted_count: number;
  correct_count: number;
  mastery_score: number;
  last_practiced_at: string | null;
}

export interface MistakeRow {
  id: string;
  question_id: string;
  topic: string;
  difficulty: string | null;
  question_snapshot: Record<string, unknown>;
  selected_answers: string[];
  correct_answers: string[];
  explanation: string | null;
  mistake_count: number;
  last_mistaken_at: string;
  next_review_at: string;
  interval_days: number;
  ease: number;
  reps: number;
  last_reviewed_at: string | null;
}

export interface ProfileRow {
  id: string;
  display_name: string;
  school: string | null;
  course: string | null;
  avatar_path: string | null;
  leaderboard_opt_in: boolean;
  presence_opt_in: boolean;
  review_reminders_opt_in: boolean;
  review_reminders_last_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserStreakRow {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  daily_goal: number;
}

export async function getDashboardData(userId: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const weekWindow = getWeeklyChallengeWindow();

  const [
    attemptsResult,
    topicsResult,
    mistakesResult,
    profileResult,
    dueResult,
    streakResult,
    finalBossResult,
    weekAttemptResult,
    weekQuestionResult,
  ] =
    await Promise.all([
      supabase
        .from("exam_attempts")
        .select("id, exam_mode, score, total_questions, correct_count, time_spent_seconds, topic_breakdown, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("user_topic_progress")
        .select("id, topic, attempted_count, correct_count, mastery_score, last_practiced_at")
        .eq("user_id", userId)
        .order("mastery_score", { ascending: true }),
      supabase
        .from("mistake_notebook")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("profiles")
        .select("id, display_name, school, course, avatar_path, leaderboard_opt_in, presence_opt_in, review_reminders_opt_in, review_reminders_last_sent_at, created_at, updated_at")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("mistake_notebook")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .lte("next_review_at", new Date().toISOString()),
      supabase
        .from("user_streaks")
        .select("current_streak, longest_streak, last_active_date, daily_goal")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("exam_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("exam_mode", "final_boss"),
      supabase
        .from("exam_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", weekWindow.startsAt),
      supabase
        .from("question_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", weekWindow.startsAt),
    ]);

  if (attemptsResult.error) throw new Error(attemptsResult.error.message);
  if (topicsResult.error) throw new Error(topicsResult.error.message);
  if (mistakesResult.error) throw new Error(mistakesResult.error.message);
  if (profileResult.error) throw new Error(profileResult.error.message);
  if (dueResult.error) throw new Error(dueResult.error.message);
  if (streakResult.error) throw new Error(streakResult.error.message);
  if (finalBossResult.error) throw new Error(finalBossResult.error.message);
  if (weekAttemptResult.error) throw new Error(weekAttemptResult.error.message);
  if (weekQuestionResult.error) throw new Error(weekQuestionResult.error.message);

  return {
    attempts: (attemptsResult.data ?? []) as ExamAttemptRow[],
    topics: (topicsResult.data ?? []) as TopicProgressRow[],
    mistakeCount: mistakesResult.count ?? 0,
    profile: profileResult.data as ProfileRow | null,
    dueCount: dueResult.count ?? 0,
    finalBossCount: finalBossResult.count ?? 0,
    weekAttemptCount: weekAttemptResult.count ?? 0,
    weekQuestionCount: weekQuestionResult.count ?? 0,
    streak: (streakResult.data as UserStreakRow | null) ?? {
      current_streak: 0,
      longest_streak: 0,
      last_active_date: null,
      daily_goal: 10,
    },
  };
}

export async function getMistakes(userId: string): Promise<MistakeRow[]> {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("mistake_notebook")
    .select("id, question_id, topic, difficulty, question_snapshot, selected_answers, correct_answers, explanation, mistake_count, last_mistaken_at, next_review_at, interval_days, ease, reps, last_reviewed_at")
    .eq("user_id", userId)
    .order("mistake_count", { ascending: false })
    .order("last_mistaken_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MistakeRow[];
}

export async function getExamHistory(userId: string): Promise<ExamAttemptRow[]> {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("exam_attempts")
    .select("id, exam_mode, score, total_questions, correct_count, time_spent_seconds, topic_breakdown, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ExamAttemptRow[];
}

export async function getAttemptResult(userId: string, attemptId: string): Promise<ExamResult | null> {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const [attemptResult, questionsResult] = await Promise.all([
    supabase
      .from("exam_attempts")
      .select("id, exam_mode, score, total_questions, correct_count, time_spent_seconds, topic_breakdown, created_at")
      .eq("user_id", userId)
      .eq("id", attemptId)
      .maybeSingle(),
    supabase
      .from("question_attempts")
      .select("question_id, selected_answers, correct_answers, is_correct")
      .eq("user_id", userId)
      .eq("exam_attempt_id", attemptId)
      .order("created_at", { ascending: true }),
  ]);

  if (attemptResult.error) throw new Error(attemptResult.error.message);
  if (questionsResult.error) throw new Error(questionsResult.error.message);
  if (!attemptResult.data) return null;

  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const reviews = (questionsResult.data ?? []).flatMap((row) => {
    const question = questionMap.get(row.question_id);
    if (!question) return [];
    return [{
      question,
      selectedAnswers: (row.selected_answers ?? []) as string[],
      correct: Boolean(row.is_correct),
    }];
  });
  const attempt = attemptResult.data as ExamAttemptRow;

  return {
    id: attempt.id,
    mode: attempt.exam_mode,
    title: examModeLabel(attempt.exam_mode),
    completedAt: attempt.created_at,
    durationSeconds: attempt.time_spent_seconds ?? 0,
    score: Number(attempt.score),
    correct: attempt.correct_count,
    total: attempt.total_questions,
    topicStats: attempt.topic_breakdown ?? {},
    reviews,
  };
}

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, school, course, avatar_path, leaderboard_opt_in, presence_opt_in, review_reminders_opt_in, review_reminders_last_sent_at, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as ProfileRow | null;
}
