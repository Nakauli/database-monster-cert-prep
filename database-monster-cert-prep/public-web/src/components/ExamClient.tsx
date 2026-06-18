"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { QuestionContent } from "@/components/QuestionContent";
import { createExamQuestions, examDuration, examTitle } from "@/lib/questions";
import { saveResult } from "@/lib/storage";
import type { ExamQuestion, ExamResult, TopicStat } from "@/lib/types";

type Phase = "loading" | "exam" | "review";

function exactMatch(left: string[], right: string[]): boolean {
  return [...left].sort().join("\u0000") === [...right].sort().join("\u0000");
}

export function ExamClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode") ?? "timed";
  const topic = searchParams.get("topic") ?? undefined;
  const difficulty = searchParams.get("difficulty") ?? undefined;
  const requestedCount = Number(searchParams.get("count")) || undefined;
  const title = examTitle(mode, topic);
  const duration = examDuration(mode);

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [marked, setMarked] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [secondsLeft, setSecondsLeft] = useState(duration ?? 0);
  const [startedAt, setStartedAt] = useState(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setQuestions(createExamQuestions(mode, topic, difficulty, requestedCount));
      setSecondsLeft(duration ?? 0);
      setStartedAt(Date.now());
      setPhase("exam");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mode, topic, difficulty, requestedCount, duration]);

  const current = questions[currentIndex];
  const answeredCount = Object.values(answers).filter((answer) => answer.length > 0).length;
  const unanswered = questions.filter((question) => !(answers[question.id]?.length));
  const progress = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const finalizeExam = useCallback(() => {
    if (!questions.length) return;
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
      id: crypto.randomUUID(),
      mode,
      title,
      completedAt: new Date().toISOString(),
      durationSeconds: Math.round((Date.now() - startedAt) / 1000),
      score: Math.round((correct / questions.length) * 100),
      correct,
      total: questions.length,
      topicStats,
      reviews,
    };
    saveResult(result);
    router.push("/results");
  }, [answers, mode, questions, router, startedAt, title]);

  useEffect(() => {
    if (phase !== "exam" || duration === null) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          window.setTimeout(finalizeExam, 0);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [duration, finalizeExam, phase]);

  function toggleAnswer(answer: string) {
    if (!current) return;
    setAnswers((previous) => {
      const selected = previous[current.id] ?? [];
      if (current.type === "multiple-answer") {
        return {
          ...previous,
          [current.id]: selected.includes(answer) ? selected.filter((item) => item !== answer) : [...selected, answer],
        };
      }
      return { ...previous, [current.id]: [answer] };
    });
  }

  function toggleMarked() {
    if (!current) return;
    setMarked((previous) => previous.includes(current.id) ? previous.filter((id) => id !== current.id) : [...previous, current.id]);
  }

  const timerText = useMemo(() => {
    if (duration === null) return "Practice mode";
    return `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;
  }, [duration, secondsLeft]);

  if (phase === "loading" || !current) {
    return <main className="page-shell section-space"><div className="loading-card">Preparing your randomized exam…</div></main>;
  }

  if (phase === "review") {
    return (
      <main className="page-shell section-space">
        <section className="review-hero">
          <p className="eyebrow">Final review</p>
          <h1>Check your work before submitting.</h1>
          <div className="review-summary">
            <span><strong>{answeredCount}</strong> Answered</span>
            <span><strong>{unanswered.length}</strong> Unanswered</span>
            <span><strong>{marked.length}</strong> Marked</span>
          </div>
        </section>
        {unanswered.length > 0 && (
          <div className="warning-banner" role="alert">
            <strong>Unanswered questions remain.</strong> They will be scored as incorrect if you submit now.
          </div>
        )}
        <section className="review-grid" aria-label="Question review">
          {questions.map((question, index) => {
            const isAnswered = Boolean(answers[question.id]?.length);
            const isMarked = marked.includes(question.id);
            return (
              <button
                type="button"
                className={`review-card ${isAnswered ? "answered" : "unanswered"} ${isMarked ? "marked" : ""}`}
                key={question.id}
                onClick={() => { setCurrentIndex(index); setPhase("exam"); }}
              >
                <span>Question {index + 1}</span>
                <strong>{isAnswered ? "Answered" : "Unanswered"}{isMarked ? " · Marked" : ""}</strong>
                <small>{question.topic}</small>
              </button>
            );
          })}
        </section>
        <div className="sticky-submit">
          <button className="button secondary" type="button" onClick={() => setPhase("exam")}>Return to exam</button>
          <button className="button danger" type="button" onClick={finalizeExam}>Submit and score exam</button>
        </div>
      </main>
    );
  }

  return (
    <main className="exam-page">
      <header className="exam-topbar">
        <div className="page-shell">
          <div>
            <p className="eyebrow">Unofficial practice simulator</p>
            <h1>{title}</h1>
          </div>
          <div className={`exam-timer ${duration !== null && secondsLeft <= 300 ? "urgent" : ""}`}>
            <small>{duration === null ? "Untimed" : "Time remaining"}</small>
            <strong>{timerText}</strong>
          </div>
        </div>
        <div className="exam-progress" aria-label={`${Math.round(progress)} percent through exam`}>
          <i style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="page-shell exam-layout">
        <section className="question-panel">
          <div className="question-number">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{answeredCount} answered</span>
          </div>
          <QuestionContent question={current} selectedAnswers={answers[current.id] ?? []} onToggleAnswer={toggleAnswer} />
          <div className="question-actions">
            <button className="button secondary" type="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((value) => value - 1)}>← Previous</button>
            <button className={`button mark ${marked.includes(current.id) ? "active" : ""}`} type="button" onClick={toggleMarked}>
              {marked.includes(current.id) ? "Marked for review" : "Mark for review"}
            </button>
            {currentIndex < questions.length - 1 ? (
              <button className="button primary" type="button" onClick={() => setCurrentIndex((value) => value + 1)}>Next →</button>
            ) : (
              <button className="button primary" type="button" onClick={() => setPhase("review")}>Review exam →</button>
            )}
          </div>
        </section>

        <aside className="question-map">
          <div className="map-heading">
            <h2>Question map</h2>
            <button type="button" onClick={() => setPhase("review")}>Review all</button>
          </div>
          <div className="map-grid">
            {questions.map((question, index) => (
              <button
                type="button"
                key={question.id}
                onClick={() => setCurrentIndex(index)}
                className={`${index === currentIndex ? "current" : ""} ${answers[question.id]?.length ? "answered" : ""} ${marked.includes(question.id) ? "marked" : ""}`}
                aria-label={`Question ${index + 1}${answers[question.id]?.length ? ", answered" : ", unanswered"}${marked.includes(question.id) ? ", marked" : ""}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="map-legend">
            <span><i className="legend-current" /> Current</span>
            <span><i className="legend-answered" /> Answered</span>
            <span><i className="legend-marked" /> Marked</span>
          </div>
          <button className="button danger full" type="button" onClick={() => setPhase("review")}>Review and submit</button>
        </aside>
      </div>
    </main>
  );
}
