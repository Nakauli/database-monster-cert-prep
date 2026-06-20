import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(here, "../../data/question_bank.json");
const targetPath = resolve(here, "../src/data/questions.json");

const topicNames = {
  "Core Concepts": "Database Concepts",
  "Database Design and ERD": "ERD & Design",
  Normalization: "Normalization",
  "SQL Fundamentals": "SQL",
  "Joins and Relationships": "Joins",
  "Aggregation and Grouping": "Aggregation",
  "Subqueries, Views, and Set Operations": "Advanced Queries",
  "DDL, Constraints, and Indexes": "Constraints & Indexes",
  "DML and Transactions": "Transactions",
  "Procedures, Functions, and Triggers": "Triggers & Procedures",
  "Security, Administration, and Backup": "Security & Admin",
  Troubleshooting: "Troubleshooting",
};

const typeNames = {
  multiple_choice: "single-choice",
  scenario: "single-choice",
  true_false: "single-choice",
  sql_output: "single-choice",
  multi_select: "multiple-answer",
};

const raw = JSON.parse(await readFile(sourcePath, "utf8"));
const counters = {};
const questions = raw.map((question) => {
  const topic = topicNames[question.topic] ?? question.topic;
  counters[topic] = (counters[topic] ?? 0) + 1;
  const answer = Array.isArray(question.correct_answer)
    ? question.correct_answer
    : [question.correct_answer];
  const slug = topic.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return {
    id: `${slug}-${String(counters[topic]).padStart(3, "0")}`,
    legacyId: question.id,
    topic,
    difficulty: question.difficulty,
    type: typeNames[question.type] ?? "single-choice",
    question: question.question,
    choices: question.choices,
    correctAnswers: answer,
    explanation: question.explanation,
    wrongAnswerExplanations: question.why_wrong_answers,
    relatedConcept: question.related_concept,
    reviewFile: question.recommended_review?.[0],
  };
});

await mkdir(dirname(targetPath), { recursive: true });
await writeFile(targetPath, `${JSON.stringify(questions, null, 2)}\n`, "utf8");

const metrics = {
  questions: questions.length,
  code: questions.filter((q) => q.code).length,
  schema: questions.filter((q) => q.schema).length,
  scenarios: questions.filter((q) => q.scenario).length,
  proceduresAndTriggers: questions.filter((q) => q.topic === "Triggers & Procedures").length,
  normalization: questions.filter((q) => q.topic === "Normalization").length,
  security: questions.filter((q) => q.topic === "Security & Admin").length,
};
console.log(metrics);
