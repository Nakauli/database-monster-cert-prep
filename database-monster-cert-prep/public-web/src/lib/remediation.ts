import { hrefForLearnLesson, hrefForLearnTopic, learnTopicByReviewFile } from "@/lib/learn";
import type { AnswerReview, Question, TopicStat } from "@/lib/types";

interface LabLinkSource {
  id: string;
  topic: string;
  title: string;
}

export interface WeakTopic {
  topic: string;
  correct: number;
  total: number;
  missed: number;
  percentage: number;
  drillHref: string;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
}

function includesConcept(haystack: string, needle: string): boolean {
  const normalizedHaystack = normalize(haystack);
  const normalizedNeedle = normalize(needle);

  return Boolean(normalizedNeedle) && normalizedHaystack.includes(normalizedNeedle);
}

export function buildTopicPracticeHref(topic: string, count = 10): string {
  return `/exam?mode=practice&topic=${encodeURIComponent(topic)}&difficulty=all&count=${encodeURIComponent(String(count))}`;
}

export function rankWeakTopics(topicStats: Record<string, TopicStat>, limit = 3): WeakTopic[] {
  return Object.entries(topicStats)
    .filter(([, stat]) => stat.total > 0)
    .map(([topic, stat]) => ({
      topic,
      ...stat,
      missed: Math.max(0, stat.total - stat.correct),
      drillHref: buildTopicPracticeHref(topic),
    }))
    .sort((left, right) =>
      left.percentage - right.percentage ||
      right.missed - left.missed ||
      left.topic.localeCompare(right.topic),
    )
    .slice(0, limit);
}

export function hrefForQuestionLesson(question: Pick<Question, "reviewFile" | "relatedConcept">): string | null {
  const topic = learnTopicByReviewFile(question.reviewFile);
  if (!topic) return null;

  const concept = question.relatedConcept;
  if (concept) {
    const lesson = topic.lessons.find((candidate) =>
      includesConcept(candidate.title, concept) ||
      includesConcept(candidate.slug, concept) ||
      includesConcept(candidate.summary, concept) ||
      includesConcept(candidate.definition, concept),
    );

    if (lesson) return hrefForLearnLesson(topic.slug, lesson.slug);
  }

  return hrefForLearnTopic(topic);
}

export function hrefForQuestionLab(question: Pick<Question, "topic" | "reviewFile" | "relatedConcept">, labSources: LabLinkSource[]): string {
  const topic = learnTopicByReviewFile(question.reviewFile);
  const concept = question.relatedConcept;

  if (topic) {
    const lesson = concept
      ? topic.lessons.find((candidate) =>
          includesConcept(candidate.title, concept) ||
          includesConcept(candidate.slug, concept) ||
          includesConcept(candidate.summary, concept) ||
          includesConcept(candidate.definition, concept),
        )
      : null;

    if (lesson?.labHref) return lesson.labHref;

    const firstLessonLab = topic.lessons.find((candidate) => candidate.labHref)?.labHref;
    if (firstLessonLab) return firstLessonLab;
  }

  const exactTopicMatch = labSources.find((lab) => normalize(lab.topic) === normalize(question.topic));
  if (exactTopicMatch) return `/labs#${exactTopicMatch.id}`;

  const titleMatch = labSources.find((lab) =>
    includesConcept(question.topic, lab.topic) ||
    includesConcept(question.topic, lab.title) ||
    includesConcept(lab.title, question.topic),
  );
  if (titleMatch) return `/labs#${titleMatch.id}`;

  return `/labs?topic=${encodeURIComponent(question.topic)}`;
}

export function spacedReviewSummary(reviews: AnswerReview[]): { dueCount: number; label: string } {
  const dueCount = reviews.filter((review) => !review.correct).length;

  return {
    dueCount,
    label: `${dueCount} ${dueCount === 1 ? "card" : "cards"} now due`,
  };
}
