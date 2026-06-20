import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const questions = JSON.parse(await readFile(resolve("src/data/questions.json"), "utf8"));
const sqlQuestionsSource = await readFile(resolve("src/data/sql-questions.ts"), "utf8");
const labsSource = await readFile(resolve("src/data/labs.ts"), "utf8");
const learnTopicsSource = await readFile(resolve("src/data/learn-topics.ts"), "utf8");
const required = [
  "id", "topic", "difficulty", "type", "question", "choices",
  "correctAnswers", "explanation", "wrongAnswerExplanations", "reviewFile",
];

const ids = new Set();
const supplementalContextFields = ["schema", "sampleData", "code", "outputTable"];
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
  if (supplementalContextFields.some((field) => field in question)) {
    throw new Error(`${question.id} contains supplemental context that has not been question-specifically verified`);
  }
}

const count = (predicate) => questions.filter(predicate).length;
const metrics = {
  questions: questions.length,
  inlineCode: count((question) => /`[^`]+`/.test([question.question, ...question.choices].join(" "))),
  multipleAnswer: count((question) => question.type === "multiple-answer"),
  triggersAndProcedures: count((question) => question.topic === "Triggers & Procedures"),
  normalization: count((question) => question.topic === "Normalization"),
  security: count((question) => question.topic === "Security & Admin"),
};

const minimums = {
  questions: 360,
  inlineCode: 200,
  multipleAnswer: 20,
  triggersAndProcedures: 10,
  normalization: 10,
  security: 10,
};

for (const [name, minimum] of Object.entries(minimums)) {
  if (metrics[name] < minimum) throw new Error(`${name}: expected at least ${minimum}, found ${metrics[name]}`);
}

const sqlChallengeBlocks = sqlQuestionsSource.match(/\{\n\s+id: "sqlw-[\s\S]*?\n\s+\},/g) ?? [];
for (const block of sqlChallengeBlocks) {
  const id = block.match(/id: "([^"]+)"/)?.[1] ?? "unknown SQL challenge";
  if (!/schema:\s*schemaFor\(/.test(block)) {
    throw new Error(`${id} must expose schema for the runnable SQL workspace`);
  }
  if (/expectedSql:\s*"[\s\S]*?\/\*/.test(block)) {
    throw new Error(`${id} reference SQL must not contain starter placeholders`);
  }
}

for (const source of [sqlQuestionsSource, labsSource]) {
  for (const match of source.matchAll(/(?:expectedSql|answer):\s*"([^"]*)"/g)) {
    if (match[1].includes("/*")) {
      throw new Error("Reference SQL must not contain starter placeholder comments");
    }
  }
}

const learnTopicBlocks = learnTopicsSource
  .split(/\r?\n  \{\r?\n    title: /)
  .slice(1)
  .map((block) => `title: ${block.split(/\r?\n  \},/)[0]}`);

if (learnTopicBlocks.length !== 12) {
  throw new Error(`Learn topics: expected 12, found ${learnTopicBlocks.length}`);
}

const learnTopicSlugs = new Set();
for (const block of learnTopicBlocks) {
  const title = block.match(/title: "([^"]+)"/)?.[1] ?? "unknown learn topic";
  const topicSlug = block.match(/\r?\n    slug: "([^"]+)"/)?.[1];
  if (!topicSlug) throw new Error(`${title} learn topic is missing slug`);
  if (learnTopicSlugs.has(topicSlug)) throw new Error(`Duplicate learn topic slug: ${topicSlug}`);
  learnTopicSlugs.add(topicSlug);

  for (const field of ["summary", "reviewFile", "lessons"]) {
    if (!block.includes(`${field}:`)) {
      throw new Error(`${title} learn topic is missing ${field}`);
    }
  }

  const lessonSlugs = new Set();
  const lessonMatches = [...block.matchAll(/lesson\(\s*"[^"]+",\s*"([^"]+)"/g)];
  if (lessonMatches.length < 1) {
    throw new Error(`${title} learn topic needs at least one lesson`);
  }

  for (const match of lessonMatches) {
    const lessonSlug = match[1];
    if (lessonSlugs.has(lessonSlug)) {
      throw new Error(`${title} has duplicate lesson slug: ${lessonSlug}`);
    }
    lessonSlugs.add(lessonSlug);
  }
}

console.log("Question data valid", { ...metrics, learnTopics: learnTopicBlocks.length });
