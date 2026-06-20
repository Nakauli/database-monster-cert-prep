import Link from "next/link";
import type { Metadata } from "next";
import { ProgressCards } from "@/components/dashboard/ProgressCards";
import { RecentAttempts } from "@/components/dashboard/RecentAttempts";
import { WeakTopics } from "@/components/dashboard/WeakTopics";
import { AchievementBadges, NextAchievementCard } from "@/components/rewards/AchievementBadges";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/progress";
import { isFirstRun } from "@/lib/onboarding";
import { computeWeeklyChallengeScore, getEarnedAchievements, getNextAchievement, type RewardSignals } from "@/lib/rewards";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);
  const scores = data.attempts.map((attempt) => Number(attempt.score));
  const bestScore = scores.length ? Math.max(...scores) : 0;
  const latestScore = scores[0] ?? 0;
  const averageScore = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  const averageMastery = data.topics.length
    ? Math.round(data.topics.reduce((sum, topic) => sum + Number(topic.mastery_score), 0) / data.topics.length)
    : 0;
  const rewardSignals: RewardSignals = {
    currentStreak: data.streak.current_streak,
    longestStreak: data.streak.longest_streak,
    bestScore,
    attemptCount: data.attempts.length,
    averageMastery,
    finalBossCount: data.finalBossCount,
    mistakeCount: data.mistakeCount,
    dueCount: data.dueCount,
    weekAttemptCount: data.weekAttemptCount,
    weekQuestionCount: data.weekQuestionCount,
  };
  const earnedAchievements = getEarnedAchievements(rewardSignals);
  const nextAchievement = getNextAchievement(rewardSignals);
  const weeklyChallengeScore = computeWeeklyChallengeScore(rewardSignals);
  const weakest = data.topics[0];
  const displayName = data.profile?.display_name || user.email?.split("@")[0] || "Database learner";
  const nextAction = !data.attempts.length
    ? { label: "Start diagnostic", href: "/exam?mode=diagnostic", title: "Build your baseline first.", detail: "Take the diagnostic so Progress can show weak topics, saved mistakes, and a useful next task." }
    : data.mistakeCount > 0
      ? { label: "Repair mistakes", href: "/mistakes", title: `Repair ${data.mistakeCount} saved mistake${data.mistakeCount === 1 ? "" : "s"}.`, detail: weakest ? `After that, practice ${weakest.topic} to lift your weakest mastery score.` : "Mistake repair is the fastest path from wrong answers to exam points." }
      : weakest && weakest.mastery_score < 80
        ? { label: "Practice weakest topic", href: `/practice?topic=${encodeURIComponent(weakest.topic)}`, title: `Practice ${weakest.topic} next.`, detail: `${weakest.mastery_score}% mastery is below the 80% checkpoint.` }
        : { label: "Take timed exam", href: "/exam?mode=timed", title: "Move into timed pressure.", detail: "Your repair queue is clear enough to test whether the score holds under the clock." };

  const firstRun = isFirstRun(data.attempts.length);

  return (
    <main className="page-shell dashboard-page">
      {firstRun && (
        <section className="dashboard-panel progress-next-step" aria-label="New here">
          <div className="panel-heading">
            <div><p className="eyebrow">New here?</p><h2>Take the 2-minute tour, then your diagnostic.</h2></div>
            <Link href="/welcome">See how it works -&gt;</Link>
          </div>
          <p className="muted">Database Monster guides you from a baseline diagnostic to repairing weak topics, spaced-repetition mistake review, and timed exams. Start with the walkthrough or jump straight in.</p>
          <div className="button-row">
            <Link className="button primary" href="/welcome">Take the tour</Link>
            <Link className="button secondary" href="/exam?mode=diagnostic">Start diagnostic</Link>
          </div>
        </section>
      )}

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

      <section className="dashboard-split rewards-dashboard-row">
        <article className="dashboard-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">Rewards</p><h2>Starter achievements</h2></div>
            <Link href="/leaderboard">Class board -&gt;</Link>
          </div>
          <p className="muted">Badges are based on aggregate study signals, not private answer history.</p>
          <AchievementBadges achievements={earnedAchievements} />
          <div className="weekly-score-inline">
            <strong>{weeklyChallengeScore}</strong>
            <span>weekly repair sprint points</span>
          </div>
        </article>
        <NextAchievementCard next={nextAchievement} />
      </section>

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
