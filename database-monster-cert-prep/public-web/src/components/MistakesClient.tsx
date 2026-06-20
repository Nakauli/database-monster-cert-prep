"use client";

import Link from "next/link";
import { NotebookTabs, PanelsTopLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyPanel, PageHeader, StatGrid } from "@/components/DesignSystem";
import { FlashcardReview } from "@/components/FlashcardReview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hrefForReviewFile } from "@/lib/learn";
import type { MistakeRow } from "@/lib/progress";
import { computeNextReview, isDue, type ReviewGrade } from "@/lib/srs";
import { createClient } from "@/lib/supabase/client";

export function MistakesClient({ initialMistakes }: { initialMistakes: MistakeRow[] }) {
  const [mistakes, setMistakes] = useState(initialMistakes);
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<"notebook" | "flashcards">("notebook");
  const [message, setMessage] = useState<string | null>(null);

  const topics = [...new Set(mistakes.map((mistake) => mistake.topic))].sort();
  const visible = filter === "all" ? mistakes : mistakes.filter((mistake) => mistake.topic === filter);
  const repeated = useMemo(() => mistakes.filter((mistake) => mistake.mistake_count > 1).length, [mistakes]);
  const dueMistakes = useMemo(() => {
    const now = new Date();
    return mistakes
      .filter((mistake) => isDue({ nextReviewAt: mistake.next_review_at }, now))
      .sort((a, b) => new Date(a.next_review_at).getTime() - new Date(b.next_review_at).getTime());
  }, [mistakes]);

  async function reviewCard(id: string, grade: ReviewGrade): Promise<number | null> {
    const supabase = createClient();
    if (!supabase) {
      setMessage("Account storage is not configured.");
      return null;
    }
    const { data, error } = await supabase.rpc("review_card", { p_mistake_id: id, p_grade: grade });
    if (error) {
      setMessage(error.message);
      return null;
    }
    const nextReviewAt = typeof data === "string" ? data : new Date().toISOString();
    // Derive the optimistic schedule from the latest state (`current`), not a stale
    // closure, so rapid successive grades stay consistent. The assignment is idempotent,
    // so a double-invoked updater (React StrictMode) yields the same result.
    let nextIntervalDays = 0;
    setMistakes((current) =>
      current.map((mistake) => {
        if (mistake.id !== id) return mistake;
        const local = computeNextReview(
          { ease: mistake.ease, intervalDays: mistake.interval_days, reps: mistake.reps },
          grade,
        );
        nextIntervalDays = local.intervalDays;
        return {
          ...mistake,
          next_review_at: nextReviewAt,
          interval_days: local.intervalDays,
          ease: local.ease,
          reps: local.reps,
          last_reviewed_at: new Date().toISOString(),
        };
      }),
    );
    return nextIntervalDays;
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
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex gap-2">
              <Button type="button" variant={view === "notebook" ? "secondary" : "outline"} onClick={() => setView("notebook")}>
                <NotebookTabs data-icon="inline-start" />
                Notebook
              </Button>
              <Button type="button" variant={view === "flashcards" ? "secondary" : "outline"} onClick={() => setView("flashcards")} disabled={!dueMistakes.length}>
                <PanelsTopLeft data-icon="inline-start" />
                Flashcards
              </Button>
            </div>
            {view === "notebook" && (
              <Field className="sm:min-w-64">
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
            )}
          </div>
        </CardContent>
      </Card>

      {message && (
        <Alert className="mt-5" role="status">
          <AlertTitle>Notebook update</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {view === "flashcards" && dueMistakes.length > 0 ? (
        <div className="mt-6">
          <FlashcardReview mistakes={dueMistakes} onGrade={reviewCard} />
        </div>
      ) : !visible.length ? (
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
            const learnHref = hrefForReviewFile(snapshot.reviewFile);
            return (
              <Card key={mistake.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Badge variant="secondary">{mistake.topic}</Badge>
                    <Badge variant="outline">Missed {mistake.mistake_count}x</Badge>
                  </div>
                  <span className="mono-label">Question</span>
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
                    <AlertDescription>{mistake.explanation ?? "Review the correct answer and try this topic again."}</AlertDescription>
                  </Alert>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="outline" onClick={() => setView("flashcards")}>
                      Review in flashcards
                    </Button>
                    {learnHref && <Button asChild variant="secondary"><Link href={learnHref}>Read lesson</Link></Button>}
                    <Button asChild variant="ghost"><Link href="/practice">Practice this topic</Link></Button>
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
