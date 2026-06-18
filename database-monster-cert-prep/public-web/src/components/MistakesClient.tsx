"use client";

import Link from "next/link";
import { Cards, Notebook } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { FlashcardReview } from "@/components/FlashcardReview";
import { getProgress, resetProgress } from "@/lib/storage";
import type { ProgressData } from "@/lib/types";

export function MistakesClient() {
  const [progress, setProgress] = useState<ProgressData>({ attempts: [], mistakes: [] });
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<"notebook" | "flashcards">("notebook");

  useEffect(() => {
    const timer = window.setTimeout(() => setProgress(getProgress()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function handleResolve(questionId: string) {
    setProgress((prev) => ({ ...prev, mistakes: prev.mistakes.filter((m) => m.questionId !== questionId) }));
  }

  const topics = [...new Set(progress.mistakes.map((mistake) => mistake.topic))].sort();
  const visible = filter === "all" ? progress.mistakes : progress.mistakes.filter((mistake) => mistake.topic === filter);
  const repeated = useMemo(() => progress.mistakes.filter((mistake) => mistake.misses > 1).length, [progress]);

  function clear() {
    if (!window.confirm("Reset all exam attempts and saved mistakes on this browser?")) return;
    resetProgress();
    setProgress({ attempts: [], mistakes: [] });
  }

  return (
    <main className="page-shell section-space">
      <section className="page-intro">
        <p className="eyebrow">Local mistake notebook</p>
        <h1>Your wrong answers are the highest-value study material.</h1>
        <p>Nothing here is uploaded. This notebook is generated from exam attempts stored only in your browser.</p>
      </section>
      <div className="stat-strip compact-stats">
        <article><strong>{progress.mistakes.length}</strong><span>unique mistakes</span></article>
        <article><strong>{repeated}</strong><span>missed more than once</span></article>
        <article><strong>{progress.attempts.length}</strong><span>saved attempts</span></article>
      </div>
      {progress.mistakes.length > 0 && (
        <div className="button-row" style={{ marginBottom: 4 }}>
          <button className={`button ${view === "notebook" ? "primary" : "secondary"}`} type="button" onClick={() => setView("notebook")}>
            <Notebook size={16} weight="bold" /> Notebook
          </button>
          <button className={`button ${view === "flashcards" ? "primary" : "secondary"}`} type="button" onClick={() => setView("flashcards")}>
            <Cards size={16} weight="bold" /> Flashcard review
          </button>
        </div>
      )}
      {view === "flashcards" && progress.mistakes.length > 0 ? (
        <FlashcardReview mistakes={progress.mistakes} onResolve={handleResolve} />
      ) : (
      <>
      <div className="filter-row">
        <label htmlFor="mistake-topic">Filter by topic</label>
        <select id="mistake-topic" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">All topics</option>
          {topics.map((topic) => <option key={topic}>{topic}</option>)}
        </select>
        <button className="text-danger" type="button" onClick={clear}>Reset all progress</button>
      </div>
      {!visible.length ? (
        <section className="empty-state inline-empty">
          <h2>No saved mistakes yet.</h2>
          <p>Take the diagnostic to identify the topics that deserve your time.</p>
          <Link className="button primary" href="/exam?mode=diagnostic">Start diagnostic</Link>
        </section>
      ) : (
        <section className="notebook-list">
          {visible.map((mistake) => (
            <article className="notebook-card" key={mistake.questionId}>
              <div><span>{mistake.topic}</span><strong>Missed {mistake.misses}×</strong></div>
              <h2>{mistake.question}</h2>
              <p><b>Your latest answer:</b> {mistake.selectedAnswers.join(", ") || "Unanswered"}</p>
              <p><b>Correct answer:</b> {mistake.correctAnswers.join(", ")}</p>
              <div className="explanation-box"><strong>Rule to remember</strong><p>{mistake.explanation}</p></div>
              {mistake.reviewFile && <p className="review-file">Review: <code>{mistake.reviewFile}</code></p>}
            </article>
          ))}
        </section>
      )}
      </>
      )}
    </main>
  );
}
