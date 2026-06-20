export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // YYYY-MM-DD (UTC)
}

const DAY_MS = 86_400_000;

export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function isPreviousDay(last: string, today: string): boolean {
  const diff = Date.parse(`${today}T00:00:00.000Z`) - Date.parse(`${last}T00:00:00.000Z`);
  return diff === DAY_MS;
}

export function applyActivity(state: StreakState, today: string): StreakState {
  if (state.lastActiveDate === today) {
    return state;
  }
  const currentStreak =
    state.lastActiveDate && isPreviousDay(state.lastActiveDate, today) ? state.currentStreak + 1 : 1;
  return {
    currentStreak,
    longestStreak: Math.max(state.longestStreak, currentStreak),
    lastActiveDate: today,
  };
}
