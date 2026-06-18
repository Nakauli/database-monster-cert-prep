import type { ExamResult, ProgressData } from "@/lib/types";

export interface ReadinessSummary {
  score: number; // 0-100
  verdict: string;
  blurb: string;
  attempts: number;
  mastery: { topic: string; percentage: number }[];
}

/**
 * Derive an "exam-readiness" reading from local progress. Blends the recent
 * attempt average with a small penalty for unresolved mistakes, and surfaces
 * the weakest topics from the most recent result.
 */
export function computeReadiness(
  progress: ProgressData,
  lastResult: ExamResult | null,
): ReadinessSummary {
  const recent = progress.attempts.slice(0, 5);
  const attempts = progress.attempts.length;

  if (recent.length === 0) {
    return {
      score: 0,
      verdict: "Not calibrated",
      blurb: "Take the diagnostic exam to generate your readiness reading.",
      attempts: 0,
      mastery: [],
    };
  }

  const avg = recent.reduce((sum, attempt) => sum + attempt.score, 0) / recent.length;
  const outstanding = progress.mistakes.reduce((sum, m) => sum + m.misses, 0);
  const penalty = Math.min(12, outstanding * 0.4);
  const score = Math.max(0, Math.min(100, Math.round(avg - penalty)));

  const verdict =
    score >= 85 ? "Exam-ready" : score >= 70 ? "Almost there" : score >= 50 ? "Keep drilling" : "Foundations first";
  const blurb =
    score >= 85
      ? "You're consistently above the passing line. Keep your timing sharp."
      : score >= 70
        ? "Close to the line — clear your weak topics to lock it in."
        : score >= 50
          ? "Solid base. Focus your reps on the lowest-scoring topics below."
          : "Build fundamentals topic by topic before the next full exam.";

  const mastery = lastResult
    ? Object.entries(lastResult.topicStats)
        .map(([topic, stat]) => ({ topic, percentage: stat.percentage }))
        .sort((a, b) => a.percentage - b.percentage)
        .slice(0, 5)
    : [];

  return { score, verdict, blurb, attempts, mastery };
}
