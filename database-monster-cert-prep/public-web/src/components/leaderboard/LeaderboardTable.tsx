import Link from "next/link";
import { Trophy } from "lucide-react";
import { AchievementBadges } from "@/components/rewards/AchievementBadges";
import { UserAvatar } from "@/components/UserAvatar";
import { COURSE_OPTIONS, normalizeCourse } from "@/lib/courses";
import { formatLastActive, formatPercent, type PublicLeaderboardRow } from "@/lib/leaderboard";
import { getWeeklyChallengeWindow } from "@/lib/rewards";
import { cn } from "@/lib/utils";

const filters = ["All", ...COURSE_OPTIONS] as const;

export function LeaderboardTable({
  rows,
  selectedCourse,
  currentUserId,
}: {
  rows: PublicLeaderboardRow[];
  selectedCourse?: string | null;
  currentUserId?: string;
}) {
  const normalizedCourse = normalizeCourse(selectedCourse);
  const challengeWindow = getWeeklyChallengeWindow();
  const challengeRows = [...rows]
    .filter((row) => row.weekly_challenge_score > 0)
    .sort((left, right) =>
      right.weekly_challenge_score - left.weekly_challenge_score ||
      right.current_streak - left.current_streak ||
      left.display_name.localeCompare(right.display_name),
    )
    .slice(0, 3);

  return (
    <section className="leaderboard-board">
      <div className="weekly-challenge-panel">
        <div>
          <span className="mono-label">Weekly challenge</span>
          <h2><Trophy className="size-5" aria-hidden="true" /> Weekly Repair Sprint</h2>
          <p>Earn points this week from exam attempts, question volume, and keeping your streak alive. Window: {challengeWindow.label} UTC.</p>
        </div>
        <div className="weekly-challenge-list">
          {challengeRows.length ? challengeRows.map((row, index) => (
            <Link href={`/students/${row.user_id}`} key={row.user_id}>
              <span>#{index + 1}</span>
              <strong>{row.display_name}</strong>
              <b>{row.weekly_challenge_score}</b>
            </Link>
          )) : (
            <p>No weekly sprint points yet. Take a diagnostic or repair a few cards to start the board.</p>
          )}
        </div>
      </div>

      <div className="leaderboard-filter" aria-label="Course filters">
        {filters.map((filter) => {
          const active = filter === "All" ? !normalizedCourse : normalizedCourse === filter;
          const href = filter === "All" ? "/leaderboard" : `/leaderboard?course=${filter}`;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn("leaderboard-filter-link", active && "is-active")}
              href={href}
              key={filter}
            >
              {filter}
            </Link>
          );
        })}
      </div>

      {rows.length ? (
        <div className="leaderboard-list">
          {rows.map((row) => {
            const current = currentUserId === row.user_id;
            return (
              <Link
                className={cn("leaderboard-row", current && "is-current-user")}
                href={`/students/${row.user_id}`}
                key={row.user_id}
              >
                <span className="leaderboard-row-rank">#{row.rank}</span>
                <UserAvatar name={row.display_name} src={row.avatar_url} />
                <span className="leaderboard-row-main">
                  <span className="leaderboard-row-name">
                    {row.display_name}
                    {current && <em>You</em>}
                  </span>
                  <span>{row.course ?? "Course pending"} · Last active {formatLastActive(row.last_active_at)}</span>
                  <AchievementBadges achievements={row.achievement_details.slice(0, 3)} compact />
                </span>
                <span className="leaderboard-row-stat">
                  <strong>{formatPercent(row.readiness_score)}</strong>
                  <small>ready</small>
                </span>
                <span className="leaderboard-row-stat">
                  <strong>{formatPercent(row.best_score)}</strong>
                  <small>best</small>
                </span>
                <span className="leaderboard-row-stat">
                  <strong>{row.attempt_count}</strong>
                  <small>attempts</small>
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="leaderboard-empty">
          <h2>No public students yet.</h2>
          <p>
            {normalizedCourse
              ? `No ${normalizedCourse} students have opted into the leaderboard yet.`
              : "Students appear here only after choosing to show public readiness stats."}
          </p>
          <Link className="button primary" href="/profile">Update profile</Link>
        </div>
      )}
    </section>
  );
}
