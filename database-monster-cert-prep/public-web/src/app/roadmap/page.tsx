import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader, SectionHeader } from "@/components/DesignSystem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export const metadata: Metadata = { title: "Study Roadmap" };

const plans = [
  {
    id: "48-hour",
    title: "Emergency 48-hour plan",
    summary: "Triage the highest-value concepts, repair the diagnostic, and prove an 80%+ baseline.",
    days: [
      ["First 4 hours", "Diagnostic exam; keys, relationships, NULL, and normalization.", "80% concept checkpoint"],
      ["Hours 5-12", "SELECT, filtering, joins, grouping; complete Labs 1-4.", "8/10 fresh queries correct"],
      ["Hours 13-24", "Repair every diagnostic miss and run two panic reviews.", "80% mixed quiz"],
      ["Hours 25-36", "Subqueries, DDL/DML, transactions, triggers, security.", "80% focused quiz"],
      ["Hours 37-48", "Timed exam, weakest-two repair cycle, Final Boss.", "85% target; 80% minimum"],
    ],
  },
  {
    id: "7-day",
    title: "7-day cram plan",
    summary: "One major topic block each day, with a lab, quiz, and mandatory mistake repair.",
    days: [
      ["Day 1", "Core concepts, keys, relationships", "80% concept quiz"],
      ["Day 2", "ERD and normalization", "Normalize one design to 3NF"],
      ["Day 3", "SELECT, filtering, sorting, NULL", "18/20 fundamentals"],
      ["Day 4", "Joins and aggregation", "Explain every row multiplication"],
      ["Day 5", "Subqueries, views, DDL, indexes", "80% mixed quiz"],
      ["Day 6", "DML, transactions, procedures, triggers, security", "80% safety quiz"],
      ["Day 7", "Timed exam, repair, Final Boss", "85% final simulation"],
    ],
  },
  {
    id: "14-day",
    title: "14-day mastery plan",
    summary: "Slower repetition, deeper labs, and two separate proof-of-readiness exam scores.",
    days: [
      ["Days 1-2", "Diagnostic, vocabulary, keys, ERDs", "80% foundations"],
      ["Days 3-4", "1NF, 2NF, 3NF, BCNF basics", "Dependency drills"],
      ["Days 5-6", "SELECT, predicates, NULL, sorting", "85% SQL basics"],
      ["Days 7-8", "Joins, aggregation, HAVING", "85% query reasoning"],
      ["Days 9-10", "Subqueries, views, DDL, indexes", "Complete Labs 5-6"],
      ["Days 11-12", "DML, transactions, procedures, triggers", "Complete Labs 7-8"],
      ["Days 13-14", "Security, troubleshooting, two timed exams", "85% twice"],
    ],
  },
];

const checklist = [
  "DBMS/RDBMS, schema/instance, data types, and NULL",
  "Candidate, primary, foreign, composite, and surrogate keys",
  "ERD cardinality, optionality, and junction tables",
  "1NF, 2NF, 3NF, BCNF basics, and anomalies",
  "SELECT, filtering, sorting, LIMIT/TOP, and aliases",
  "INNER, LEFT, RIGHT, FULL, CROSS, and SELF joins",
  "Aggregation, GROUP BY, HAVING, and NULL behavior",
  "Subqueries, EXISTS, UNION, CASE, CTEs, and views",
  "DDL, constraints, referential actions, and indexes",
  "DML, ACID transactions, savepoints, and safe updates",
  "Procedures, functions, triggers, and cross-platform syntax",
  "Roles, least privilege, injection, backup, and troubleshooting",
];

export default function RoadmapPage() {
  return (
    <div className="app-container page-section">
      <PageHeader
        label="Study roadmap"
        title="Use a plan that matches the time you actually have."
        description="Every checkpoint is pass/fail. If you miss it, study one worked example, solve three fresh examples, then retake a focused quiz."
        actions={
          <>
            <Button asChild><Link href="/exam?mode=diagnostic">Build baseline</Link></Button>
            <Button asChild variant="outline"><Link href="/labs">Open labs</Link></Button>
          </>
        }
      />

      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Study plans">
        {plans.map((plan) => <Button asChild key={plan.id} size="sm" variant="outline"><a href={`#${plan.id}`}>{plan.title}</a></Button>)}
      </nav>

      <div className="mt-6 grid gap-5">
        {plans.map((plan) => (
          <Card className="scroll-mt-24" id={plan.id} key={plan.id}>
            <CardHeader>
              <Badge className="w-fit" variant="secondary">Training plan</Badge>
              <CardTitle className="text-3xl tracking-[-0.04em]">{plan.title}</CardTitle>
              <CardDescription>{plan.summary}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {plan.days.map(([day, work, checkpoint]) => (
                <div className="grid gap-2 rounded-xl border bg-muted/25 p-4 lg:grid-cols-[9rem_1fr_13rem] lg:items-center" key={day}>
                  <strong className="text-ink">{day}</strong>
                  <span className="text-sm text-muted-foreground">{work}</span>
                  <Badge variant="outline">{checkpoint}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-8">
        <SectionHeader title="Mastery checklist" description="Can you explain it and solve a fresh problem without looking at the notes?" />
        <Card className="mt-5">
          <CardContent className="grid gap-3 md:grid-cols-2">
            {checklist.map((item) => (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-muted/25 p-4 text-sm" key={item}>
                <Checkbox />
                <span>{item}</span>
              </label>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
