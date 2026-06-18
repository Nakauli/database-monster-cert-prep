"use client";

import { useState } from "react";
import { CodeBlock } from "@/components/DataDisplay";
import { labs } from "@/data/labs";

export function LabsClient() {
  const [revealed, setRevealed] = useState<string[]>([]);

  return (
    <main className="page-shell section-space">
      <section className="page-intro">
        <p className="eyebrow">Hands-on SQL labs</p>
        <h1>Type the query before you reveal the answer.</h1>
        <p>Each lab uses fictional data and mirrors the local SQLite project. The public site does not execute or upload SQL.</p>
      </section>
      <section className="lab-list">
        {labs.map((lab, index) => {
          const isRevealed = revealed.includes(lab.id);
          return (
            <article className="lab-card" key={lab.id}>
              <div className="lab-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="lab-body">
                <div className="question-badges"><span>{lab.topic}</span><span>Practice lab</span></div>
                <h2>{lab.title}</h2>
                <p>{lab.objective}</p>
                <div className="schema-text"><strong>Schema</strong><pre><code>{lab.schema}</code></pre></div>
                <h3>Tasks</h3>
                <ol>{lab.tasks.map((task) => <li key={task}>{task}</li>)}</ol>
                <CodeBlock code={lab.starter} label="Starter SQL" />
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setRevealed((current) => isRevealed ? current.filter((id) => id !== lab.id) : [...current, lab.id])}
                  aria-expanded={isRevealed}
                >
                  {isRevealed ? "Hide answer" : "Reveal answer"}
                </button>
                {isRevealed && <div className="answer-reveal"><CodeBlock code={lab.answer} label="Answer Key" /></div>}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

