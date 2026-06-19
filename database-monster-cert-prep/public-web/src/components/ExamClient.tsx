"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LoadingPanel } from "@/components/DesignSystem";
import { QuestionContent } from "@/components/QuestionContent";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  createExamQuestions,
  examDuration,
  examTitle,
  questions as questionBank,
  shuffle,
} from "@/lib/questions";
import { saveExamResult } from "@/lib/exam-save";
import {
  clearExamDraft,
  loadExamDraft,
  saveExamDraft,
  setLastMode,
} from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { ExamQuestion, ExamResult, TopicStat } from "@/lib/types";

type Phase = "loading" | "exam" | "review";

function exactMatch(left: string[], right: string[]): boolean {
  return [...left].sort().join("\u0000") === [...right].sort().join("\u0000");
}

export function ExamClient({ presetQuestionIds = [] }: { presetQuestionIds?: string[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode") ?? "timed";
  const topic = searchParams.get("topic") ?? undefined;
  const difficulty = searchParams.get("difficulty") ?? undefined;
  const requestedCount = Number(searchParams.get("count")) || undefined;
  const title = examTitle(mode, topic);
  const duration = examDuration(mode);
  const draftKey = [mode, topic ?? "all", difficulty ?? "all", requestedCount ?? "default"].join(":");

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [marked, setMarked] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [secondsLeft, setSecondsLeft] = useState(duration ?? 0);
  const [startedAt, setStartedAt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const draft = loadExamDraft(draftKey);
      if (draft?.questions.length) {
        setQuestions(draft.questions);
        setAnswers(draft.answers);
        setMarked(draft.marked);
        setCurrentIndex(Math.min(draft.currentIndex, draft.questions.length - 1));
        setSecondsLeft(draft.secondsLeft);
        setStartedAt(draft.startedAt);
      } else {
        const selected = presetQuestionIds.length
          ? shuffle(questionBank.filter((question) => presetQuestionIds.includes(question.id)))
              .map((question) => ({ ...question, choices: shuffle(question.choices) }))
          : createExamQuestions(mode, topic, difficulty, requestedCount);
        setQuestions(selected);
        setSecondsLeft(duration ?? 0);
        setStartedAt(Date.now());
      }
      setLastMode(mode);
      setPhase("exam");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [difficulty, draftKey, duration, mode, presetQuestionIds, requestedCount, topic]);

  useEffect(() => {
    if (phase === "loading" || !questions.length || saving) return;
    const timer = window.setTimeout(() => {
      saveExamDraft({
        key: draftKey,
        mode,
        questions,
        answers,
        marked,
        currentIndex,
        secondsLeft,
        startedAt,
        savedAt: Date.now(),
      });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [answers, currentIndex, draftKey, marked, mode, phase, questions, saving, secondsLeft, startedAt]);

  const current = questions[currentIndex];
  const answeredCount = Object.values(answers).filter((answer) => answer.length > 0).length;
  const unanswered = questions.filter((question) => !(answers[question.id]?.length));
  const progress = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const finalizeExam = useCallback(async () => {
    if (!questions.length || saving) return;
    setSaving(true);
    setSaveError(null);

    const topicCounts: Record<string, { correct: number; total: number }> = {};
    const reviews = questions.map((question) => {
      const selectedAnswers = answers[question.id] ?? [];
      const correct = exactMatch(selectedAnswers, question.correctAnswers);
      const topicCount = topicCounts[question.topic] ?? { correct: 0, total: 0 };
      topicCount.total += 1;
      topicCount.correct += correct ? 1 : 0;
      topicCounts[question.topic] = topicCount;
      return { question, selectedAnswers, correct };
    });
    const correct = reviews.filter((review) => review.correct).length;
    const topicStats = Object.fromEntries(
      Object.entries(topicCounts).map(([name, stat]) => [
        name,
        { ...stat, percentage: Math.round((stat.correct / stat.total) * 100) } satisfies TopicStat,
      ]),
    );
    const result: ExamResult = {
      id: "",
      mode,
      title,
      completedAt: new Date().toISOString(),
      durationSeconds: Math.max(0, Math.round((Date.now() - startedAt) / 1000)),
      score: Math.round((correct / questions.length) * 100),
      correct,
      total: questions.length,
      topicStats,
      reviews,
    };

    try {
      const attemptId = await saveExamResult(result);
      clearExamDraft(draftKey);
      router.push(`/results?id=${encodeURIComponent(attemptId)}`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "The result could not be saved.");
      setSaving(false);
    }
  }, [answers, draftKey, mode, questions, router, saving, startedAt, title]);

  useEffect(() => {
    if (phase !== "exam" || duration === null || saving) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          window.setTimeout(() => void finalizeExam(), 0);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [duration, finalizeExam, phase, saving]);

  const toggleAnswer = useCallback((answer: string) => {
    if (!current) return;
    setAnswers((previous) => {
      const selected = previous[current.id] ?? [];
      if (current.type === "multiple-answer") {
        return {
          ...previous,
          [current.id]: selected.includes(answer)
            ? selected.filter((item) => item !== answer)
            : [...selected, answer],
        };
      }
      return { ...previous, [current.id]: [answer] };
    });
  }, [current]);

  const toggleMarked = useCallback(() => {
    if (!current) return;
    setMarked((previous) =>
      previous.includes(current.id)
        ? previous.filter((id) => id !== current.id)
        : [...previous, current.id],
    );
  }, [current]);

  useEffect(() => {
    if (phase !== "exam" || !current) return;

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.closest(".cm-editor"));

      if (isTyping || event.metaKey || event.ctrlKey || event.altKey) return;

      const letter = event.key.toUpperCase();
      if (/^[A-J]$/.test(letter)) {
        const choiceIndex = letter.charCodeAt(0) - 65;
        if (choiceIndex < current.choices.length) {
          event.preventDefault();
          toggleAnswer(current.choices[choiceIndex]);
        }
        return;
      }

      if (event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault();
        if (currentIndex < questions.length - 1) setCurrentIndex((value) => value + 1);
        else setPhase("review");
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (currentIndex > 0) setCurrentIndex((value) => value - 1);
        return;
      }

      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        toggleMarked();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, currentIndex, phase, questions.length, toggleAnswer, toggleMarked]);

  const timerText = useMemo(() => {
    if (duration === null) return "Practice mode";
    return `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;
  }, [duration, secondsLeft]);

  if (phase === "loading") {
    return <div className="app-container page-section"><LoadingPanel label="Preparing your randomized exam" /></div>;
  }

  if (!current) {
    return (
      <main className="page-shell empty-state">
        <p className="eyebrow">Nothing to practice</p>
        <h1>Your mistake notebook is already clear.</h1>
        <button className="button primary" type="button" onClick={() => router.push("/dashboard")}>Return to dashboard</button>
      </main>
    );
  }

  if (phase === "review") {
    return (
      <div className="exam-readable app-container page-section">
        <Card className="bg-card">
          <CardHeader>
            <Badge className="w-fit" variant="secondary">Final review</Badge>
            <CardTitle className="text-4xl tracking-[-0.04em]">Check your work before submitting.</CardTitle>
            <CardDescription>Jump back to anything unanswered or marked before scoring.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-muted/30 p-4"><strong className="text-2xl">{answeredCount}</strong><span className="block text-sm text-muted-foreground">Answered</span></div>
              <div className="rounded-xl border bg-muted/30 p-4"><strong className="text-2xl">{unanswered.length}</strong><span className="block text-sm text-muted-foreground">Unanswered</span></div>
              <div className="rounded-xl border bg-muted/30 p-4"><strong className="text-2xl">{marked.length}</strong><span className="block text-sm text-muted-foreground">Marked</span></div>
            </div>
          </CardContent>
        </Card>
        {unanswered.length > 0 && (
          <Alert className="mt-5" role="alert">
            <AlertTitle>Unanswered questions remain</AlertTitle>
            <AlertDescription>They will be scored as incorrect if you submit now.</AlertDescription>
          </Alert>
        )}
        {saveError && (
          <Alert className="mt-5" variant="destructive" role="alert">
            <AlertTitle>Exam could not be saved</AlertTitle>
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}
        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Question review">
          {questions.map((question, index) => {
            const isAnswered = Boolean(answers[question.id]?.length);
            const isMarked = marked.includes(question.id);
            return (
              <Button
                type="button"
                className={cn("h-auto justify-start rounded-xl border p-4 text-left whitespace-normal", isMarked && "border-warning bg-warning/10")}
                key={question.id}
                onClick={() => { setCurrentIndex(index); setPhase("exam"); }}
                variant={isAnswered ? "secondary" : "outline"}
              >
                <span className="flex flex-col gap-1">
                  <span className="font-semibold">Question {index + 1}</span>
                  <span className="text-xs text-muted-foreground">{isAnswered ? "Answered" : "Unanswered"}{isMarked ? ", marked" : ""}</span>
                  <span className="text-xs text-muted-foreground">{question.topic}</span>
                </span>
              </Button>
            );
          })}
        </section>
        <div className="sticky bottom-4 mt-5 flex flex-col gap-3 rounded-2xl border bg-card/92 p-3 shadow-[0_16px_50px_rgb(23_37_44_/_0.12)] backdrop-blur sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => setPhase("exam")} disabled={saving}>Return to exam</Button>
          <Button type="button" variant="destructive" onClick={() => void finalizeExam()} disabled={saving}>
            {saving ? "Saving securely…" : "Submit and save exam"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-readable">
      <header className="sticky top-16 z-30 border-b bg-background/90 backdrop-blur-xl">
        <div className="app-container flex min-h-24 flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="secondary">{duration === null ? "Untimed practice" : "Timed practice"}</Badge>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-ink">{title}</h1>
          </div>
          <div className={cn("rounded-xl border bg-card px-4 py-3 text-right", duration !== null && secondsLeft <= 300 && "border-destructive bg-destructive/10 text-destructive")}>
            <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{duration === null ? "Mode" : "Time remaining"}</span>
            <strong className="font-mono text-2xl">{timerText}</strong>
          </div>
        </div>
        <Progress className="h-1 rounded-none" value={progress} aria-label={`${Math.round(progress)} percent through exam`} />
      </header>

      <div className="app-container grid gap-5 py-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <Card className="min-w-0">
          <CardContent>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{answeredCount} answered</span>
            </div>
            <QuestionContent question={current} selectedAnswers={answers[current.id] ?? []} onToggleAnswer={toggleAnswer} />
            <div className="mt-5 flex flex-wrap gap-2 rounded-xl border border-dashed bg-muted/25 p-3 text-xs text-muted-foreground" aria-label="Keyboard shortcuts">
              <span><kbd>A</kbd>-<kbd>{String.fromCharCode(64 + current.choices.length)}</kbd> choose</span>
              <span><kbd>←</kbd><kbd>→</kbd> navigate</span>
              <span><kbd>M</kbd> mark</span>
              <span><kbd>Enter</kbd> next</span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-[auto_1fr_auto]">
              <Button type="button" variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentIndex((value) => value - 1)}>Previous</Button>
              <Button className="sm:justify-self-center" type="button" variant={marked.includes(current.id) ? "secondary" : "ghost"} onClick={toggleMarked}>
                {marked.includes(current.id) ? "Marked for review" : "Mark for review"}
              </Button>
              {currentIndex < questions.length - 1 ? (
                <Button type="button" onClick={() => setCurrentIndex((value) => value + 1)}>Next</Button>
              ) : (
                <Button type="button" onClick={() => setPhase("review")}>Review exam</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <aside className="lg:sticky lg:top-44">
          <Card>
            <CardHeader>
              <CardTitle>Question map</CardTitle>
              <CardDescription>Jump, review, and submit from one place.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-5 gap-2">
                {questions.map((question, index) => (
                  <Button
                    type="button"
                    key={question.id}
                    onClick={() => setCurrentIndex(index)}
                    size="icon"
                    variant={index === currentIndex ? "default" : answers[question.id]?.length ? "secondary" : "outline"}
                    className={cn("relative", marked.includes(question.id) && "ring-2 ring-warning")}
                    aria-label={`Question ${index + 1}${answers[question.id]?.length ? ", answered" : ", unanswered"}${marked.includes(question.id) ? ", marked" : ""}`}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
              <Button type="button" variant="outline" onClick={() => setPhase("review")}>Review all</Button>
              <Button type="button" variant="destructive" onClick={() => setPhase("review")}>Review and submit</Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
