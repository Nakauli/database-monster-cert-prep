"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CodeBlock } from "@/components/DataDisplay";
import { InfoCard, PageHeader, SectionHeader, StatGrid } from "@/components/DesignSystem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProgress } from "@/lib/storage";
import type { ProgressData } from "@/lib/types";

const modes = [
  { title: "Diagnostic", detail: "40 balanced questions, 50 minutes", href: "/exam?mode=diagnostic", label: "Start diagnostic" },
  { title: "Timed Exam", detail: "40 randomized questions, 50 minutes", href: "/exam?mode=timed", label: "Start timed exam" },
  { title: "Final Boss", detail: "45 hard questions for proof of readiness", href: "/exam?mode=final", label: "Start final boss" },
];

export function HomeDashboard() {
  const [progress, setProgress] = useState<ProgressData>({ attempts: [], mistakes: [] });

  useEffect(() => {
    const timer = window.setTimeout(() => setProgress(getProgress()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const latest = progress.attempts[0];
  const weakTopic = useMemo(() => {
    const counts = new Map<string, number>();
    progress.mistakes.forEach((mistake) => counts.set(mistake.topic, (counts.get(mistake.topic) ?? 0) + mistake.misses));
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  }, [progress]);

  return (
    <div>
      <section className="app-container page-section">
        <PageHeader
          label="Certification simulator"
          title="Practice like the exam is already open."
          description="Timed sessions, readable SQL, typed drills, and a local mistake notebook for the topics that actually need repair."
          actions={
            <>
              <Button asChild size="lg"><Link href="/exam?mode=diagnostic">Start diagnostic</Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/practice">Practice by topic</Link></Button>
            </>
          }
        />

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <Card className="bg-card/90">
            <CardHeader>
              <CardTitle>Read the data, answer the trap.</CardTitle>
              <CardDescription>Code and tables are treated as the main exam material, not decorative preview blocks.</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock
                label="student_readiness.sql"
                code={`SELECT topic, score\nFROM practice_results\nWHERE score < 80\nORDER BY score ASC;`}
              />
            </CardContent>
          </Card>
          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <Badge className="w-fit bg-primary-foreground text-primary">Next best move</Badge>
              <CardTitle className="text-3xl tracking-[-0.04em]">
                {weakTopic ? `Repair ${weakTopic[0]}` : latest ? "Prove your score twice" : "Build your baseline"}
              </CardTitle>
              <CardDescription className="text-primary-foreground/75">
                {weakTopic
                  ? "Review the misses, then run a focused practice set before another timed exam."
                  : latest
                    ? `Your latest score is ${latest.score}%. Repeat it on a different exam before exam day.`
                    : "Start with the diagnostic so the rest of the site can point you at the right topic."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary">
                <Link href={weakTopic ? "/mistakes" : "/exam?mode=diagnostic"}>{weakTopic ? "Open mistakes" : "Start diagnostic"}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="app-container page-section pt-0">
        <StatGrid
          stats={[
            { value: "360", label: "original questions" },
            { value: "200+", label: "code examples" },
            { value: progress.attempts.length, label: "saved attempts" },
            { value: progress.mistakes.length, label: "mistakes to repair" },
          ]}
        />
      </section>

      <section className="app-container page-section pt-0">
        <SectionHeader
          title="Choose the right pressure."
          description="Each mode has a job. Start broad, train weak topics, then prove readiness under the clock."
          action={<Button asChild variant="ghost"><Link href="/roadmap">Open roadmap</Link></Button>}
        />
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {modes.map((mode) => (
            <InfoCard
              action={<Button asChild variant="outline"><Link href={mode.href}>{mode.label}</Link></Button>}
              description={mode.detail}
              key={mode.title}
              title={mode.title}
            />
          ))}
        </div>
      </section>

      <section className="app-container page-section pt-0">
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard
            title="Typed SQL practice is ready."
            description="Labs and topic practice now ask you to write SQL before checking patterns or revealing the answer."
            action={<Button asChild><Link href="/labs">Open SQL labs</Link></Button>}
          />
          <InfoCard
            title={latest ? `${latest.score}% latest score` : "No saved score yet"}
            description={latest ? "Use the result page to inspect weak topics and repair misses." : "One diagnostic run unlocks useful local progress signals."}
            action={<Button asChild variant="outline"><Link href={latest ? "/results" : "/exam?mode=diagnostic"}>{latest ? "View report" : "Take diagnostic"}</Link></Button>}
          />
        </div>
      </section>
    </div>
  );
}
