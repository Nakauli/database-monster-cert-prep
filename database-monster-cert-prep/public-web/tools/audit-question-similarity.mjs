import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const questions = JSON.parse(
  await readFile(resolve("src/data/questions.json"), "utf8"),
);

const stopWords = new Set([
  "about", "after", "again", "also", "among", "because", "before", "being",
  "best", "between", "does", "each", "from", "have", "into", "most", "must",
  "only", "other", "should", "than", "that", "their", "then", "there", "these",
  "they", "this", "through", "uses", "using", "what", "when", "where", "which",
  "while", "with", "would", "your",
]);

function tokens(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter((token) => token.length > 2 && !stopWords.has(token)),
  );
}

function jaccard(left, right) {
  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }
  return intersection / (left.size + right.size - intersection);
}

function signature(question) {
  return [
    question.question,
    ...question.correctAnswers,
    question.relatedConcept ?? "",
  ].join(" ");
}

const extreme = questions.filter((question) => question.legacyId.startsWith("XQ"));
const core = questions.filter((question) => !question.legacyId.startsWith("XQ"));
const matches = [];

for (let index = 0; index < extreme.length; index += 1) {
  const question = extreme[index];
  const candidates = [
    ...core,
    ...extreme.slice(0, index),
  ];
  const questionTokens = tokens(signature(question));

  for (const candidate of candidates) {
    const score = jaccard(questionTokens, tokens(signature(candidate)));
    if (score >= 0.2) {
      matches.push({
        score,
        question: question.legacyId,
        candidate: candidate.legacyId,
        questionText: question.question,
        candidateText: candidate.question,
      });
    }
  }
}

matches.sort((left, right) => right.score - left.score);

const blockingMatches = matches.filter((match) => match.score >= 0.72);
if (blockingMatches.length > 0) {
  console.error("Potential repeated questions", blockingMatches);
  process.exitCode = 1;
} else {
  console.log("Question similarity audit passed", {
    extremeQuestions: extreme.length,
    highestSimilarities: matches.slice(0, 12),
  });
}
