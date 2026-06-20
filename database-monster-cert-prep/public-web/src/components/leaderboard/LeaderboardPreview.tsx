import Link from "next/link";
import { Trophy } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent, type PublicLeaderboardRow } from "@/lib/leaderboard";

export function LeaderboardPreview({
  rows,
  signedIn = false,
}: {
  rows: PublicLeaderboardRow[];
  signedIn?: boolean;
}) {
  return (
    <Card className="leaderboard-preview-card overflow-hidden">
      <CardHeader>
        <Badge className="w-fit" variant="secondary">Class readiness</Badge>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-5 text-primary" aria-hidden="true" />
          Leaderboard
        </CardTitle>
        <CardDescription>Opt-in ranking based on readiness, not raw private history.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {rows.length ? (
          rows.slice(0, 3).map((row, index) => (
            <Link
              className="leaderboard-preview-row"
              href={`/students/${row.user_id}`}
              key={row.user_id}
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <span className="leaderboard-rank">#{row.rank}</span>
              <UserAvatar name={row.display_name} src={row.avatar_url} />
              <span className="min-w-0 flex-1">
                <strong>{row.display_name}</strong>
                <small>{row.course ?? "Course pending"}</small>
              </span>
              <span className="leaderboard-score-pulse">{formatPercent(row.readiness_score)}</span>
            </Link>
          ))
        ) : (
          <div className="rounded-xl border border-dashed bg-background/70 p-4">
            <p className="text-sm font-semibold text-ink">No public leaderboard yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Be one of the first to opt in after creating a profile.</p>
          </div>
        )}
        <Button asChild variant={rows.length ? "default" : "outline"} className="w-fit">
          <Link href={rows.length || signedIn ? "/leaderboard" : "/register"}>
            {rows.length ? "View leaderboard" : signedIn ? "Open leaderboard" : "Join leaderboard"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
