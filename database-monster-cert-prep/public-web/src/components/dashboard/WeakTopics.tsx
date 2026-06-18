import Link from "next/link";
import type { TopicProgressRow } from "@/lib/progress";

export function WeakTopics({ topics }: { topics: TopicProgressRow[] }) {
  const weakest = topics.slice(0, 5);
  const strongest = [...topics].sort((a, b) => b.mastery_score - a.mastery_score).slice(0, 3);

  return (
    <section className="dashboard-split">
      <article className="dashboard-panel">
        <div className="panel-heading">
          <div><p className="eyebrow">Weakness radar</p><h2>Repair next</h2></div>
          <Link href="/practice">Practice →</Link>
        </div>
        {!weakest.length ? (
          <p className="muted">Complete the diagnostic to generate your first topic map.</p>
        ) : weakest.map((topic) => (
          <div className="mastery-row" key={topic.id}>
            <div><strong>{topic.topic}</strong><span>{topic.correct_count}/{topic.attempted_count} correct</span></div>
            <div className="score-bar"><i style={{ width: `${topic.mastery_score}%` }} /></div>
            <b>{topic.mastery_score}%</b>
          </div>
        ))}
      </article>
      <article className="dashboard-panel">
        <div className="panel-heading"><div><p className="eyebrow">Strongest signals</p><h2>Keep sharp</h2></div></div>
        {!strongest.length ? (
          <p className="muted">Your strongest topics will appear after your first attempt.</p>
        ) : strongest.map((topic, index) => (
          <div className="strong-topic" key={topic.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><strong>{topic.topic}</strong><small>{topic.attempted_count} questions attempted</small></div>
            <b>{topic.mastery_score}%</b>
          </div>
        ))}
      </article>
    </section>
  );
}

