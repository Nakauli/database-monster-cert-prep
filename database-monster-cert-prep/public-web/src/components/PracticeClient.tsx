"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader, SectionHeader } from "@/components/DesignSystem";
import { SqlSandbox } from "@/components/SqlSandbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sqlChallenges } from "@/data/sql-questions";
import { secondaryNavigation } from "@/lib/navigation";
import { getPracticeDrill } from "@/lib/practice-drills";
import { difficulties, topics } from "@/lib/questions";

export function PracticeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTopic = searchParams.get("topic");
  const [topic, setTopic] = useState(() => requestedTopic && topics.includes(requestedTopic) ? requestedTopic : topics[0]);
  const [difficulty, setDifficulty] = useState("all");
  const [count, setCount] = useState("15");
  const [selectedChallengeId, setSelectedChallengeId] = useState(sqlChallenges[0]?.id ?? "");
  const drill = useMemo(() => getPracticeDrill(topic), [topic]);
  const visibleChallenges = useMemo(
    () => sqlChallenges.filter((challenge) => challenge.topic === topic),
    [topic],
  );
  const selectedChallenge = visibleChallenges.find((challenge) => challenge.id === selectedChallengeId) ?? visibleChallenges[0];
  const advancedQueryHint =
    topic === "Advanced Queries"
      ? ["For the scalar subquery, put `SELECT AVG(grade) FROM enrollments` inside the parentheses."]
      : [];

  function start() {
    const params = new URLSearchParams({ mode: "practice", topic, difficulty, count });
    router.push(`/exam?${params.toString()}`);
  }

  return (
    <div className="app-container page-section">
      <PageHeader
        label="Practice hub"
        title="Train one skill before you take another exam."
        description="Use this page after the diagnostic points to a weak topic. Warm up with typed SQL, then start an untimed question set."
        actions={
          <>
            <Button asChild><a href="#topic-practice">Topic practice</a></Button>
            <Button asChild variant="outline"><a href="#sql-labs">SQL labs</a></Button>
          </>
        }
      />

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <Card id="topic-practice">
          <CardContent className="grid gap-3">
            <span className="mono-label">Primary training mode</span>
            <h2 className="font-heading text-2xl font-semibold tracking-[-0.03em] text-ink">Topic practice</h2>
            <p className="text-sm text-muted-foreground">Pick the exact topic your diagnostic exposed, then answer an untimed set with explanations.</p>
          </CardContent>
        </Card>
        <Card id="sql-labs">
          <CardContent className="grid gap-3">
            <span className="mono-label">Hands-on syntax</span>
            <h2 className="font-heading text-2xl font-semibold tracking-[-0.03em] text-ink">SQL Labs</h2>
            <p className="text-sm text-muted-foreground">{secondaryNavigation.find((item) => item.href === "/labs")?.description}</p>
            <Button asChild className="w-fit" variant="outline"><a href="/labs">Open SQL labs</a></Button>
          </CardContent>
        </Card>
      </section>

      <Card className="mt-8 scroll-mt-24">
        <CardContent>
          <FieldGroup className="grid gap-4 pt-1 lg:grid-cols-[1.4fr_1fr_0.8fr_auto] lg:items-end">
            <Field>
              <FieldLabel>Topic</FieldLabel>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {topics.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Difficulty</FieldLabel>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All difficulties</SelectItem>
                    {difficulties.map((item) => <SelectItem value={item} key={item}>{item}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Question count</FieldLabel>
              <Select value={count} onValueChange={setCount}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="10">10 questions</SelectItem>
                    <SelectItem value="15">15 questions</SelectItem>
                    <SelectItem value="20">20 questions</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Button className="h-9" type="button" onClick={start}>Start practice</Button>
          </FieldGroup>
        </CardContent>
      </Card>

      <section className="mt-8">
        <SectionHeader
          title="Syntax warmup"
          description={drill
            ? "Type the query with real table and column names, then run it against the seeded database."
            : "This topic is mostly conceptual. Use the quiz for exam-style questions, or open SQL Labs for runnable query practice."}
        />
        {drill ? (
          <div className="mt-5">
            <SqlSandbox
              answer={drill.answer}
              description={drill.prompt}
              expectedPatterns={drill.expectedPatterns}
              expectedSql={drill.expectedSql}
              hints={[
                "Read the available tables and columns first.",
                "Replace every TODO comment with real SQL before you run.",
                ...advancedQueryHint,
              ]}
              placeholderHelp={{
                "select avg(grade) from enrollments":
                  "Replace the subquery hint with SELECT AVG(grade) FROM enrollments, keeping it inside the parentheses.",
              }}
              rubric={drill.rubric}
              schema={drill.schema}
              starter={drill.starter}
              title={drill.title}
            />
          </div>
        ) : (
          <Card className="mt-5">
            <CardContent className="grid gap-3">
              <h3 className="font-heading text-xl font-semibold tracking-[-0.03em] text-ink">No runnable syntax warmup for this topic.</h3>
              <p className="text-sm text-muted-foreground">
                Some certification topics are about rules, definitions, security, or design choices instead of writing a runnable SQL statement.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={start}>Start topic practice</Button>
                <Button asChild variant="outline"><a href="/labs">Open SQL labs</a></Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {visibleChallenges.length > 0 && (
        <section className="mt-8">
          <SectionHeader
            title="Live query challenges"
            description="These are typed SQL reps that run against the seeded dataset. They stay outside the timed exam flow."
          />
          <div className="mt-5 grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <Card className="h-fit">
              <CardContent className="grid gap-2">
                {visibleChallenges.map((challenge) => (
                  <Button
                    className="h-auto justify-start rounded-xl p-3 text-left whitespace-normal"
                    key={challenge.id}
                    onClick={() => setSelectedChallengeId(challenge.id)}
                    type="button"
                    variant={selectedChallenge?.id === challenge.id ? "secondary" : "outline"}
                  >
                    <span className="flex flex-col gap-1">
                      <span className="font-semibold">{challenge.prompt}</span>
                      <span className="text-xs text-muted-foreground">{challenge.difficulty}</span>
                    </span>
                  </Button>
                ))}
              </CardContent>
            </Card>
            {selectedChallenge && (
              <Card key={selectedChallenge.id}>
                <CardContent className="grid gap-5">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      <span>{selectedChallenge.topic}</span>
                      <span>{selectedChallenge.difficulty}</span>
                    </div>
                    <h3 className="text-xl font-semibold tracking-[-0.03em] text-ink">{selectedChallenge.prompt}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">{selectedChallenge.explanation}</p>
                  </div>
                  <SqlSandbox
                    answer={selectedChallenge.expectedSql}
                    description="Write the query, run it, and check whether your result set matches the reference."
                    expectedPatterns={selectedChallenge.expectedPatterns}
                    expectedSql={selectedChallenge.expectedSql}
                    hints={[
                      "Use only the tables and columns shown in the schema.",
                      "Replace every TODO comment with real SQL before you run.",
                      ...(selectedChallenge.id === "sqlw-above-average"
                        ? ["Use `SELECT AVG(grade) FROM enrollments` as the scalar subquery."]
                        : []),
                    ]}
                    placeholderHelp={{
                      "select avg(grade) from enrollments":
                        "Replace the subquery hint with SELECT AVG(grade) FROM enrollments, keeping it inside the parentheses.",
                    }}
                    rubric={selectedChallenge.rubric}
                    schema={selectedChallenge.schema}
                    starter={selectedChallenge.starter}
                    title="Query challenge"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      <section className="mt-8">
        <SectionHeader title="Topic catalog" description="Pick a topic to load its drill and practice-set settings." />
        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {topics.map((item) => (
            <Button className="h-auto justify-start rounded-xl p-4 text-left" key={item} type="button" variant={item === topic ? "secondary" : "outline"} onClick={() => setTopic(item)}>
              <span className="flex flex-col gap-1">
                <span className="font-semibold">{item}</span>
                <span className="text-xs text-muted-foreground">30 questions available</span>
              </span>
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
