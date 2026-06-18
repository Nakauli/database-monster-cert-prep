"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyPanel, PageHeader, StatGrid } from "@/components/DesignSystem";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProgress, resetProgress } from "@/lib/storage";
import type { ProgressData } from "@/lib/types";

export function MistakesClient() {
  const [progress, setProgress] = useState<ProgressData>({ attempts: [], mistakes: [] });
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const timer = window.setTimeout(() => setProgress(getProgress()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const topics = [...new Set(progress.mistakes.map((mistake) => mistake.topic))].sort();
  const visible = filter === "all" ? progress.mistakes : progress.mistakes.filter((mistake) => mistake.topic === filter);
  const repeated = useMemo(() => progress.mistakes.filter((mistake) => mistake.misses > 1).length, [progress]);

  function clear() {
    resetProgress();
    setProgress({ attempts: [], mistakes: [] });
    setFilter("all");
  }

  return (
    <div className="app-container page-section">
      <PageHeader
        label="Mistake notebook"
        title="Your wrong answers are the highest-value study material."
        description="This notebook is generated from attempts stored only in your browser. Repair repeated misses before another timed exam."
        actions={<Button asChild variant="outline"><Link href="/exam?mode=diagnostic">Start diagnostic</Link></Button>}
      />

      <div className="mt-8">
        <StatGrid
          columns={3}
          stats={[
            { value: progress.mistakes.length, label: "unique mistakes" },
            { value: repeated, label: "missed more than once" },
            { value: progress.attempts.length, label: "saved attempts" },
          ]}
        />
      </div>

      <Card className="mt-6">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Reset progress</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset local progress?</AlertDialogTitle>
                <AlertDialogDescription>This removes saved attempts and mistakes from this browser only.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clear}>Reset progress</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {!visible.length ? (
        <div className="mt-6">
          <EmptyPanel
            actionLabel="Start diagnostic"
            description="Take the diagnostic to identify the topics that deserve your time."
            href="/exam?mode=diagnostic"
            title="No saved mistakes yet."
          />
        </div>
      ) : (
        <section className="mt-6 grid gap-4">
          {visible.map((mistake) => (
            <Card key={mistake.questionId}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge variant="secondary">{mistake.topic}</Badge>
                  <Badge variant="outline">Missed {mistake.misses}x</Badge>
                </div>
                <CardTitle className="text-2xl">{mistake.question}</CardTitle>
                <CardDescription>Latest miss: {new Date(mistake.lastMissedAt).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4"><span className="mono-label">Your latest answer</span><strong className="mt-1 block">{mistake.selectedAnswers.join(", ") || "Unanswered"}</strong></div>
                  <div className="rounded-xl border border-primary/30 bg-accent/55 p-4"><span className="mono-label">Correct answer</span><strong className="mt-1 block">{mistake.correctAnswers.join(", ")}</strong></div>
                </div>
                <Alert>
                  <AlertTitle>Rule to remember</AlertTitle>
                  <AlertDescription>{mistake.explanation}</AlertDescription>
                </Alert>
                {mistake.reviewFile && <p className="text-sm text-muted-foreground">Review: <code>{mistake.reviewFile}</code></p>}
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
