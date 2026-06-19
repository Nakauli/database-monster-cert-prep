import Link from "next/link";
import { CodeBlock, ResultTable, SchemaDisplay } from "@/components/DataDisplay";
import { SectionHeader, StatGrid } from "@/components/DesignSystem";
import { ProgressRing } from "@/components/ProgressRing";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { hrefForReviewFile } from "@/lib/learn";
import type { ExamResult } from "@/lib/types";

export function ResultsClient({ result }: { result: ExamResult }) {
  const topicRows = Object.entries(result.topicStats).sort((a, b) => a[1].percentage - b[1].percentage);
  const passed = result.score >= 80;
  const examReady = result.score >= 85;
  const weakest = topicRows.slice(0, 3);
  const strongest = [...topicRows].reverse().slice(0, 3);
  const wrong = result.reviews.filter((review) => !review.correct);

  return (
    <div className="exam-readable app-container page-section">
      <Card className="overflow-hidden bg-card">
        <CardHeader>
          <Badge className="w-fit" variant={examReady ? "default" : "secondary"}>{examReady ? "Exam-ready range" : passed ? "Pass range" : "Repair needed"}</Badge>
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex flex-col gap-3">
              <CardTitle className="text-4xl tracking-[-0.045em] sm:text-5xl">
                {examReady ? "Strong score. Prove it twice." : passed ? "Pass range. Make it repeatable." : "Useful data. Repair before retaking."}
              </CardTitle>
              <CardDescription>{result.correct} of {result.total} correct in {Math.floor(result.durationSeconds / 60)} minutes.</CardDescription>
              <div className="flex flex-wrap gap-3">
                <Button asChild><Link href="/exam?mode=timed">Take another exam</Link></Button>
                <Button asChild variant="outline"><Link href="/mistakes">Open mistakes</Link></Button>
                <Button asChild variant="ghost"><Link href="/history">Exam history</Link></Button>
              </div>
            </div>
            <ProgressRing value={result.score} label={passed ? "Pass range" : "Repair first"} size={178} />
          </div>
        </CardHeader>
      </Card>

      <div className="mt-6">
        <StatGrid
          columns={3}
          stats={[
            { value: result.correct, label: "correct answers" },
            { value: wrong.length, label: "mistakes to repair" },
            { value: `${Math.floor(result.durationSeconds / 60)}m`, label: "time used" },
          ]}
        />
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Strongest topics</CardTitle><CardDescription>Keep these warm.</CardDescription></CardHeader>
          <CardContent className="grid gap-3">
            {strongest.map(([topic, stat]) => <TopicScore key={topic} percentage={stat.percentage} topic={topic} />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Weakest topics</CardTitle><CardDescription>Study these next.</CardDescription></CardHeader>
          <CardContent className="grid gap-3">
            {weakest.map(([topic, stat]) => <TopicScore key={topic} percentage={stat.percentage} topic={topic} />)}
          </CardContent>
        </Card>
        <Card className="bg-accent/65">
          <CardHeader>
            <CardTitle>{result.score < 70 ? "Return to labs" : result.score < 85 ? "Targeted repair cycle" : "Prove it twice"}</CardTitle>
            <CardDescription>{result.score < 70 ? "Study the weakest three topics and complete their SQL labs before another full exam." : result.score < 85 ? "Review every miss, then run a focused topic practice set." : "Take a different timed exam and keep every topic at 80% or higher."}</CardDescription>
          </CardHeader>
          <CardContent><Button asChild variant="outline"><Link href="/roadmap">Open roadmap</Link></Button></CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <SectionHeader title="Topic breakdown" description="Sorted from weakest to strongest so your next study block is obvious." />
        <Card className="mt-5">
          <CardContent className="grid gap-3">
            {topicRows.map(([topic, stat]) => (
              <div className="grid gap-2 rounded-xl border bg-muted/25 p-4 sm:grid-cols-[minmax(180px,1fr)_1fr_4rem] sm:items-center" key={topic}>
                <div><strong>{topic}</strong><span className="block text-xs text-muted-foreground">{stat.correct}/{stat.total} correct</span></div>
                <Progress value={stat.percentage} />
                <b className="font-mono text-sm text-ink">{stat.percentage}%</b>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <SectionHeader title={wrong.length ? "Understand every missed answer" : "Clean sweep"} description={`${wrong.length} wrong answers saved to this report.`} />
        {!wrong.length && (
          <Alert className="mt-5">
            <AlertTitle>No misses in this attempt</AlertTitle>
            <AlertDescription>Take a different timed exam to make sure the score is repeatable.</AlertDescription>
          </Alert>
        )}
        <div className="mt-5 grid gap-5">
          {wrong.map((review, index) => {
            const learnHref = hrefForReviewFile(review.question.reviewFile);

            return (
              <Card className="border-destructive/30" key={review.question.id}>
                <CardHeader>
                  <div className="flex flex-wrap justify-between gap-3">
                    <Badge variant="destructive">{review.question.topic}</Badge>
                    <span className="text-sm text-muted-foreground">Miss {index + 1}</span>
                  </div>
                  <CardTitle className="text-2xl">{review.question.question}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {review.question.scenario && (
                    <Alert>
                      <AlertTitle>Question context</AlertTitle>
                      <AlertDescription>{review.question.scenario}</AlertDescription>
                    </Alert>
                  )}
                  {review.question.schema && <SchemaDisplay schemas={review.question.schema} />}
                  {review.question.sampleData?.map((table, tableIndex) => <ResultTable data={table} key={tableIndex} />)}
                  {review.question.code && <CodeBlock code={review.question.code} label={review.question.codeLabel} />}
                  {review.question.outputTable && <ResultTable data={review.question.outputTable} />}
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4"><span className="mono-label">Your answer</span><strong className="mt-1 block">{review.selectedAnswers.join(", ") || "Unanswered"}</strong></div>
                    <div className="rounded-xl border border-primary/30 bg-accent/55 p-4"><span className="mono-label">Correct answer</span><strong className="mt-1 block">{review.question.correctAnswers.join(", ")}</strong></div>
                  </div>
                  <Alert>
                    <AlertTitle>Why</AlertTitle>
                    <AlertDescription>{review.question.explanation}</AlertDescription>
                  </Alert>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild variant="outline"><Link href="/mistakes">Repair in mistakes</Link></Button>
                    {learnHref && <Button asChild variant="secondary"><Link href={learnHref}>Read lesson</Link></Button>}
                    <Button asChild variant="ghost"><Link href="/practice">Practice this topic</Link></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function TopicScore({ topic, percentage }: { topic: string; percentage: number }) {
  return (
    <div className="grid gap-2 rounded-xl border bg-muted/25 p-3">
      <div className="flex justify-between gap-3 text-sm">
        <span>{topic}</span>
        <strong>{percentage}%</strong>
      </div>
      <Progress value={percentage} />
    </div>
  );
}
