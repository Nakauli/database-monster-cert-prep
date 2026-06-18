import Link from "next/link";
import type { ExamAttemptRow } from "@/lib/progress";

function modeLabel(mode: string) {
  return mode.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function RecentAttempts({ attempts }: { attempts: ExamAttemptRow[] }) {
  return (
    <section className="dashboard-panel">
      <div className="panel-heading">
        <div><p className="eyebrow">Exam history</p><h2>Recent attempts</h2></div>
        <Link href="/history">View all →</Link>
      </div>
      {!attempts.length ? (
        <div className="dashboard-empty">
          <p>No attempts saved yet.</p>
          <Link className="button primary" href="/exam?mode=diagnostic">Start diagnostic</Link>
        </div>
      ) : (
        <div className="attempt-list">
          {attempts.slice(0, 6).map((attempt) => (
            <Link href={`/results?id=${attempt.id}`} className="attempt-row" key={attempt.id}>
              <div><strong>{modeLabel(attempt.exam_mode)}</strong><span>{new Date(attempt.created_at).toLocaleDateString()}</span></div>
              <span>{attempt.correct_count}/{attempt.total_questions}</span>
              <b className={attempt.score >= 80 ? "pass-score" : "repair-score"}>{attempt.score}%</b>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

