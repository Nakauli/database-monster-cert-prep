import Link from "next/link";
import type { ExamAttemptRow } from "@/lib/progress";
import { examModeLabel } from "@/lib/questions";

export function ExamHistoryTable({ attempts }: { attempts: ExamAttemptRow[] }) {
  if (!attempts.length) {
    return (
      <section className="empty-state inline-empty">
        <h2>No saved attempts yet.</h2>
        <p>Complete the diagnostic to create your first permanent result.</p>
        <Link className="button primary" href="/exam?mode=diagnostic">Start diagnostic</Link>
      </section>
    );
  }

  return (
    <div className="history-table-wrap">
      <table className="history-table">
        <thead>
          <tr>
            <th>Exam</th>
            <th>Date</th>
            <th>Score</th>
            <th>Correct</th>
            <th>Time</th>
            <th><span className="sr-only">Action</span></th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((attempt) => (
            <tr key={attempt.id}>
              <td><strong>{examModeLabel(attempt.exam_mode)}</strong></td>
              <td>{new Date(attempt.created_at).toLocaleString()}</td>
              <td><b className={attempt.score >= 80 ? "pass-score" : "repair-score"}>{attempt.score}%</b></td>
              <td>{attempt.correct_count}/{attempt.total_questions}</td>
              <td>{attempt.time_spent_seconds === null ? "—" : `${Math.floor(attempt.time_spent_seconds / 60)}m ${attempt.time_spent_seconds % 60}s`}</td>
              <td><Link href={`/results?id=${attempt.id}`}>View details →</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

