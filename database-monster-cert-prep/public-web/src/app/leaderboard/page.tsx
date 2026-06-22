import type { Metadata } from "next";
import { LiveClassmatesPanel } from "@/components/leaderboard/LiveClassmatesPanel";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { normalizeCourse } from "@/lib/courses";
import { getPublicLeaderboard } from "@/lib/leaderboard";
import { getPublicPresence } from "@/lib/presence";
import Link from "next/link";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { course } = await searchParams;
  const selectedCourse = normalizeCourse(course);
  const [user, rows, presenceRows] = await Promise.all([
    getCurrentUser(),
    getPublicLeaderboard(selectedCourse).catch(() => []),
    getPublicPresence().catch(() => []),
  ]);

  return (
    <main className="page-shell section-space">
      <section className="page-intro leaderboard-intro">
        <p className="eyebrow">Class leaderboard</p>
        <h1>Readiness rankings for the certification sprint.</h1>
        <p>
          This opt-in leaderboard ranks public study cards by readiness score. Raw answers, mistakes,
          emails, and private exam history stay hidden.
        </p>
        <div className="button-row">
          <Button asChild><Link href="/profile">Manage visibility</Link></Button>
          <Button asChild variant="outline"><Link href="/exam?mode=diagnostic">Take diagnostic</Link></Button>
        </div>
      </section>

      <div className="leaderboard-content-grid">
        <LeaderboardTable
          currentUserId={user?.id}
          rows={rows}
          selectedCourse={selectedCourse}
        />
        <LiveClassmatesPanel rows={presenceRows} />
      </div>
    </main>
  );
}
