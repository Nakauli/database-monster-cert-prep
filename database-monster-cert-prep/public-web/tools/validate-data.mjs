import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const questions = JSON.parse(await readFile(resolve("src/data/questions.json"), "utf8"));
const required = [
  "id", "topic", "difficulty", "type", "question", "choices",
  "correctAnswers", "explanation", "wrongAnswerExplanations", "reviewFile",
];

const ids = new Set();
for (const question of questions) {
  for (const field of required) {
    if (!(field in question) || question[field] === "") {
      throw new Error(`${question.id ?? "unknown"} is missing ${field}`);
    }
  }
  if (ids.has(question.id)) throw new Error(`Duplicate ID: ${question.id}`);
  ids.add(question.id);
  if (!Array.isArray(question.choices) || question.choices.length < 2) {
    throw new Error(`${question.id} needs choices`);
  }
  if (!Array.isArray(question.correctAnswers) || !question.correctAnswers.every((answer) => question.choices.includes(answer))) {
    throw new Error(`${question.id} has an invalid correct answer`);
  }
}

const count = (predicate) => questions.filter(predicate).length;
const metrics = {
  questions: questions.length,
  sqlOrCode: count((question) => Boolean(question.code)),
  schema: count((question) => Boolean(question.schema)),
  scenarios: count((question) => Boolean(question.scenario)),
  triggersAndProcedures: count((question) => question.topic === "Triggers & Procedures"),
  normalization: count((question) => question.topic === "Normalization"),
  security: count((question) => question.topic === "Security & Admin"),
};

const minimums = {
  questions: 150,
  sqlOrCode: 30,
  schema: 20,
  scenarios: 15,
  triggersAndProcedures: 10,
  normalization: 10,
  security: 10,
};

for (const [name, minimum] of Object.entries(minimums)) {
  if (metrics[name] < minimum) throw new Error(`${name}: expected at least ${minimum}, found ${metrics[name]}`);
}

console.log("Question data valid", metrics);

