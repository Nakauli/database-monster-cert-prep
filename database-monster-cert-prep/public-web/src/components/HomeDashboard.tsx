import Link from "next/link";

const modes = [
  { title: "Diagnostic Exam", detail: "40 balanced questions · 50 minutes", href: "/exam?mode=diagnostic", label: "Start diagnostic", tone: "green" },
  { title: "Timed Exam", detail: "40 randomized questions · 50 minutes", href: "/exam?mode=timed", label: "Start timed exam", tone: "blue" },
  { title: "Final Boss", detail: "45 hard and final-boss questions", href: "/exam?mode=final", label: "Enter final boss", tone: "orange" },
];

export function HomeDashboard() {
  return (
    <main>
      <section className="hero-section">
        <div className="page-shell hero-grid">
          <div>
            <p className="eyebrow">Database certification command center</p>
            <h1>Train hard. Query smart. Pass ready.</h1>
            <p className="hero-copy">
              An unofficial Certiport-style simulator with private accounts, timed exams,
              SQL-first explanations, and per-topic mastery tracking.
            </p>
            <div className="button-row">
              <Link className="button primary" href="/register">Create your training account</Link>
              <Link className="button secondary" href="/login">Sign in</Link>
            </div>
            <p className="privacy-note"><span aria-hidden="true">◆</span> Your history and mistakes are protected per user with Row Level Security.</p>
          </div>
          <div className="editor-preview" aria-label="Decorative SQL editor preview">
            <div className="editor-top"><span></span><span></span><span></span><strong>readiness_query.sql</strong></div>
            <pre><code><b>SELECT</b> topic, mastery_score{`\n`}<b>FROM</b> user_topic_progress{`\n`}<b>WHERE</b> mastery_score &lt; 80{`\n`}<b>ORDER BY</b> mastery_score <b>ASC</b>;</code></pre>
            <div className="editor-result">
              <span>training_signal</span><span>status</span>
              <code>private progress</code><code>RLS</code>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell section-space">
        <div className="stat-strip">
          <article><strong>360</strong><span>original questions</span></article>
          <article><strong>200</strong><span>formatted code examples</span></article>
          <article><strong>12</strong><span>tracked topic areas</span></article>
          <article><strong>1</strong><span>private command center per user</span></article>
        </div>

        <div className="section-heading">
          <div><p className="eyebrow">Training modes</p><h2>Practice with a deliberate target</h2></div>
          <Link href="/roadmap">Preview the study roadmap →</Link>
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
            <p className="eyebrow">Readable where it matters</p>
            <h2>SQL looks like SQL. Questions stay calm.</h2>
            <p>The exam uses a clean sans-serif for reading and a dedicated monospace for queries, schemas, columns, errors, and result grids.</p>
            <Link href="/about">See how the simulator works →</Link>
          </article>
          <article className="content-card">
            <p className="eyebrow">Private by architecture</p>
            <h2>Your weak topics are not a class leaderboard.</h2>
            <p>Every user can read and update only their own attempts, topic scores, profile, and mistake notebook.</p>
            <Link href="/register">Create a private account →</Link>
          </article>
        </div>
      </section>
    </main>
  );
}

