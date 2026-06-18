"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getProgress } from "@/lib/storage";
import type { ProgressData } from "@/lib/types";

const modes = [
  { title: "Diagnostic Exam", detail: "40 balanced questions · 50 minutes", href: "/exam?mode=diagnostic", label: "Start diagnostic", tone: "green" },
  { title: "Timed Exam", detail: "40 randomized questions · 50 minutes", href: "/exam?mode=timed", label: "Start timed exam", tone: "blue" },
  { title: "Final Boss", detail: "45 hard and final-boss questions", href: "/exam?mode=final", label: "Enter final boss", tone: "orange" },
];

export function HomeDashboard() {
  const [progress, setProgress] = useState<ProgressData>({ attempts: [], mistakes: [] });

  useEffect(() => {
    const timer = window.setTimeout(() => setProgress(getProgress()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const latest = progress.attempts[0];
  const weakTopic = useMemo(() => {
    const counts = new Map<string, number>();
    progress.mistakes.forEach((mistake) => counts.set(mistake.topic, (counts.get(mistake.topic) ?? 0) + mistake.misses));
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  }, [progress]);

  return (
    <main>
      <section className="hero-section">
        <div className="page-shell hero-grid">
          <div>
            <p className="eyebrow">Database certification training</p>
            <h1>Make every database question readable—and every trap beatable.</h1>
            <p className="hero-copy">
              An unofficial Certiport-style simulator with timed exams, SQL-first explanations,
              weakness tracking, and zero account setup.
            </p>
            <div className="button-row">
              <Link className="button primary" href="/exam?mode=diagnostic">Start diagnostic exam</Link>
              <Link className="button secondary" href="/practice">Practice by topic</Link>
            </div>
            <p className="privacy-note"><span aria-hidden="true">◆</span> No login. No personal data. Progress stays on this device.</p>
          </div>
          <div className="editor-preview" aria-label="Decorative SQL editor preview">
            <div className="editor-top"><span></span><span></span><span></span><strong>student_readiness.sql</strong></div>
            <pre><code><b>SELECT</b> topic, score{`\n`}<b>FROM</b> practice_results{`\n`}<b>WHERE</b> score &lt; 80{`\n`}<b>ORDER BY</b> score <b>ASC</b>;</code></pre>
            <div className="editor-result">
              <span>topic</span><span>score</span>
              <code>{weakTopic?.[0] ?? "Take diagnostic"}</code><code>{latest ? `${latest.score}%` : "—"}</code>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell section-space">
        <div className="stat-strip">
          <article><strong>360</strong><span>original questions</span></article>
          <article><strong>200</strong><span>formatted code examples</span></article>
          <article><strong>{progress.attempts.length}</strong><span>attempts on this device</span></article>
          <article><strong>{progress.mistakes.length}</strong><span>mistakes to repair</span></article>
        </div>

        <div className="section-heading">
          <div><p className="eyebrow">Choose a mode</p><h2>Train with a purpose</h2></div>
          <Link href="/roadmap">See the study roadmap →</Link>
        </div>
        <div className="mode-grid">
          {modes.map((mode) => (
            <article className={`mode-card ${mode.tone}`} key={mode.title}>
              <span className="mode-icon" aria-hidden="true">{mode.title === "Final Boss" ? "⚑" : mode.title === "Timed Exam" ? "◷" : "◎"}</span>
              <h3>{mode.title}</h3>
              <p>{mode.detail}</p>
              <Link href={mode.href}>{mode.label} →</Link>
            </article>
          ))}
        </div>

        <div className="feature-grid">
          <article className="content-card">
            <p className="eyebrow">Readable by design</p>
            <h2>SQL looks like SQL.</h2>
            <p>Question text uses a comfortable sans-serif. Queries, schemas, column names, outputs, and errors use a dedicated monospace presentation with horizontal scrolling.</p>
            <Link href="/exam?mode=panic">Try a 10-question panic review →</Link>
          </article>
          <article className="content-card">
            <p className="eyebrow">Your next move</p>
            <h2>{latest ? `${latest.score}% on your latest attempt` : "Start with the diagnostic"}</h2>
            <p>{weakTopic ? `Your most repeated weak topic is ${weakTopic[0]}. Repair it before another full exam.` : "Get a topic-by-topic baseline before deciding what to study."}</p>
            <Link href={weakTopic ? "/mistakes" : "/exam?mode=diagnostic"}>{weakTopic ? "Review mistakes" : "Build my baseline"} →</Link>
          </article>
        </div>
      </section>
    </main>
  );
}
