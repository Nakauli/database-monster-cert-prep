import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLastActive, formatPercent, type PublicLeaderboardRow } from "@/lib/leaderboard";

function TopicList({ title, topics }: { title: string; topics: string[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {topics.length ? topics.map((topic) => (
          <Badge key={topic} variant="secondary">{topic}</Badge>
        )) : <span className="text-sm text-muted-foreground">Not enough topic data yet.</span>}
      </div>
    </div>
  );
}

export function PublicStudentProfile({ student }: { student: PublicLeaderboardRow }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="public-student-card">
        <CardHeader>
          <Link className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary" href="/leaderboard">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to leaderboard
          </Link>
          <div className="mt-4 flex items-center gap-4">
            <UserAvatar
              alt={`${student.display_name}'s profile photo`}
              className="public-student-avatar"
              name={student.display_name}
              size="lg"
              src={student.avatar_url}
            />
            <div>
              <Badge variant="secondary" className="mb-2 w-fit">Rank #{student.rank}</Badge>
              <CardTitle className="text-3xl">{student.display_name}</CardTitle>
              <CardDescription>{student.course ?? "Course pending"} · Public study card</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="public-readiness-score">
            <span>{formatPercent(student.readiness_score)}</span>
            <p>readiness score</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Public progress snapshot</CardTitle>
          <CardDescription>No email, mistake notebook, full history, or question-level answers are shown.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="mini-stat"><strong>{formatPercent(student.best_score)}</strong><span>Best exam</span></div>
            <div className="mini-stat"><strong>{student.attempt_count}</strong><span>Attempts</span></div>
            <div className="mini-stat"><strong>{formatPercent(student.average_mastery)}</strong><span>Avg mastery</span></div>
          </div>
          <p className="text-sm text-muted-foreground">Last active: {formatLastActive(student.last_active_at)}</p>
          <TopicList title="Strongest topics" topics={student.strongest_topics} />
          <TopicList title="Weakest topics to repair" topics={student.weakest_topics} />
          <Button asChild variant="outline" className="w-fit">
            <Link href="/leaderboard">Compare class readiness</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
