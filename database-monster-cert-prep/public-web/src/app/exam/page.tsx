import { Suspense } from "react";
import type { Metadata } from "next";
import { ExamClient } from "@/components/ExamClient";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Exam" };

export default async function ExamPage() {
  await requireUser();
  return (
    <Suspense fallback={<main className="page-shell section-space"><div className="loading-card">Preparing exam…</div></main>}>
      <ExamClient />
    </Suspense>
  );
}
