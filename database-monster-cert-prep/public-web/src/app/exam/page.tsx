import { Suspense } from "react";
import type { Metadata } from "next";
import { ExamClient } from "@/components/ExamClient";
import { LoadingPanel } from "@/components/DesignSystem";

export const metadata: Metadata = { title: "Exam" };

export default function ExamPage() {
  return (
    <Suspense fallback={<div className="app-container page-section"><LoadingPanel label="Preparing exam" /></div>}>
      <ExamClient />
    </Suspense>
  );
}
