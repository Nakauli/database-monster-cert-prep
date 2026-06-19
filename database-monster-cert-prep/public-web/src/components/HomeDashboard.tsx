import Link from "next/link";
import { InfoCard, SectionHeader, StatGrid } from "@/components/DesignSystem";
import { LeaderboardPreview } from "@/components/leaderboard/LeaderboardPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { secondaryNavigation } from "@/lib/navigation";
import type { PublicLeaderboardRow } from "@/lib/leaderboard";
import type { getDashboardData } from "@/lib/progress";

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

const flowSteps = [
  { title: "1. Diagnostic", detail: "Take a balanced 40-question baseline first." },
  { title: "2. Weak topics", detail: "Use the score map to pick one topic to repair." },
  { title: "3. Mistake repair", detail: "Replay the questions you missed until they stick." },
  { title: "4. Timed exam", detail: "Prove readiness under the clock before the real test." },
];

function getNextAction(data: DashboardData | null) {
  if (!data || !data.attempts.length) {
    return {
      title: "Start with the diagnostic.",
      description: "This creates your baseline, weak-topic map, and mistake notebook.",
      href: "/exam?mode=diagnostic",
      label: "Start diagnostic",
    };
  }

  const weakest = data.topics[0];
  if (data.mistakeCount > 0) {
    return {
      title: `Repair ${data.mistakeCount} saved mistake${data.mistakeCount === 1 ? "" : "s"}.`,
      description: weakest
        ? `Then train ${weakest.topic}, currently your lowest mastery topic.`
        : "Mistake repair is the fastest way to turn misses into points.",
      href: "/mistakes",
      label: "Repair mistakes",
    };
  }

  if (weakest && weakest.mastery_score < 80) {
    return {
      title: `Train ${weakest.topic} next.`,
      description: `${weakest.mastery_score}% mastery is the clearest repair target before another timed run.`,
      href: `/practice?topic=${encodeURIComponent(weakest.topic)}`,
      label: "Practice weakest topic",
    };
  }

  return {
    title: "You are ready for timed pressure.",
    description: "Run a timed exam or Final Boss to check if the score holds under exam conditions.",
    href: "/exam?mode=timed",
    label: "Take timed exam",
  };
}

export function HomeDashboard({
  dashboardData = null,
  leaderboardRows = [],
  userEmail,
}: {
  dashboardData?: DashboardData | null;
  leaderboardRows?: PublicLeaderboardRow[];
  userEmail?: string;
}) {
  const nextAction = getNextAction(dashboardData);
  const displayName = dashboardData?.profile?.display_name || userEmail?.split("@")[0];
  const secondaryCards = secondaryNavigation.filter((item) => ["/learn", "/labs", "/roadmap", "/about"].includes(item.href));

  return (
    <div>
      <section className="app-container page-section home-hero-section">
        <div className="home-hero-grid">
          <div className="home-hero-copy">
            <Badge variant="secondary" className="w-fit font-mono uppercase tracking-[0.08em]">
              {displayName ? `Start here, ${displayName}` : "Certification simulator"}
            </Badge>
            <h1 className="font-heading page-title">Start with a diagnostic. Then study only what matters.</h1>
            <p className="page-copy">
              Database Monster now follows one exam-prep path: build a baseline, repair weak topics, review mistakes, then prove readiness under timed pressure.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg"><Link href={nextAction.href}>{nextAction.label}</Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/practice">Practice a topic</Link></Button>
            </div>
          </div>
          <LeaderboardPreview rows={leaderboardRows} signedIn={Boolean(userEmail)} />
        </div>

        <div className="home-action-grid">
          <Card className="next-action-card bg-card/90">
            <CardHeader>
              <Badge variant="secondary" className="w-fit">Next best action</Badge>
              <CardTitle>{nextAction.title}</CardTitle>
              <CardDescription>{nextAction.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild><Link href={nextAction.href}>{nextAction.label}</Link></Button>
              <Button asChild variant="outline"><Link href="/mistakes">Repair notebook</Link></Button>
            </CardContent>
          </Card>

          <Card className="guided-path-strip bg-primary text-primary-foreground">
            <CardHeader className="pb-3">
              <Badge className="w-fit bg-primary-foreground text-primary">Guided path</Badge>
              <CardTitle className="text-2xl tracking-[-0.04em]">Diagnostic to timed exam.</CardTitle>
              <CardDescription className="text-primary-foreground/75">
                The app should always make the next useful study move obvious.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {flowSteps.map((step) => (
                <div className="guided-path-step" key={step.title}>
                  <strong>{step.title.replace(/^\d+\.\s*/, "")}</strong>
                  <span>{step.detail}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="app-container page-section pt-0">
        <StatGrid
          stats={[
            { value: "360", label: "original questions" },
            { value: "4", label: "live SQL challenges" },
            { value: "12", label: "tracked topic areas" },
            { value: "RLS", label: "private progress storage" },
          ]}
        />
      </section>

      <section className="app-container page-section pt-0">
        <SectionHeader
          title="Follow the exam-prep loop."
          description="Do these in order when you feel lost. Skip ahead only when your scores show you are ready."
          action={<Button asChild variant="ghost"><Link href="/roadmap">Open roadmap</Link></Button>}
        />
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {flowSteps.map((step) => (
            <InfoCard
              description={step.detail}
              key={step.title}
              title={step.title}
            />
          ))}
        </div>
      </section>

      <section className="app-container page-section pt-0">
        <SectionHeader title="Useful side quests" description="These stay available, but they no longer compete with the main diagnostic-first path." />
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {secondaryCards.map((item) => (
            <InfoCard
              action={<Button asChild variant={item.href === "/learn" ? "default" : "outline"}><Link href={item.href}>{item.label}</Link></Button>}
              description={item.description}
              key={item.href}
              title={item.label}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
