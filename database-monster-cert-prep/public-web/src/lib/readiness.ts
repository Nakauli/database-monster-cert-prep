import type { ExamResult, ProgressData } from "@/lib/types";

export interface ReadinessSummary {
  score: number;
  verdict: string;
  blurb: string;
  attempts: number;
  mastery: { topic: string; percentage: number }[];
}

export function computeReadiness(progress: ProgressData, lastResult: ExamResult | null): ReadinessSummary {
  const recent = progress.attempts.slice(0, 5);

  if (recent.length === 0) {
    return {
      score: 0,
      verdict: "Not calibrated",
      blurb: "Take the diagnostic exam to generate your readiness reading.",
      attempts: 0,
      mastery: [],
    };
  }

  const average = recent.reduce((sum, attempt) => sum + attempt.score, 0) / recent.length;
  const unresolvedMisses = progress.mistakes.reduce((sum, mistake) => sum + mistake.misses, 0);
  const score = Math.max(0, Math.min(100, Math.round(average - Math.min(12, unresolvedMisses * 0.4))));
  const verdict =
    score >= 85 ? "Exam-ready" : score >= 70 ? "Almost there" : score >= 50 ? "Keep drilling" : "Foundations first";
  const blurb =
    score >= 85
      ? "You are consistently above the passing line. Keep your timing sharp."
      : score >= 70
        ? "Close to the line. Clear your weak topics to lock it in."
        : score >= 50
          ? "Solid base. Focus your reps on the lowest-scoring topics below."
          : "Build fundamentals topic by topic before the next full exam.";
  const mastery = lastResult
    ? Object.entries(lastResult.topicStats)
        .map(([topic, stat]) => ({ topic, percentage: stat.percentage }))
        .sort((a, b) => a.percentage - b.percentage)
        .slice(0, 5)
    : [];

  return { score, verdict, blurb, attempts: progress.attempts.length, mastery };
}
