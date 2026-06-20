import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/progress";
import { ONBOARDING_STEPS, isFirstRun } from "@/lib/onboarding";

export const metadata: Metadata = { title: "Welcome" };

export default async function WelcomePage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);
  const firstRun = isFirstRun(data.attempts.length);
  const displayName = data.profile?.display_name || user.email?.split("@")[0] || "there";

  return (
    <div className="app-container page-section">
      <section className="mx-auto max-w-3xl">
        <Badge variant="secondary" className="w-fit font-mono uppercase tracking-[0.08em]">
          {firstRun ? "Welcome to Database Monster" : "How Database Monster works"}
        </Badge>
        <h1 className="font-heading page-title mt-4">
          {firstRun ? `Welcome, ${displayName}. Here's the plan.` : `The exam-prep loop, ${displayName}.`}
        </h1>
        <p className="page-copy mt-3">
          Database Monster turns one simple loop into a passing score: take a diagnostic, repair
          your weak topics, review your mistakes with spaced repetition, and prove it under timed
          pressure. It takes about two minutes to start.
        </p>

        <ol className="mt-8 grid gap-4">
          {ONBOARDING_STEPS.map((step, index) => (
            <li key={step.title}>
              <Card>
                <CardHeader className="flex flex-row items-start gap-4">
                  <span
                    aria-hidden
                    className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-sm font-semibold text-primary-foreground"
                  >
                    {index + 1}
                  </span>
                  <div className="grid gap-1">
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                    <CardDescription>{step.detail}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ol>

        <Card className="mt-8 bg-card/90">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">Start here</Badge>
            <CardTitle className="text-2xl tracking-[-0.03em]">
              {firstRun ? "Take the diagnostic to build your baseline." : "Jump back into your plan."}
            </CardTitle>
            <CardDescription>
              The diagnostic is untimed and seeds your weak-topic map and mistake notebook. After it,
              your dashboard and roadmap always point to the next useful move.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/exam?mode=diagnostic">Start the diagnostic</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/roadmap">See the full roadmap</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
