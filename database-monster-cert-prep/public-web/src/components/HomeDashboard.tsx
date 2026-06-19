import Link from "next/link";
import { CodeBlock } from "@/components/DataDisplay";
import { InfoCard, PageHeader, SectionHeader, StatGrid } from "@/components/DesignSystem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { secondaryNavigation } from "@/lib/navigation";
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
  userEmail,
}: {
  dashboardData?: DashboardData | null;
  userEmail?: string;
}) {
  const nextAction = getNextAction(dashboardData);
  const displayName = dashboardData?.profile?.display_name || userEmail?.split("@")[0];
  const secondaryCards = secondaryNavigation.filter((item) => ["/labs", "/roadmap", "/about"].includes(item.href));

  return (
    <div>
      <section className="app-container page-section">
        <PageHeader
          label={displayName ? `Start here, ${displayName}` : "Certification simulator"}
          title="Start with a diagnostic. Then study only what matters."
          description="Database Monster now follows one exam-prep path: build a baseline, repair weak topics, review mistakes, then prove readiness under timed pressure."
          actions={
            <>
              <Button asChild size="lg"><Link href={nextAction.href}>{nextAction.label}</Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/practice">Practice a topic</Link></Button>
            </>
          }
        />

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <Card className="bg-card/90">
            <CardHeader>
              <CardTitle>{nextAction.title}</CardTitle>
              <CardDescription>{nextAction.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock
                label="exam_prep_flow.sql"
                code={`SELECT next_step\nFROM certification_plan\nORDER BY priority\nLIMIT 1;`}
              />
            </CardContent>
          </Card>
          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <Badge className="w-fit bg-primary-foreground text-primary">Guided path</Badge>
              <CardTitle className="text-3xl tracking-[-0.04em]">
                Diagnostic -&gt; weak topics -&gt; mistake repair -&gt; timed exam.
              </CardTitle>
              <CardDescription className="text-primary-foreground/75">
                The app should always make the next useful study move obvious.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary"><Link href="/exam?mode=diagnostic">Build your baseline</Link></Button>
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
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {secondaryCards.map((item) => (
            <InfoCard
              action={<Button asChild variant={item.href === "/labs" ? "default" : "outline"}><Link href={item.href}>{item.label}</Link></Button>}
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
