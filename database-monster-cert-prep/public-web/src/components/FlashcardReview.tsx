"use client";

import Link from "next/link";
import { CheckCircle, RotateCcw } from "lucide-react";
import { useState } from "react";
import { EmptyPanel } from "@/components/DesignSystem";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hrefForReviewFile } from "@/lib/learn";
import type { MistakeRow } from "@/lib/progress";

export function FlashcardReview({
  mistakes,
  onResolve,
}: {
  mistakes: MistakeRow[];
  onResolve: (id: string) => Promise<boolean>;
}) {
  const [queue, setQueue] = useState<MistakeRow[]>(() => [...mistakes].sort((a, b) => b.mistake_count - a.mistake_count));
  const [flipped, setFlipped] = useState(false);
  const [mastered, setMastered] = useState(0);
  const [resolving, setResolving] = useState(false);
  const card = queue[0];

  function moveNext(nextQueue: MistakeRow[]) {
    setFlipped(false);
    setQueue(nextQueue);
  }

  function again() {
    if (queue.length < 2) {
      setFlipped(false);
      return;
    }
    moveNext([...queue.slice(1), queue[0]]);
  }

  function hard() {
    if (queue.length < 3) {
      setFlipped(false);
      return;
    }
    const [head, ...rest] = queue;
    moveNext([rest[0], head, ...rest.slice(1)]);
  }

  async function gotIt() {
    if (!card) return;
    setResolving(true);
    const removed = await onResolve(card.id);
    setResolving(false);
    if (!removed) return;
    setMastered((current) => current + 1);
    moveNext(queue.slice(1));
  }

  if (!card) {
    return (
      <EmptyPanel
        description={`You cleared ${mastered} card${mastered === 1 ? "" : "s"} this round. Mastered cards were removed from the notebook.`}
        title="Flashcard session complete."
      />
    );
  }

  const snapshot = card.question_snapshot as { question?: string; reviewFile?: string };
  const learnHref = hrefForReviewFile(snapshot.reviewFile);

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{queue.length} remaining</Badge>
          <Badge variant="outline">{mastered} mastered</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Most-missed questions appear first.</p>
      </div>

      <Card className="flashcard-panel min-h-80 cursor-pointer transition hover:-translate-y-0.5 hover:shadow-[0_18px_60px_rgb(23_37_44_/_0.09)]" onClick={() => setFlipped((value) => !value)}>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{card.topic}</Badge>
            <Badge variant="outline">Missed {card.mistake_count}x</Badge>
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
              Answer it in your head first, then tap the card to reveal the answer and decide whether to repeat it.
            </p>
          )}
        </CardContent>
      </Card>

      {flipped && (
        <div className="grid gap-3 sm:grid-cols-4" onClick={(event) => event.stopPropagation()}>
          <Button type="button" variant="outline" onClick={again}>
            <RotateCcw data-icon="inline-start" />
            Again
          </Button>
          <Button type="button" variant="secondary" onClick={hard}>
            Hard
          </Button>
          <Button asChild variant="outline"><Link href={learnHref ?? "/learn"}>Read lesson</Link></Button>
          <Button type="button" onClick={() => void gotIt()} disabled={resolving}>
            <CheckCircle data-icon="inline-start" />
            {resolving ? "Removing..." : "Got it"}
          </Button>
        </div>
      )}
    </section>
  );
}
