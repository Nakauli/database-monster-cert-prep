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

  return (
    <main className="page-shell dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Personal command center</p>
          <h1>Welcome back, {displayName}.</h1>
          <p>{weakest ? `Your next useful target is ${weakest.topic} at ${weakest.mastery_score}% mastery.` : "Take the diagnostic to generate your first weakness map."}</p>
        </div>
        <div className="button-row">
          <Link className="button primary" href="/exam?mode=diagnostic">Start an exam</Link>
          <Link className="button secondary" href="/practice">Practice a topic</Link>
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

