import Link from "next/link";
import type { Metadata } from "next";
import { ProgressCards } from "@/components/dashboard/ProgressCards";
import { RecentAttempts } from "@/components/dashboard/RecentAttempts";
import { WeakTopics } from "@/components/dashboard/WeakTopics";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/progress";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);
  const scores = data.attempts.map((attempt) => Number(attempt.score));
  const bestScore = scores.length ? Math.max(...scores) : 0;
  const latestScore = scores[0] ?? 0;
  const averageScore = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  const weakest = data.topics[0];
  const displayName = data.profile?.display_name || user.email?.split("@")[0] || "Database learner";
  const nextAction = !data.attempts.length
    ? { label: "Start diagnostic", href: "/exam?mode=diagnostic", title: "Build your baseline first.", detail: "Take the diagnostic so Progress can show weak topics, saved mistakes, and a useful next task." }
    : data.mistakeCount > 0
      ? { label: "Repair mistakes", href: "/mistakes", title: `Repair ${data.mistakeCount} saved mistake${data.mistakeCount === 1 ? "" : "s"}.`, detail: weakest ? `After that, practice ${weakest.topic} to lift your weakest mastery score.` : "Mistake repair is the fastest path from wrong answers to exam points." }
      : weakest && weakest.mastery_score < 80
        ? { label: "Practice weakest topic", href: `/practice?topic=${encodeURIComponent(weakest.topic)}`, title: `Practice ${weakest.topic} next.`, detail: `${weakest.mastery_score}% mastery is below the 80% checkpoint.` }
        : { label: "Take timed exam", href: "/exam?mode=timed", title: "Move into timed pressure.", detail: "Your repair queue is clear enough to test whether the score holds under the clock." };

  return (
    <main className="page-shell dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Progress</p>
          <h1>Know exactly what to repair next.</h1>
          <p>{displayName}, this page turns your attempts, weak topics, and saved mistakes into the next useful study move.</p>
        </div>
        <div className="button-row">
          <Link className="button primary" href={nextAction.href}>{nextAction.label}</Link>
          <Link className="button secondary" href="/exam?mode=timed">Take timed exam</Link>
        </div>
      </section>

      <section className="dashboard-panel progress-next-step">
        <div className="panel-heading">
          <div><p className="eyebrow">Next repair task</p><h2>{nextAction.title}</h2></div>
          <Link href={nextAction.href}>{nextAction.label} -&gt;</Link>
        </div>
        <p className="muted">{nextAction.detail}</p>
        <div className="button-row">
          <Link className="button secondary" href="/mistakes">Mistake notebook</Link>
          <Link className="button secondary" href="/practice">Topic practice</Link>
          <Link className="button secondary" href="/history">Exam history</Link>
        </div>
      </section>

      <ProgressCards
        totalExams={data.attempts.length}
        bestScore={bestScore}
        latestScore={latestScore}
        averageScore={averageScore}
        mistakeCount={data.mistakeCount}
      />

      {data.attempts.length > 1 && (
        <section className="dashboard-panel progress-over-time">
          <div className="panel-heading"><div><p className="eyebrow">Score trend</p><h2>Progress over time</h2></div></div>
          <div className="trend-chart" aria-label="Recent exam scores">
            {[...data.attempts].slice(0, 12).reverse().map((attempt) => (
              <div key={attempt.id}>
                <i style={{ height: `${Math.max(6, Number(attempt.score))}%` }} />
                <span>{attempt.score}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <WeakTopics topics={data.topics} />
      <RecentAttempts attempts={data.attempts} />
    </main>
  );
}
