import { Suspense } from "react";
import type { Metadata } from "next";
import { ExamClient } from "@/components/ExamClient";
import { LoadingPanel } from "@/components/DesignSystem";
import { requireUser } from "@/lib/auth";
import { getMistakes } from "@/lib/progress";

export const metadata: Metadata = { title: "Exam" };

export default async function ExamPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const presetQuestionIds = params.mode === "mistakes"
    ? (await getMistakes(user.id)).map((mistake) => mistake.question_id)
    : [];

  return (
    <Suspense fallback={<div className="app-container page-section"><LoadingPanel label="Preparing exam" /></div>}>
      <ExamClient presetQuestionIds={presetQuestionIds} />
    </Suspense>
  );
}
