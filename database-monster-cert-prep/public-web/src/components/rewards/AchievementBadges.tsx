import { Award, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Achievement, NextAchievement } from "@/lib/rewards";
import { cn } from "@/lib/utils";

export function AchievementBadges({
  achievements,
  compact = false,
}: {
  achievements: Achievement[];
  compact?: boolean;
}) {
  if (!achievements.length) {
    return <span className="achievement-empty">No badges yet</span>;
  }

  return (
    <div className={cn("achievement-badges", compact && "achievement-badges-compact")}>
      {achievements.map((achievement) => (
        <Badge
          className={cn("achievement-badge", `achievement-badge-${achievement.tone}`)}
          key={achievement.id}
          title={achievement.description}
          variant="secondary"
        >
          <Award className="size-3" aria-hidden="true" />
          {achievement.label}
        </Badge>
      ))}
    </div>
  );
}

export function NextAchievementCard({ next }: { next: NextAchievement | null }) {
  return (
    <Card className="rewards-next-card">
      <CardHeader>
        <span className="mono-label">Next badge</span>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Target className="size-5 text-primary" aria-hidden="true" />
          {next ? next.achievement.label : "All starter badges earned"}
        </CardTitle>
        <CardDescription>
          {next ? next.achievement.description : "Keep studying to protect your streak and readiness score."}
        </CardDescription>
      </CardHeader>
      {next && (
        <CardContent>
          <div className="reward-progress">
            <div>
              <span>{next.current}</span>
              <small>of {next.target}</small>
            </div>
            <i aria-hidden="true"><b style={{ width: `${next.percent}%` }} /></i>
            <strong>{next.percent}%</strong>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
