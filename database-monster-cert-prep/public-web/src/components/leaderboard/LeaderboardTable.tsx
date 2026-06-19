import Link from "next/link";
import { COURSE_OPTIONS, normalizeCourse } from "@/lib/courses";
import { formatLastActive, formatPercent, getAvatarInitials, type PublicLeaderboardRow } from "@/lib/leaderboard";
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

  return (
    <section className="leaderboard-board">
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
                <span className="leaderboard-avatar" aria-hidden="true">{getAvatarInitials(row.display_name)}</span>
                <span className="leaderboard-row-main">
                  <span className="leaderboard-row-name">
                    {row.display_name}
                    {current && <em>You</em>}
                  </span>
                  <span>{row.course ?? "Course pending"} · Last active {formatLastActive(row.last_active_at)}</span>
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
