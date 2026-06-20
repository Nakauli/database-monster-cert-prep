"use client";

import Link from "next/link";
import { useState } from "react";
import { EmptyPanel } from "@/components/DesignSystem";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hrefForReviewFile } from "@/lib/learn";
import type { MistakeRow } from "@/lib/progress";
import type { ReviewGrade } from "@/lib/srs";

const GRADES: Array<{ grade: ReviewGrade; label: string; variant: "outline" | "secondary" | "default" }> = [
  { grade: "again", label: "Again", variant: "outline" },
  { grade: "hard", label: "Hard", variant: "secondary" },
  { grade: "good", label: "Good", variant: "default" },
  { grade: "easy", label: "Easy", variant: "outline" },
];

function describeNext(intervalDays: number): string {
  if (intervalDays <= 0) return "due again today";
  if (intervalDays === 1) return "due tomorrow";
  return `due in ${intervalDays} days`;
}

export function FlashcardReview({
  mistakes,
  onGrade,
}: {
  mistakes: MistakeRow[];
  onGrade: (id: string, grade: ReviewGrade) => Promise<number | null>;
}) {
  const [queue, setQueue] = useState<MistakeRow[]>(() => [...mistakes]);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [grading, setGrading] = useState(false);
  const card = queue[0];

  async function grade(value: ReviewGrade) {
    if (!card) return;
    setGrading(true);
    const intervalDays = await onGrade(card.id, value);
    setGrading(false);
    if (intervalDays === null) return;
    setReviewed((current) => current + 1);
    setFlipped(false);
    // 'again' keeps the card in this session (requeue at the end); otherwise it leaves the queue.
    setQueue((current) =>
      value === "again" && current.length > 1 ? [...current.slice(1), current[0]] : current.slice(1),
    );
  }

  if (!card) {
    return (
      <EmptyPanel
        description={`You reviewed ${reviewed} card${reviewed === 1 ? "" : "s"}. Come back when more are due.`}
        title="Review session complete."
      />
    );
  }

  const snapshot = card.question_snapshot as { question?: string; reviewFile?: string };
  const learnHref = hrefForReviewFile(snapshot.reviewFile);

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{queue.length} due</Badge>
          <Badge variant="outline">{reviewed} reviewed</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Most-overdue questions appear first.</p>
      </div>

      <Card
        className="flashcard-panel min-h-80 cursor-pointer transition hover:-translate-y-0.5 hover:shadow-[0_18px_60px_rgb(23_37_44_/_0.09)]"
        onClick={() => setFlipped((value) => !value)}
      >
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{card.topic}</Badge>
            <Badge variant="outline">{describeNext(card.interval_days)}</Badge>
          </div>
          <CardDescription>{flipped ? "Answer side" : "Question side"}</CardDescription>
          <span className="mono-label">Question</span>
          <CardTitle className="text-2xl leading-tight">{snapshot.question ?? `Question ${card.question_id}`}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {flipped ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                  <span className="mono-label">Your latest answer</span>
                  <strong className="mt-1 block">{card.selected_answers.join(", ") || "Unanswered"}</strong>
                </div>
                <div className="rounded-xl border border-primary/30 bg-accent/55 p-4">
                  <span className="mono-label">Correct answer</span>
                  <strong className="mt-1 block">{card.correct_answers.join(", ")}</strong>
                </div>
              </div>
              <Alert>
                <AlertTitle>Rule to remember</AlertTitle>
                <AlertDescription>{card.explanation ?? "Review the correct answer and try this topic again."}</AlertDescription>
              </Alert>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Answer it in your head first, then tap the card to reveal the answer and grade how well you knew it.
            </p>
          )}
        </CardContent>
      </Card>

      {flipped && (
        <div className="grid gap-3 sm:grid-cols-5" onClick={(event) => event.stopPropagation()}>
          {GRADES.map(({ grade: value, label, variant }) => (
            <Button key={value} type="button" variant={variant} disabled={grading} onClick={() => void grade(value)}>
              {label}
            </Button>
          ))}
          <Button asChild variant="ghost">
            <Link href={learnHref ?? "/learn"}>Read lesson</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
