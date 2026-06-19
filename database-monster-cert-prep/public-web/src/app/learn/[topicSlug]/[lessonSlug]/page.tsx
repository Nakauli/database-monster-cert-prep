import type { Metadata } from "next";
import { LearnClient } from "@/components/LearnClient";
import { fallbackLearnEntry } from "@/lib/learn";

export const metadata: Metadata = {
  title: "Learn",
  description: "Focused subtopic lessons for database certification practice.",
};

export default async function LearnLessonPage({
  params,
}: {
  params: Promise<{ topicSlug: string; lessonSlug: string }>;
}) {
  const { topicSlug, lessonSlug } = await params;
  const { topic: selectedTopic, lesson: selectedLesson } = fallbackLearnEntry(topicSlug, lessonSlug);

  return <LearnClient selectedLesson={selectedLesson} selectedTopic={selectedTopic} />;
}
