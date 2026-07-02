import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const activeQuestions = JSON.parse(
  await readFile(resolve("src/data/exam-whiteboard.json"), "utf8"),
);
const examPackQuestions = JSON.parse(
  await readFile(resolve("src/data/exam-packs.json"), "utf8"),
);
const allActiveQuestions = [...activeQuestions, ...examPackQuestions];
const archivedQuestions = JSON.parse(
  await readFile(resolve("src/data/questions.json"), "utf8"),
);

const stopWords = new Set([
  "about", "after", "again", "also", "among", "because", "before", "being",
  "best", "between", "does", "each", "exam", "from", "have", "into", "mastery",
  "most", "must", "old", "only", "other", "post", "should", "test", "than",
  "that", "their", "then", "there", "these", "they", "this", "through", "uses",
  "using", "what", "when", "where", "which", "while", "with", "would", "your",
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

function questionId(question) {
  return question.id ?? question.legacyId ?? "unknown";
}

function normalizedPrompt(question) {
  return question.question.trim().replace(/\s+/g, " ").toLowerCase();
}

function signature(question) {
  return [
    question.question,
    ...(question.correctAnswers ?? []),
    question.relatedConcept ?? "",
  ].join(" ");
}

function collectPromptMatches(questions, threshold) {
  const matches = [];

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const questionTokens = tokens(question.question);

    for (const candidate of questions.slice(0, index)) {
      const score = jaccard(questionTokens, tokens(candidate.question));
      if (score >= threshold) {
        matches.push({
          score,
          question: questionId(question),
          candidate: questionId(candidate),
          questionText: question.question,
          candidateText: candidate.question,
        });
      }
    }
  }

  return matches.sort((left, right) => right.score - left.score);
}

function collectExtremeArchiveMatches(threshold) {
  const extreme = archivedQuestions.filter((question) => question.legacyId?.startsWith("XQ"));
  const core = archivedQuestions.filter((question) => !question.legacyId?.startsWith("XQ"));
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
      if (score >= threshold) {
        matches.push({
          score,
          question: questionId(question),
          candidate: questionId(candidate),
          questionText: question.question,
          candidateText: candidate.question,
        });
      }
    }
  }

  return matches.sort((left, right) => right.score - left.score);
}

const promptOwners = new Map();
const exactPromptDuplicates = [];
for (const question of allActiveQuestions) {
  const prompt = normalizedPrompt(question);
  if (promptOwners.has(prompt)) {
    exactPromptDuplicates.push({
      question: questionId(question),
      candidate: promptOwners.get(prompt),
      questionText: question.question,
    });
  } else {
    promptOwners.set(prompt, questionId(question));
  }
}

const activePromptMatches = collectPromptMatches(allActiveQuestions, 0.84);
const archiveMatches = collectExtremeArchiveMatches(0.2);
const blockingArchiveMatches = archiveMatches.filter((match) => match.score >= 0.72);

if (exactPromptDuplicates.length > 0 || activePromptMatches.length > 0 || blockingArchiveMatches.length > 0) {
  console.error("Potential repeated questions", {
    exactPromptDuplicates,
    activePromptMatches,
    blockingArchiveMatches,
  });
  process.exitCode = 1;
} else {
  console.log("Question similarity audit passed", {
    activeQuestions: allActiveQuestions.length,
    archivedQuestions: archivedQuestions.length,
    archiveExtremeQuestions: archivedQuestions.filter((question) => question.legacyId?.startsWith("XQ")).length,
    highestActivePromptSimilarities: collectPromptMatches(allActiveQuestions, 0.4).slice(0, 8),
    highestArchiveExtremeSimilarities: archiveMatches.slice(0, 8),
  });
}
