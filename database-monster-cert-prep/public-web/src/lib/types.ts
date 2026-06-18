export type Difficulty = "easy" | "medium" | "hard" | "final boss";
export type QuestionType = "single-choice" | "multiple-answer";

export interface SchemaColumn {
  name: string;
  type: string;
  key?: string;
  nullable?: boolean;
}

export interface SchemaTable {
  table: string;
  columns: SchemaColumn[];
}

export interface DataTable {
  label?: string;
  table?: string;
  columns: string[];
  rows: Array<Array<string | number | null>>;
}

export interface Question {
  id: string;
  legacyId?: string;
  topic: string;
  difficulty: Difficulty;
  type: QuestionType;
  question: string;
  scenario?: string;
  schema?: SchemaTable[];
  sampleData?: DataTable[];
  code?: string;
  codeLabel?: string;
  outputTable?: DataTable;
  choices: string[];
  correctAnswers: string[];
  explanation: string;
  wrongAnswerExplanations: Record<string, string>;
  relatedConcept?: string;
  reviewFile?: string;
}

export interface ExamQuestion extends Question {
  choices: string[];
}

export interface TopicStat {
  correct: number;
  total: number;
  percentage: number;
}

export interface AnswerReview {
  question: Question;
  selectedAnswers: string[];
  correct: boolean;
}

export interface ExamResult {
  id: string;
  mode: string;
  title: string;
  completedAt: string;
  durationSeconds: number;
  score: number;
  correct: number;
  total: number;
  topicStats: Record<string, TopicStat>;
  reviews: AnswerReview[];
}

export interface StoredMistake {
  questionId: string;
  topic: string;
  question: string;
  selectedAnswers: string[];
  correctAnswers: string[];
  explanation: string;
  wrongAnswerExplanations: Record<string, string>;
  reviewFile?: string;
  misses: number;
  lastMissedAt: string;
}

export interface ProgressData {
  attempts: Array<{
    id: string;
    mode: string;
    title: string;
    score: number;
    completedAt: string;
  }>;
  mistakes: StoredMistake[];
}

