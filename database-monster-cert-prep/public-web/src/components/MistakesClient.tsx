"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MistakeRow } from "@/lib/progress";

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
    <main className="page-shell section-space">
      <section className="page-intro">
        <p className="eyebrow">Private mistake notebook</p>
        <h1>Your wrong answers are the highest-value study material.</h1>
        <p>Only your authenticated account can read or update these rows. Repeated misses rise to the top.</p>
      </section>
      <div className="stat-strip compact-stats">
        <article><strong>{mistakes.length}</strong><span>unique mistakes</span></article>
        <article><strong>{repeated}</strong><span>missed more than once</span></article>
        <article><strong>{topics.length}</strong><span>topics needing repair</span></article>
      </div>
      <div className="filter-row">
        <label htmlFor="mistake-topic">Filter by topic</label>
        <select id="mistake-topic" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">All topics</option>
          {topics.map((topic) => <option key={topic}>{topic}</option>)}
        </select>
        {mistakes.length > 0 && <Link className="button primary" href="/exam?mode=mistakes">Practice mistakes only</Link>}
      </div>
      {message && <p className="form-message success" role="status">{message}</p>}
      {!visible.length ? (
        <section className="empty-state inline-empty">
          <h2>No saved mistakes in this view.</h2>
          <p>Take the diagnostic to identify the topics that deserve your time.</p>
          <Link className="button primary" href="/exam?mode=diagnostic">Start diagnostic</Link>
        </section>
      ) : (
        <section className="notebook-list">
          {visible.map((mistake) => {
            const snapshot = mistake.question_snapshot as { question?: string; reviewFile?: string };
            return (
              <article className="notebook-card exam-readable" key={mistake.id}>
                <div>
                  <span>{mistake.topic}</span>
                  <strong>Missed {mistake.mistake_count}× · {new Date(mistake.last_mistaken_at).toLocaleDateString()}</strong>
                </div>
                <h2>{snapshot.question ?? `Question ${mistake.question_id}`}</h2>
                <p><b>Your latest answer:</b> {mistake.selected_answers.join(", ") || "Unanswered"}</p>
                <p><b>Correct answer:</b> {mistake.correct_answers.join(", ")}</p>
                <div className="explanation-box"><strong>Rule to remember</strong><p>{mistake.explanation}</p></div>
                {snapshot.reviewFile && <p className="review-file">Review: <code>{snapshot.reviewFile}</code></p>}
                <button className="button secondary" type="button" onClick={() => void removeMistake(mistake.id)}>
                  Mark as mastered
                </button>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

