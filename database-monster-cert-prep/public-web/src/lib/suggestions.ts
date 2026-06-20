export const SUGGESTION_CATEGORIES = ["Feature", "Question", "Content", "Bug", "UI"] as const;
export const SUGGESTION_STATUSES = ["Open", "Planned", "Done", "Declined"] as const;

export type SuggestionCategory = (typeof SUGGESTION_CATEGORIES)[number];
export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];

export interface PublicSuggestionRow {
  id: string;
  title: string;
  details: string;
  category: SuggestionCategory;
  status: SuggestionStatus;
  vote_count: number;
  has_voted: boolean;
  author_display_name: string;
  author_course: string | null;
  created_at: string;
  updated_at: string;
}

export function normalizeSuggestionCategory(value: string | null | undefined): SuggestionCategory | null {
  const normalized = value?.trim().toLowerCase();

  return SUGGESTION_CATEGORIES.find((category) => category.toLowerCase() === normalized) ?? null;
}

export function normalizeSuggestionStatus(value: string | null | undefined): SuggestionStatus | null {
  const normalized = value?.trim().toLowerCase();

  return SUGGESTION_STATUSES.find((status) => status.toLowerCase() === normalized) ?? null;
}

export function formatVoteCount(count: number | null | undefined) {
  const safeCount = Math.max(0, Math.trunc(Number(count ?? 0)));

  return `${safeCount} vote${safeCount === 1 ? "" : "s"}`;
}

export function formatSuggestionDate(value: string | null | undefined) {
  if (!value) return "Just now";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function statusTone(status: SuggestionStatus) {
  if (status === "Done") return "success";
  if (status === "Planned") return "warning";
  if (status === "Declined") return "destructive";

  return "secondary";
}
