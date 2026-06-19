import type { Metadata } from "next";
import { LearnClient } from "@/components/LearnClient";
import { fallbackLearnEntry } from "@/lib/learn";

export const metadata: Metadata = {
  title: "Learn",
  description: "Definitions, examples, and exam traps for database certification practice.",
};

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  const { topic: selectedTopic, lesson: selectedLesson } = fallbackLearnEntry(topic);

  return <LearnClient selectedLesson={selectedLesson} selectedTopic={selectedTopic} />;
}
