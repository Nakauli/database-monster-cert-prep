import { Suspense } from "react";
import type { Metadata } from "next";
import { ExamClient } from "@/components/ExamClient";

export const metadata: Metadata = { title: "Exam" };

export default function ExamPage() {
  return (
    <Suspense fallback={<main className="page-shell section-space"><div className="loading-card">Preparing exam…</div></main>}>
      <ExamClient />
    </Suspense>
  );
}

