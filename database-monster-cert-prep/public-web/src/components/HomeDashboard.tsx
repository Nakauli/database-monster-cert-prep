"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Pulse, Timer, Crown, ShieldCheck, ArrowRight, CaretRight } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { ProgressRing } from "@/components/ProgressRing";
import { computeReadiness } from "@/lib/readiness";
import { getLastResult, getProgress } from "@/lib/storage";
import type { ExamResult, ProgressData } from "@/lib/types";

const modes = [
  { title: "Diagnostic Exam", detail: "40 balanced questions · 50 minutes", href: "/exam?mode=diagnostic", label: "Start diagnostic", tone: "green", icon: Pulse },
  { title: "Timed Exam", detail: "40 randomized questions · 50 minutes", href: "/exam?mode=timed", label: "Start timed exam", tone: "blue", icon: Timer },
  { title: "Final Boss", detail: "45 hard and final-boss questions", href: "/exam?mode=final", label: "Enter final boss", tone: "orange", icon: Crown },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

export function HomeDashboard() {
  const [progress, setProgress] = useState<ProgressData>({ attempts: [], mistakes: [] });
  const [lastResult, setLastResult] = useState<ExamResult | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProgress(getProgress());
      setLastResult(getLastResult());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const latest = progress.attempts[0];
  const readiness = useMemo(() => computeReadiness(progress, lastResult), [progress, lastResult]);
  const weakTopic = useMemo(() => {
    const counts = new Map<string, number>();
    progress.mistakes.forEach((mistake) => counts.set(mistake.topic, (counts.get(mistake.topic) ?? 0) + mistake.misses));
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  }, [progress]);

  return (
    <main>
      <section className="hero-section">
        <div className="page-shell hero-grid">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
            <p className="eyebrow">Database certification training</p>
            <h1>Read every question. Run every query. Beat every trap.</h1>
            <p className="hero-copy">
              A certification-style simulator with timed exams, a live in-browser SQL sandbox,
              weakness tracking, and zero account setup.
            </p>
            <div className="button-row">
              <Link className="button primary" href="/exam?mode=diagnostic">
                Start diagnostic exam <ArrowRight size={16} weight="bold" />
              </Link>
              <Link className="button secondary" href="/labs">Open SQL labs</Link>
            </div>
            <p className="privacy-note"><ShieldCheck size={15} weight="fill" style={{ verticalAlign: "-3px" }} /> No login. No personal data. Progress stays on this device.</p>
          </motion.div>
          <motion.div className="editor-preview" aria-label="SQL editor preview" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
            <div className="editor-top"><span></span><span></span><span></span><strong>student_readiness.sql</strong></div>
            <pre><code><b>SELECT</b> topic, score{`\n`}<b>FROM</b> practice_results{`\n`}<b>WHERE</b> score &lt; 80{`\n`}<b>ORDER BY</b> score <b>ASC</b>;</code></pre>
            <div className="editor-result">
              <span>topic</span><span>score</span>
              <code>{weakTopic?.[0] ?? "Take diagnostic"}</code><code>{latest ? `${latest.score}%` : "—"}</code>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="page-shell section-space">
        {readiness.attempts > 0 && (
          <motion.div className="readiness-card" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
            <ProgressRing value={readiness.score} label="Readiness" />
            <div className="readiness-body">
              <h2>{readiness.verdict}</h2>
              <p>{readiness.blurb}</p>
              {readiness.mastery.length > 0 && readiness.mastery.map((row) => (
                <div className="mastery-row" key={row.topic}>
                  <span>{row.topic}</span>
                  <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row.percentage}%</span>
                  <div className="mastery-bar"><i style={{ width: `${row.percentage}%`, background: row.percentage >= 70 ? "var(--green)" : row.percentage >= 50 ? "var(--yellow)" : "var(--red)" }} /></div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="stat-strip" style={{ marginTop: readiness.attempts > 0 ? 22 : 0 }}>
          <article><strong>364</strong><span>practice questions</span></article>
          <article><strong>8</strong><span>interactive SQL labs</span></article>
          <article><strong>{progress.attempts.length}</strong><span>attempts on this device</span></article>
          <article><strong>{progress.mistakes.length}</strong><span>mistakes to repair</span></article>
        </div>

        <div className="section-heading">
          <div><p className="eyebrow">Choose a mode</p><h2>Train with a purpose</h2></div>
          <Link href="/roadmap">See the study roadmap <CaretRight size={13} weight="bold" style={{ verticalAlign: "-1px" }} /></Link>
        </div>
        <motion.div className="mode-grid" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <motion.article className={`mode-card ${mode.tone}`} key={mode.title} variants={item}>
                <span className="mode-icon" aria-hidden="true"><Icon size={22} weight="bold" /></span>
                <h3>{mode.title}</h3>
                <p>{mode.detail}</p>
                <Link href={mode.href}>{mode.label} <ArrowRight size={14} weight="bold" style={{ verticalAlign: "-2px" }} /></Link>
              </motion.article>
            );
          })}
        </motion.div>

        <div className="feature-grid">
          <article className="content-card">
            <p className="eyebrow">Hands-on by design</p>
            <h2>Write SQL. See real rows.</h2>
            <p>Labs and select exam questions run against a live in-browser SQLite database. Type a query, hit Run, and get auto-graded against the expected result — no setup, nothing uploaded.</p>
            <Link href="/labs">Open the SQL labs <ArrowRight size={14} weight="bold" style={{ verticalAlign: "-2px" }} /></Link>
          </article>
          <article className="content-card">
            <p className="eyebrow">Your next move</p>
            <h2>{latest ? `${latest.score}% on your latest attempt` : "Start with the diagnostic"}</h2>
            <p>{weakTopic ? `Your most repeated weak topic is ${weakTopic[0]}. Repair it with flashcards before another full exam.` : "Get a topic-by-topic baseline before deciding what to study."}</p>
            <Link href={weakTopic ? "/mistakes" : "/exam?mode=diagnostic"}>{weakTopic ? "Review mistakes" : "Build my baseline"} <ArrowRight size={14} weight="bold" style={{ verticalAlign: "-2px" }} /></Link>
          </article>
        </div>
      </section>
    </main>
  );
}
