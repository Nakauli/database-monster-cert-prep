import Link from "next/link";
import { CodeBlock } from "@/components/DataDisplay";
import { InfoCard, PageHeader, SectionHeader, StatGrid } from "@/components/DesignSystem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const modes = [
  { title: "Diagnostic", detail: "40 balanced questions, 50 minutes", href: "/exam?mode=diagnostic", label: "Start diagnostic" },
  { title: "Timed Exam", detail: "40 randomized questions, 50 minutes", href: "/exam?mode=timed", label: "Start timed exam" },
  { title: "Final Boss", detail: "45 hard questions for proof of readiness", href: "/exam?mode=final", label: "Start final boss" },
];

export function HomeDashboard() {
  return (
    <div>
      <section className="app-container page-section">
        <PageHeader
          label="Certification simulator"
          title="Practice like the exam is already open."
          description="Timed sessions, readable SQL, typed drills, and a private mistake notebook backed by Supabase Row Level Security."
          actions={
            <>
              <Button asChild size="lg"><Link href="/register">Create account</Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/login">Sign in</Link></Button>
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
                code={`SELECT topic, mastery_score\nFROM user_topic_progress\nWHERE mastery_score < 80\nORDER BY mastery_score ASC;`}
              />
            </CardContent>
          </Card>
          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <Badge className="w-fit bg-primary-foreground text-primary">Private by architecture</Badge>
              <CardTitle className="text-3xl tracking-[-0.04em]">
                Your weak topics are not a class leaderboard.
              </CardTitle>
              <CardDescription className="text-primary-foreground/75">
                Every authenticated user can access only their own attempts, topic mastery, profile, and mistake notebook.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary"><Link href="/register">Build your baseline</Link></Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="app-container page-section pt-0">
        <StatGrid
          stats={[
            { value: "360", label: "original questions" },
            { value: "200+", label: "code examples" },
            { value: "12", label: "tracked topic areas" },
            { value: "RLS", label: "private progress storage" },
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
            description="Labs and topic practice ask you to write SQL before checking patterns or revealing the answer."
            action={<Button asChild><Link href="/labs">Open SQL labs</Link></Button>}
          />
          <InfoCard
            title="Readable where it matters."
            description="Questions use a calm body font while SQL, schemas, columns, errors, and result grids use a dedicated monospace."
            action={<Button asChild variant="outline"><Link href="/about">How it works</Link></Button>}
          />
        </div>
      </section>
    </div>
  );
}
