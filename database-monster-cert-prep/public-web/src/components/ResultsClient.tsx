import Link from "next/link";
import { CodeBlock, ResultTable, SchemaDisplay } from "@/components/DataDisplay";
import type { ExamResult } from "@/lib/types";

export function ResultsClient({ result }: { result: ExamResult }) {
  const topicRows = Object.entries(result.topicStats).sort((a, b) => a[1].percentage - b[1].percentage);
  const passed = result.score >= 80;
  const examReady = result.score >= 85;
  const weakest = topicRows.slice(0, 3);
  const strongest = [...topicRows].reverse().slice(0, 3);
  const wrong = result.reviews.filter((review) => !review.correct);

  return (
    <main>
      <section className={`result-hero ${passed ? "pass" : "repair"}`}>
        <div className="page-shell result-grid">
          <div>
            <p className="eyebrow">Exam saved</p>
            <h1>{examReady ? "Exam-ready range." : passed ? "Pass range. Make it repeatable." : "Useful data. Repair before retaking."}</h1>
            <p>{result.correct} of {result.total} correct in {Math.floor(result.durationSeconds / 60)} minutes.</p>
            <div className="button-row">
              <Link className="button primary" href="/exam?mode=timed">Take another exam</Link>
              <Link className="button secondary" href="/mistakes">Open mistake notebook</Link>
              <Link className="button secondary" href="/history">Exam history</Link>
            </div>
          </div>
          <div className="score-ring" aria-label={`Score ${result.score} percent`}>
            <strong>{result.score}%</strong>
            <span>{passed ? "Pass range" : "Repair required"}</span>
          </div>
        </div>
      </section>

      <div className="page-shell section-space">
        <section className="insight-grid">
          <article className="content-card">
            <p className="eyebrow">Strongest topics</p>
            <h2>Keep these sharp</h2>
            {strongest.map(([topic, stat]) => <div className="topic-score" key={topic}><span>{topic}</span><strong>{stat.percentage}%</strong></div>)}
          </article>
          <article className="content-card">
            <p className="eyebrow">Weakest topics</p>
            <h2>Study these next</h2>
            {weakest.map(([topic, stat]) => <div className="topic-score" key={topic}><span>{topic}</span><strong>{stat.percentage}%</strong></div>)}
          </article>
          <article className="content-card recommendation-card">
            <p className="eyebrow">Recommended plan</p>
            <h2>{result.score < 70 ? "Return to notes and labs" : result.score < 85 ? "Targeted repair cycle" : "Prove it twice"}</h2>
            <p>{result.score < 70 ? "Study the weakest three topics and complete their SQL labs before another full exam." : result.score < 85 ? "Review every miss, then run a focused topic practice set." : "Take a different 50-minute exam and keep every topic at 80% or higher."}</p>
            <Link href="/roadmap">Open study roadmap →</Link>
          </article>
        </section>

        <section className="content-card topic-breakdown">
          <div className="section-heading compact"><div><p className="eyebrow">Performance map</p><h2>Topic breakdown</h2></div></div>
          {topicRows.map(([topic, stat]) => (
            <div className="breakdown-row" key={topic}>
              <div><strong>{topic}</strong><span>{stat.correct}/{stat.total} correct</span></div>
              <div className="score-bar"><i style={{ width: `${stat.percentage}%` }} /></div>
              <b>{stat.percentage}%</b>
            </div>
          ))}
        </section>

        <div className="section-heading">
          <div><p className="eyebrow">Mistake repair</p><h2>{wrong.length ? "Understand every missed answer" : "Clean sweep"}</h2></div>
          <span>{wrong.length} wrong answers</span>
        </div>
        <section className="mistake-review-list exam-readable">
          {wrong.map((review, index) => (
            <article className="answer-review-card" key={review.question.id}>
              <div className="answer-review-heading">
                <span>Wrong · {review.question.topic}</span>
                <strong>Question {index + 1}</strong>
              </div>
              <h3>{review.question.question}</h3>
              {review.question.schema && <SchemaDisplay schemas={review.question.schema} />}
              {review.question.sampleData?.map((table, tableIndex) => <ResultTable data={table} key={tableIndex} />)}
              {review.question.code && <CodeBlock code={review.question.code} label={review.question.codeLabel} />}
              <div className="answer-comparison">
                <p><span>Your answer</span><strong>{review.selectedAnswers.join(", ") || "Unanswered"}</strong></p>
                <p><span>Correct answer</span><strong>{review.question.correctAnswers.join(", ")}</strong></p>
              </div>
              <div className="explanation-box">
                <strong>Why</strong>
                <p>{review.question.explanation}</p>
              </div>
              <details>
                <summary>Why the other choices are wrong</summary>
                <ul>
                  {Object.entries(review.question.wrongAnswerExplanations).map(([choice, reason]) => <li key={choice}><strong>{choice}:</strong> {reason}</li>)}
                </ul>
              </details>
              {review.question.reviewFile && <p className="review-file">Review file: <code>{review.question.reviewFile}</code></p>}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

