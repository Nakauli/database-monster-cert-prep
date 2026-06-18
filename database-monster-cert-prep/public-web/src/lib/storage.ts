"use client";

import type { ExamResult, ProgressData, StoredMistake } from "@/lib/types";

const PROGRESS_KEY = "database-monster-progress-v1";
const RESULT_KEY = "database-monster-last-result-v1";

const emptyProgress: ProgressData = { attempts: [], mistakes: [] };

function available(): boolean {
  return typeof window !== "undefined";
}

export function getProgress(): ProgressData {
  if (!available()) return emptyProgress;
  try {
    const parsed = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "");
    return parsed && Array.isArray(parsed.attempts) && Array.isArray(parsed.mistakes) ? parsed : emptyProgress;
  } catch {
    return emptyProgress;
  }
}

export function saveResult(result: ExamResult): void {
  if (!available()) return;
  localStorage.setItem(RESULT_KEY, JSON.stringify(result));
  const progress = getProgress();
  progress.attempts = [
    {
      id: result.id,
      mode: result.mode,
      title: result.title,
      score: result.score,
      completedAt: result.completedAt,
    },
    ...progress.attempts,
  ].slice(0, 50);

  const mistakes = new Map(progress.mistakes.map((mistake) => [mistake.questionId, mistake]));
  for (const review of result.reviews.filter((item) => !item.correct)) {
    const existing = mistakes.get(review.question.id);
    const updated: StoredMistake = {
      questionId: review.question.id,
      topic: review.question.topic,
      question: review.question.question,
      selectedAnswers: review.selectedAnswers,
      correctAnswers: review.question.correctAnswers,
      explanation: review.question.explanation,
      wrongAnswerExplanations: review.question.wrongAnswerExplanations,
      reviewFile: review.question.reviewFile,
      misses: (existing?.misses ?? 0) + 1,
      lastMissedAt: result.completedAt,
    };
    mistakes.set(review.question.id, updated);
  }
  progress.mistakes = [...mistakes.values()].sort((a, b) => b.misses - a.misses);
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function getLastResult(): ExamResult | null {
  if (!available()) return null;
  try {
    return JSON.parse(localStorage.getItem(RESULT_KEY) ?? "null");
  } catch {
    return null;
  }
}

export function resetProgress(): void {
  if (!available()) return;
  localStorage.removeItem(PROGRESS_KEY);
  localStorage.removeItem(RESULT_KEY);
}

