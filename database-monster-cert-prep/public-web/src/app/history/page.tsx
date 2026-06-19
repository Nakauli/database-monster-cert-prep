import type { Metadata } from "next";
import { ExamHistoryTable } from "@/components/history/ExamHistoryTable";
import { requireUser } from "@/lib/auth";
import { getExamHistory } from "@/lib/progress";

export const metadata: Metadata = { title: "Exam History" };

export default async function HistoryPage() {
  const user = await requireUser();
  const attempts = await getExamHistory(user.id);
  return (
    <main className="page-shell section-space">
      <section className="page-intro">
        <p className="eyebrow">Private exam history</p>
        <h1>Every saved attempt, in one place.</h1>
        <p>Open any result to review its topic breakdown and the questions you missed.</p>
      </section>
      <ExamHistoryTable attempts={attempts} />
    </main>
  );
}

