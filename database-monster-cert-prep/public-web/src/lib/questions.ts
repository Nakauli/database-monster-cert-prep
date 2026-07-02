import examPackData from "@/data/exam-packs.json";
import questionData from "@/data/exam-whiteboard.json";
import type { Difficulty, ExamQuestion, Question } from "@/lib/types";

type RawQuestion = Omit<Question, "wrongAnswerExplanations"> & {
  wrongAnswerExplanations?: Record<string, string>;
};

export const fixedExamPacks = {
  "old-exam-mastery": {
    label: "Old Exam Mastery",
    description: "Priority Certiport-style old-exam practice set.",
  },
  "post-test-2026-07-02": {
    label: "Post-Test 2026-07-02",
    description: "Today's post-test practice set.",
  },
} as const;

export type FixedExamMode = keyof typeof fixedExamPacks;

function withWrongAnswerExplanations(question: RawQuestion): Question {
  if (question.wrongAnswerExplanations) return question as Question;
  return {
    ...question,
    wrongAnswerExplanations: Object.fromEntries(
      question.choices
        .filter((choice) => !question.correctAnswers.includes(choice))
        .map((choice) => [choice, "This option does not satisfy all requirements in the prompt."]),
    ),
  };
}

export function isFixedExamMode(mode: string): mode is FixedExamMode {
  return mode in fixedExamPacks;
}

export function examModeLabel(mode: string): string {
  if (isFixedExamMode(mode)) return fixedExamPacks[mode].label;
  return mode.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export const questions = [
  ...(questionData as unknown as RawQuestion[]),
  ...(examPackData as unknown as RawQuestion[]),
].map(withWrongAnswerExplanations);
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

  if (isFixedExamMode(mode)) {
    pool = pool.filter((question) => question.examPack === mode);
    const count = requestedCount ?? pool.length;
    return pool
      .slice(0, Math.min(count, pool.length))
      .map((question) => ({ ...question, choices: [...question.choices] }));
  }

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
  if (isFixedExamMode(mode)) return fixedExamPacks[mode].label;
  if (mode === "diagnostic") return "Diagnostic Exam";
  if (mode === "final") return "Final Boss Exam";
  if (mode === "panic") return "Panic Review";
  if (mode === "mistakes") return "Mistake Repair";
  if (mode === "practice") return topic ? `${topic} Practice` : "Topic Practice";
  return "Timed Certification-Style Exam";
}

export function examDuration(mode: string): number | null {
  if (mode === "practice" || mode === "mistakes") return null;
  if (mode === "panic") return 10 * 60;
  return 50 * 60;
}
