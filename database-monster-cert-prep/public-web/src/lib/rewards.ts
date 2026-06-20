export type AchievementTone = "green" | "amber" | "blue" | "slate";

export interface RewardSignals {
  currentStreak: number;
  longestStreak: number;
  bestScore: number;
  attemptCount: number;
  averageMastery: number;
  finalBossCount: number;
  mistakeCount: number;
  dueCount: number;
  weekAttemptCount: number;
  weekQuestionCount: number;
}

export interface Achievement {
  id: string;
  label: string;
  description: string;
  tone: AchievementTone;
}

export interface NextAchievement {
  achievement: Achievement;
  current: number;
  target: number;
  percent: number;
}

export interface WeeklyChallengeWindow {
  startsAt: string;
  endsAt: string;
  label: string;
}

const DAY_MS = 86_400_000;

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "hot_streak",
    label: "Hot Streak",
    description: "Study on 3 days in a row.",
    tone: "green",
  },
  {
    id: "locked_in",
    label: "Locked In",
    description: "Keep a 7-day study streak.",
    tone: "green",
  },
  {
    id: "exam_ready",
    label: "Exam Ready",
    description: "Score at least 80% on a public exam mode.",
    tone: "blue",
  },
  {
    id: "final_boss",
    label: "Final Boss",
    description: "Complete one Final Boss attempt.",
    tone: "amber",
  },
  {
    id: "repair_mode",
    label: "Repair Mode",
    description: "Track mistakes or due review cards.",
    tone: "slate",
  },
  {
    id: "topic_climber",
    label: "Topic Climber",
    description: "Reach 75% average topic mastery.",
    tone: "blue",
  },
];

const achievementById = new Map(ACHIEVEMENTS.map((achievement) => [achievement.id, achievement]));

function clampPercent(current: number, target: number): number {
  if (target <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
}

function numeric(value: number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function achievementForId(id: string): Achievement | null {
  return achievementById.get(id) ?? null;
}

export function getEarnedAchievementIds(signals: RewardSignals): string[] {
  const currentStreak = numeric(signals.currentStreak);
  const bestScore = numeric(signals.bestScore);
  const averageMastery = numeric(signals.averageMastery);
  const finalBossCount = numeric(signals.finalBossCount);
  const mistakeCount = numeric(signals.mistakeCount);
  const dueCount = numeric(signals.dueCount);
  const earned: string[] = [];

  if (currentStreak >= 3) earned.push("hot_streak");
  if (currentStreak >= 7) earned.push("locked_in");
  if (bestScore >= 80) earned.push("exam_ready");
  if (finalBossCount >= 1) earned.push("final_boss");
  if (mistakeCount > 0 || dueCount > 0) earned.push("repair_mode");
  if (averageMastery >= 75) earned.push("topic_climber");

  return earned;
}

export function getEarnedAchievements(signals: RewardSignals): Achievement[] {
  return getEarnedAchievementIds(signals).flatMap((id) => {
    const achievement = achievementForId(id);
    return achievement ? [achievement] : [];
  });
}

export function getNextAchievement(signals: RewardSignals): NextAchievement | null {
  const earned = new Set(getEarnedAchievementIds(signals));
  const candidates: Array<{ id: string; current: number; target: number }> = [
    { id: "hot_streak", current: numeric(signals.currentStreak), target: 3 },
    { id: "locked_in", current: numeric(signals.currentStreak), target: 7 },
    { id: "exam_ready", current: numeric(signals.bestScore), target: 80 },
    { id: "final_boss", current: numeric(signals.finalBossCount), target: 1 },
    { id: "repair_mode", current: numeric(signals.mistakeCount) + numeric(signals.dueCount), target: 1 },
    { id: "topic_climber", current: numeric(signals.averageMastery), target: 75 },
  ];

  const next = candidates
    .filter((candidate) => !earned.has(candidate.id))
    .sort((left, right) =>
      clampPercent(right.current, right.target) - clampPercent(left.current, left.target) ||
      left.target - right.target,
    )[0];

  if (!next) return null;
  const achievement = achievementForId(next.id);
  if (!achievement) return null;

  return {
    achievement,
    current: Math.min(next.target, Math.max(0, Math.round(next.current))),
    target: next.target,
    percent: clampPercent(next.current, next.target),
  };
}

export function getWeeklyChallengeWindow(now = new Date()): WeeklyChallengeWindow {
  const day = now.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  const end = new Date(start.getTime() + 7 * DAY_MS);
  const formatter = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" });
  const lastIncludedDay = new Date(end.getTime() - DAY_MS);

  return {
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    label: `${formatter.format(start)}-${lastIncludedDay.getUTCDate()}`,
  };
}

export function computeWeeklyChallengeScore(input: {
  currentStreak: number;
  weekAttemptCount: number;
  weekQuestionCount: number;
}): number {
  const attemptScore = numeric(input.weekAttemptCount) * 20;
  const questionScore = numeric(input.weekQuestionCount) * 2;
  const streakScore = Math.min(7, numeric(input.currentStreak)) * 5;
  return Math.round(attemptScore + questionScore + streakScore);
}
