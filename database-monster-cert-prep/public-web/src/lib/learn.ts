import { learnTopics, type LearnLesson, type LearnTopic } from "@/data/learn-topics";

export interface LearnLessonEntry {
  topic: LearnTopic;
  lesson: LearnLesson;
}

export function firstLessonForTopic(topic: LearnTopic): LearnLesson | null {
  return topic.lessons[0] ?? null;
}

export function hrefForLearnLesson(topicSlug: string, lessonSlug: string): string {
  return `/learn/${encodeURIComponent(topicSlug)}/${encodeURIComponent(lessonSlug)}`;
}

export function hrefForLearnTopic(topic: LearnTopic): string {
  const firstLesson = firstLessonForTopic(topic);

  return firstLesson ? hrefForLearnLesson(topic.slug, firstLesson.slug) : "/learn";
}

export function learnTopicBySlug(slug: string | null | undefined): LearnTopic | null {
  if (!slug) return null;

  return learnTopics.find((topic) => topic.slug === slug) ?? null;
}

export function learnTopicByReviewFile(reviewFile: string | null | undefined): LearnTopic | null {
  if (!reviewFile) return null;

  return learnTopics.find((topic) => topic.reviewFile === reviewFile) ?? null;
}

export function learnLessonBySlug(
  topicSlug: string | null | undefined,
  lessonSlug: string | null | undefined,
): LearnLesson | null {
  const topic = learnTopicBySlug(topicSlug);
  if (!topic || !lessonSlug) return null;

  return topic.lessons.find((lesson) => lesson.slug === lessonSlug) ?? null;
}

export function learnEntryBySlug(
  topicSlug: string | null | undefined,
  lessonSlug: string | null | undefined,
): LearnLessonEntry | null {
  const topic = learnTopicBySlug(topicSlug);
  if (!topic) return null;

  const lesson = learnLessonBySlug(topicSlug, lessonSlug);
  if (!lesson) return null;

  return { topic, lesson };
}

export function fallbackLearnEntry(topicSlug?: string | null, lessonSlug?: string | null): LearnLessonEntry {
  const requestedTopic = learnTopicBySlug(topicSlug);
  const selectedTopic = requestedTopic ?? learnTopics[0];
  const requestedLesson = requestedTopic ? learnLessonBySlug(topicSlug, lessonSlug) : null;
  const selectedLesson = requestedLesson ?? firstLessonForTopic(selectedTopic) ?? learnTopics[0].lessons[0];

  return { topic: selectedTopic, lesson: selectedLesson };
}

export function allLearnLessonEntries(): LearnLessonEntry[] {
  return learnTopics.flatMap((topic) => topic.lessons.map((lesson) => ({ topic, lesson })));
}

export function previousAndNextLesson(
  topicSlug: string,
  lessonSlug: string,
): { previous: LearnLessonEntry | null; next: LearnLessonEntry | null } {
  const entries = allLearnLessonEntries();
  const index = entries.findIndex((entry) => entry.topic.slug === topicSlug && entry.lesson.slug === lessonSlug);

  if (index === -1) return { previous: null, next: null };

  return {
    previous: entries[index - 1] ?? null,
    next: entries[index + 1] ?? null,
  };
}

export function hrefForReviewFile(reviewFile: string | null | undefined): string | null {
  const topic = learnTopicByReviewFile(reviewFile);

  return topic ? hrefForLearnTopic(topic) : null;
}
