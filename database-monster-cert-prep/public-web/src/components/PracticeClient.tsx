"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { difficulties, topics } from "@/lib/questions";

export function PracticeClient() {
  const router = useRouter();
  const [topic, setTopic] = useState(topics[0]);
  const [difficulty, setDifficulty] = useState("all");
  const [count, setCount] = useState("15");

  function start() {
    const params = new URLSearchParams({ mode: "practice", topic, difficulty, count });
    router.push(`/exam?${params.toString()}`);
  }

  return (
    <main className="page-shell section-space">
      <section className="page-intro">
        <p className="eyebrow">Focused practice</p>
        <h1>Choose one weakness. Train it directly.</h1>
        <p>Topic practice is untimed. Explanations still appear only after submission, so you build real recall rather than answer recognition.</p>
      </section>
      <section className="practice-builder">
        <div>
          <label htmlFor="topic">Topic</label>
          <select id="topic" value={topic} onChange={(event) => setTopic(event.target.value)}>
            {topics.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="difficulty">Difficulty</label>
          <select id="difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
            <option value="all">All difficulties</option>
            {difficulties.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="count">Question count</label>
          <select id="count" value={count} onChange={(event) => setCount(event.target.value)}>
            <option value="10">10 questions</option>
            <option value="15">15 questions</option>
            <option value="20">20 questions</option>
          </select>
        </div>
        <button className="button primary" type="button" onClick={start}>Start topic practice →</button>
      </section>
      <section className="topic-catalog">
        {topics.map((item) => (
          <button type="button" key={item} onClick={() => { setTopic(item); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            <span>{item}</span><small>30 questions available</small>
          </button>
        ))}
      </section>
    </main>
  );
}

