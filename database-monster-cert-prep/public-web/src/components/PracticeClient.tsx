"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CodeAnswerWorkspace } from "@/components/CodeAnswerWorkspace";
import { PageHeader, SectionHeader } from "@/components/DesignSystem";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { difficulties, topics } from "@/lib/questions";
import type { SqlExpectedPattern } from "@/lib/sql-patterns";

const topicPatterns: Record<string, { prompt: string; starter: string; answer: string; expectedPatterns: SqlExpectedPattern[]; rubric: string[] }> = {
  SQL: {
    prompt: "Write a query that lists active students alphabetically.",
    starter: "SELECT student_id, full_name\nFROM students\nWHERE status = 'active'\nORDER BY full_name;",
    answer: "SELECT student_id, full_name\nFROM students\nWHERE status = 'active'\nORDER BY full_name ASC;",
    expectedPatterns: [
      { id: "select", label: "SELECT columns", pattern: "\\bselect\\b[\\s\\S]*full_name" },
      { id: "from", label: "FROM students", pattern: "\\bfrom\\s+students\\b" },
      { id: "where", label: "Filter active", pattern: "status\\s*=\\s*'active'" },
      { id: "order", label: "ORDER BY name", pattern: "\\border\\s+by\\s+full_name\\b" },
    ],
    rubric: ["Returns only active students.", "Selects readable student columns.", "Sorts by a stable name column."],
  },
  Joins: {
    prompt: "Write a query that keeps all students even when they have no enrollment.",
    starter: "SELECT s.full_name, e.grade\nFROM students AS s\nLEFT JOIN enrollments AS e\n  ON e.student_id = s.student_id;",
    answer: "SELECT s.full_name, e.grade\nFROM students AS s\nLEFT JOIN enrollments AS e\n  ON e.student_id = s.student_id;",
    expectedPatterns: [
      { id: "students", label: "FROM students", pattern: "\\bfrom\\s+students\\b" },
      { id: "left", label: "LEFT JOIN enrollments", pattern: "\\bleft\\s+join\\s+enrollments\\b" },
      { id: "key", label: "Join student_id", pattern: "student_id\\s*=\\s*.*student_id" },
    ],
    rubric: ["Uses LEFT JOIN for unmatched rows.", "Joins on student_id.", "Selects fields from both table aliases."],
  },
  Aggregation: {
    prompt: "Write a query that counts enrollments per course and keeps courses with at least two enrollments.",
    starter: "SELECT course_id, COUNT(*) AS enrollment_count\nFROM enrollments\nGROUP BY course_id\nHAVING COUNT(*) >= 2;",
    answer: "SELECT course_id, COUNT(*) AS enrollment_count\nFROM enrollments\nGROUP BY course_id\nHAVING COUNT(*) >= 2;",
    expectedPatterns: [
      { id: "count", label: "COUNT", pattern: "\\bcount\\s*\\(" },
      { id: "group", label: "GROUP BY course", pattern: "\\bgroup\\s+by\\s+course_id\\b" },
      { id: "having", label: "HAVING count", pattern: "\\bhaving\\b[\\s\\S]*count\\s*\\(" },
    ],
    rubric: ["Groups at the course level.", "Counts rows per group.", "Uses HAVING for aggregate filters."],
  },
};

const fallbackDrill = {
  prompt: "Write a short SQL statement using the main command for this topic.",
  starter: "SELECT column_name\nFROM table_name\nWHERE condition;",
  answer: "SELECT column_name\nFROM table_name\nWHERE condition;",
  expectedPatterns: [
    { id: "select", label: "Use SELECT", pattern: "\\bselect\\b" },
    { id: "from", label: "Use FROM", pattern: "\\bfrom\\b" },
    { id: "where", label: "Use a condition", pattern: "\\bwhere\\b" },
  ],
  rubric: ["Uses the right command family.", "Names the source table.", "Includes a meaningful condition or clause."],
};

export function PracticeClient() {
  const router = useRouter();
  const [topic, setTopic] = useState(topics[0]);
  const [difficulty, setDifficulty] = useState("all");
  const [count, setCount] = useState("15");
  const drill = useMemo(() => topicPatterns[topic] ?? fallbackDrill, [topic]);

  function start() {
    const params = new URLSearchParams({ mode: "practice", topic, difficulty, count });
    router.push(`/exam?${params.toString()}`);
  }

  return (
    <div className="app-container page-section">
      <PageHeader
        label="Focused practice"
        title="Choose one weakness. Train it directly."
        description="Practice is untimed. Use the typed SQL drill first, then start a question set when the pattern feels familiar."
      />

      <Card className="mt-8">
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
        <SectionHeader title="Syntax warmup" description="Type the query, check key patterns, then decide whether you are ready for the quiz." />
        <div className="mt-5">
          <CodeAnswerWorkspace
            answer={drill.answer}
            expectedPatterns={drill.expectedPatterns}
            prompt={drill.prompt}
            rubric={drill.rubric}
            starter={drill.starter}
            title={`${topic} drill`}
          />
        </div>
      </section>

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
