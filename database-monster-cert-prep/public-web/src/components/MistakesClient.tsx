"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyPanel, PageHeader, StatGrid } from "@/components/DesignSystem";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MistakeRow } from "@/lib/progress";
import { createClient } from "@/lib/supabase/client";

export function MistakesClient({ initialMistakes }: { initialMistakes: MistakeRow[] }) {
  const [mistakes, setMistakes] = useState(initialMistakes);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState<string | null>(null);

  const topics = [...new Set(mistakes.map((mistake) => mistake.topic))].sort();
  const visible = filter === "all" ? mistakes : mistakes.filter((mistake) => mistake.topic === filter);
  const repeated = useMemo(() => mistakes.filter((mistake) => mistake.mistake_count > 1).length, [mistakes]);

  async function removeMistake(id: string) {
    const supabase = createClient();
    if (!supabase) {
      setMessage("Account storage is not configured.");
      return;
    }
    const { error } = await supabase.from("mistake_notebook").delete().eq("id", id);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMistakes((current) => current.filter((mistake) => mistake.id !== id));
    setMessage("Mistake marked as mastered and removed.");
  }

  return (
    <div className="app-container page-section">
      <PageHeader
        label="Private mistake notebook"
        title="Your wrong answers are the highest-value study material."
        description="Only your authenticated account can read or update these rows. Repeated misses rise to the top."
        actions={
          mistakes.length ? (
            <Button asChild><Link href="/exam?mode=mistakes">Practice mistakes only</Link></Button>
          ) : (
            <Button asChild variant="outline"><Link href="/exam?mode=diagnostic">Start diagnostic</Link></Button>
          )
        }
      />

      <div className="mt-8">
        <StatGrid
          columns={3}
          stats={[
            { value: mistakes.length, label: "unique mistakes" },
            { value: repeated, label: "missed more than once" },
            { value: topics.length, label: "topics needing repair" },
          ]}
        />
      </div>

      <Card className="mt-6">
        <CardContent>
          <Field className="sm:max-w-xs">
            <FieldLabel>Filter by topic</FieldLabel>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All topics</SelectItem>
                  {topics.map((topic) => <SelectItem key={topic} value={topic}>{topic}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      {message && (
        <Alert className="mt-5" role="status">
          <AlertTitle>Notebook update</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {!visible.length ? (
        <div className="mt-6">
          <EmptyPanel
            actionLabel="Start diagnostic"
            description="Take the diagnostic to identify the topics that deserve your time."
            href="/exam?mode=diagnostic"
            title="No saved mistakes in this view."
          />
        </div>
      ) : (
        <section className="exam-readable mt-6 grid gap-4">
          {visible.map((mistake) => {
            const snapshot = mistake.question_snapshot as { question?: string; reviewFile?: string };
            return (
              <Card key={mistake.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Badge variant="secondary">{mistake.topic}</Badge>
                    <Badge variant="outline">Missed {mistake.mistake_count}x</Badge>
                  </div>
                  <CardTitle className="text-2xl">{snapshot.question ?? `Question ${mistake.question_id}`}</CardTitle>
                  <CardDescription>Latest miss: {new Date(mistake.last_mistaken_at).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                      <span className="mono-label">Your latest answer</span>
                      <strong className="mt-1 block">{mistake.selected_answers.join(", ") || "Unanswered"}</strong>
                    </div>
                    <div className="rounded-xl border border-primary/30 bg-accent/55 p-4">
                      <span className="mono-label">Correct answer</span>
                      <strong className="mt-1 block">{mistake.correct_answers.join(", ")}</strong>
                    </div>
                  </div>
                  <Alert>
                    <AlertTitle>Rule to remember</AlertTitle>
                    <AlertDescription>{mistake.explanation}</AlertDescription>
                  </Alert>
                  {snapshot.reviewFile && <p className="text-sm text-muted-foreground">Review: <code>{snapshot.reviewFile}</code></p>}
                  <div>
                    <Button type="button" variant="outline" onClick={() => void removeMistake(mistake.id)}>
                      Mark as mastered
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}
