import questionData from "@/data/questions.json";
import { sqlQuestions } from "@/data/sql-questions";
import type { Difficulty, ExamQuestion, Question } from "@/lib/types";

export const questions = [...(questionData as unknown as Question[]), ...sqlQuestions];
export const topics = [...new Set(questions.map((question) => question.topic))].sort();
export const difficulties: Difficulty[] = ["easy", "medium", "hard", "final boss"];

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

export function createExamQuestions(
  mode: string,
  topic?: string,
  difficulty?: string,
  requestedCount?: number,
): ExamQuestion[] {
  let pool = questions;

  if (topic) {
    pool = pool.filter((question) => question.topic === topic);
  }
  if (difficulty && difficulty !== "all") {
    pool = pool.filter((question) => question.difficulty === difficulty);
  }
  if (mode === "final") {
    pool = pool.filter((question) => ["hard", "final boss"].includes(question.difficulty));
  }

  const count =
    requestedCount ??
    (mode === "diagnostic" ? 40 : mode === "final" ? 45 : mode === "panic" ? 10 : mode === "practice" ? 15 : 40);

  return shuffle(pool)
    .slice(0, Math.min(count, pool.length))
    .map((question) => ({ ...question, choices: shuffle(question.choices) }));
}

export function examTitle(mode: string, topic?: string): string {
  if (mode === "diagnostic") return "Diagnostic Exam";
  if (mode === "final") return "Final Boss Exam";
  if (mode === "panic") return "Panic Review";
  if (mode === "practice") return topic ? `${topic} Practice` : "Topic Practice";
  return "Timed Certification-Style Exam";
}

export function examDuration(mode: string): number | null {
  if (mode === "practice") return null;
  if (mode === "panic") return 10 * 60;
  return 50 * 60;
}
