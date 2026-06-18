"use client";

import { useMemo, useState } from "react";
import { CodeBlock } from "@/components/DataDisplay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { checkSqlPatterns, type SqlExpectedPattern } from "@/lib/sql-patterns";

export function CodeAnswerWorkspace({
  title = "Type your SQL first",
  prompt,
  starter,
  answer,
  expectedPatterns,
  rubric,
}: {
  title?: string;
  prompt: string;
  starter: string;
  answer: string;
  expectedPatterns: SqlExpectedPattern[];
  rubric: string[];
}) {
  const [sql, setSql] = useState(starter);
  const [checked, setChecked] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const result = useMemo(() => checkSqlPatterns(sql, expectedPatterns), [expectedPatterns, sql]);

  return (
    <Card className="border-primary/20 bg-card/95 shadow-[0_18px_60px_rgb(23_37_44_/_0.08)]">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex max-w-2xl flex-col gap-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{prompt}</CardDescription>
          </div>
          {checked && <Badge variant={result.score >= 80 ? "default" : "secondary"}>{result.score}% pattern match</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Textarea
          aria-label="SQL answer"
          className="min-h-52 resize-y font-mono text-sm leading-6"
          spellCheck={false}
          value={sql}
          onChange={(event) => {
            setSql(event.target.value);
            setChecked(false);
          }}
        />
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={() => setChecked(true)}>
            Check patterns
          </Button>
          <Button type="button" variant="outline" onClick={() => setSql(starter)}>
            Reset starter
          </Button>
          <Button type="button" variant="ghost" onClick={() => setShowAnswer((value) => !value)} aria-expanded={showAnswer}>
            {showAnswer ? "Hide answer" : "Reveal answer"}
          </Button>
        </div>

        {checked && (
          <div className="answer-reveal flex flex-col gap-4 rounded-xl border bg-muted/35 p-4" role="status">
            <div className="flex items-center gap-3">
              <Progress className="h-2" value={result.score} />
              <span className="font-mono text-sm font-semibold text-ink">{result.score}%</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Matched</p>
                <div className="flex flex-wrap gap-2">
                  {result.matched.length ? result.matched.map((item) => <Badge key={item.id}>{item.label}</Badge>) : <span className="text-sm text-muted-foreground">No patterns matched yet.</span>}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Still missing</p>
                <div className="flex flex-wrap gap-2">
                  {result.missing.length ? result.missing.map((item) => <Badge key={item.id} variant="outline">{item.label}</Badge>) : <span className="text-sm text-muted-foreground">All required patterns are present.</span>}
                </div>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">Rubric</p>
              <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                {rubric.map((item) => <li className="rounded-lg bg-background p-3" key={item}>{item}</li>)}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">Pattern check only. This site does not execute SQL.</p>
            </div>
          </div>
        )}

        {showAnswer && (
          <div className="answer-reveal">
            <CodeBlock code={answer} label="Answer key" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
