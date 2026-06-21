import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { extremeQuestionPack } from "./extreme-question-pack.mjs";

const questions = JSON.parse(await readFile(resolve("src/data/questions.json"), "utf8"));
const sqlQuestionsSource = await readFile(resolve("src/data/sql-questions.ts"), "utf8");
const labsSource = await readFile(resolve("src/data/labs.ts"), "utf8");
const learnTopicsSource = await readFile(resolve("src/data/learn-topics.ts"), "utf8");
const required = [
  "id", "legacyId", "topic", "difficulty", "type", "question", "choices",
  "correctAnswers", "explanation", "wrongAnswerExplanations", "reviewFile",
];

const ids = new Set();
const legacyIds = new Set();
const normalizedPrompts = new Map();
const supplementalContextFields = ["schema", "sampleData", "code", "outputTable"];
const prohibitedText = [
  [/\b(companie|categorie|branche)\b/i, "misspelled entity name"],
  [/\bNone\b/, "Python None instead of SQL NULL"],
  [/\b1 rows\b/i, "incorrect singular row count"],
  [/\bowner_id\s*=\s*o\.id\b/i, "placeholder anti-join keys"],
  [/\bsub-select returns more than 1 row\b/i, "non-specific scalar-subquery error text"],
];

const sameMembers = (left, right) =>
  left.length === right.length &&
  [...left].sort().every((value, index) => value === [...right].sort()[index]);

for (const question of questions) {
  for (const field of required) {
    if (!(field in question) || question[field] === "") {
      throw new Error(`${question.id ?? "unknown"} is missing ${field}`);
    }
  }
  if (ids.has(question.id)) throw new Error(`Duplicate ID: ${question.id}`);
  ids.add(question.id);
  if (legacyIds.has(question.legacyId)) throw new Error(`Duplicate legacy ID: ${question.legacyId}`);
  legacyIds.add(question.legacyId);
  if (!Array.isArray(question.choices) || question.choices.length < 2) {
    throw new Error(`${question.id} needs choices`);
  }
  if (new Set(question.choices).size !== question.choices.length) {
    throw new Error(`${question.id} has duplicate choices`);
  }
  if (!Array.isArray(question.correctAnswers) || !question.correctAnswers.every((answer) => question.choices.includes(answer))) {
    throw new Error(`${question.id} has an invalid correct answer`);
  }
  if (new Set(question.correctAnswers).size !== question.correctAnswers.length) {
    throw new Error(`${question.id} repeats a correct answer`);
  }
  const incorrectChoices = question.choices.filter(
    (choice) => !question.correctAnswers.includes(choice),
  );
  if (!sameMembers(incorrectChoices, Object.keys(question.wrongAnswerExplanations))) {
    throw new Error(`${question.id} wrong-answer explanations do not match its incorrect choices`);
  }
  if (supplementalContextFields.some((field) => field in question)) {
    throw new Error(`${question.id} contains supplemental context that has not been question-specifically verified`);
  }

  const normalizedPrompt = question.question.trim().toLowerCase();
  if (normalizedPrompts.has(normalizedPrompt)) {
    throw new Error(
      `${question.id} duplicates the prompt from ${normalizedPrompts.get(normalizedPrompt)}`,
    );
  }
  normalizedPrompts.set(normalizedPrompt, question.id);

  const searchableText = [
    question.question,
    ...question.choices,
    question.explanation,
    ...Object.values(question.wrongAnswerExplanations),
  ].join(" ");
  for (const [pattern, description] of prohibitedText) {
    if (pattern.test(searchableText)) {
      throw new Error(`${question.id} contains ${description}`);
    }
  }

  const crossJoin = question.question.match(
    /Table A has (\d+) rows? and table B has (\d+) rows?\./,
  );
  if (crossJoin) {
    const expected = String(Number(crossJoin[1]) * Number(crossJoin[2]));
    if (!question.correctAnswers.includes(expected)) {
      throw new Error(`${question.id} has an incorrect CROSS JOIN row count`);
    }
  }

  const countValues = question.question.match(
    /A group contains `\[([^\]]+)\]` in column `amount`/,
  );
  if (countValues) {
    const values = countValues[1].split(",").map((value) => value.trim());
    const nonNullValues = values.filter((value) => value !== "NULL");
    const expected = `${values.length} and ${nonNullValues.length}`;
    if (!question.correctAnswers.includes(expected)) {
      throw new Error(`${question.id} has incorrect COUNT results; expected ${expected}`);
    }
  }

  const between = question.question.match(
    /numeric value (-?\d+), `value BETWEEN (-?\d+) AND (-?\d+)` evaluates TRUE/,
  );
  if (between) {
    const [, rawValue, rawLower, rawUpper] = between;
    const value = Number(rawValue);
    const expected = value >= Number(rawLower) && value <= Number(rawUpper)
      ? "True"
      : "False";
    if (!question.correctAnswers.includes(expected)) {
      throw new Error(`${question.id} has an incorrect BETWEEN result; expected ${expected}`);
    }
  }
}

const count = (predicate) => questions.filter(predicate).length;
const metrics = {
  questions: questions.length,
  topics: new Set(questions.map((question) => question.topic)).size,
  inlineCode: count((question) => /`[^`]+`/.test([question.question, ...question.choices].join(" "))),
  multipleAnswer: count((question) => question.type === "multiple-answer"),
  triggersAndProcedures: count((question) => question.topic === "Triggers & Procedures"),
  normalization: count((question) => question.topic === "Normalization"),
  security: count((question) => question.topic === "Security & Admin"),
};

const minimums = {
  questions: 410,
  topics: 12,
  inlineCode: 200,
  multipleAnswer: 20,
  triggersAndProcedures: 10,
  normalization: 10,
  security: 10,
};

for (const [name, minimum] of Object.entries(minimums)) {
  if (metrics[name] < minimum) throw new Error(`${name}: expected at least ${minimum}, found ${metrics[name]}`);
}

const topicCounts = new Map();
for (const question of questions) {
  topicCounts.set(question.topic, (topicCounts.get(question.topic) ?? 0) + 1);
}
for (const [topic, topicQuestionCount] of topicCounts) {
  if (topicQuestionCount < 30) {
    throw new Error(`${topic}: expected at least 30 questions, found ${topicQuestionCount}`);
  }
}

if (extremeQuestionPack.length < 50) {
  throw new Error(`Extreme question pack: expected at least 50 questions, found ${extremeQuestionPack.length}`);
}

const extremeIds = new Set();
const extremePrompts = new Set();
for (const question of extremeQuestionPack) {
  const normalizedPrompt = question.question.trim().toLowerCase();
  if (extremeIds.has(question.id)) {
    throw new Error(`Extreme question pack has duplicate ID: ${question.id}`);
  }
  if (extremePrompts.has(normalizedPrompt)) {
    throw new Error(`Extreme question pack repeats this prompt: ${question.question}`);
  }
  extremeIds.add(question.id);
  extremePrompts.add(normalizedPrompt);
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
