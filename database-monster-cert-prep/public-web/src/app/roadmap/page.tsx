import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Study Roadmap" };

const plans = [
  {
    id: "48-hour",
    title: "Emergency 48-hour plan",
    summary: "Triage the highest-value concepts, repair the diagnostic, and prove an 80%+ baseline.",
    days: [
      ["First 4 hours", "Diagnostic exam; keys, relationships, NULL, and normalization.", "80% concept checkpoint"],
      ["Hours 5–12", "SELECT, filtering, joins, grouping; complete Labs 1–4.", "8/10 fresh queries correct"],
      ["Hours 13–24", "Repair every diagnostic miss and run two panic reviews.", "80% mixed quiz"],
      ["Hours 25–36", "Subqueries, DDL/DML, transactions, triggers, security.", "80% focused quiz"],
      ["Hours 37–48", "Timed exam, weakest-two repair cycle, Final Boss.", "85% target; 80% minimum"],
    ],
  },
  {
    id: "7-day",
    title: "7-day cram plan",
    summary: "One major topic block each day, with a lab, quiz, and mandatory mistake repair.",
    days: [
      ["Day 1", "Core concepts, keys, relationships", "80% concept quiz"],
      ["Day 2", "ERD and normalization", "Normalize one design to 3NF"],
      ["Day 3", "SELECT, filtering, sorting, NULL", "18/20 fundamentals"],
      ["Day 4", "Joins and aggregation", "Explain every row multiplication"],
      ["Day 5", "Subqueries, views, DDL, indexes", "80% mixed quiz"],
      ["Day 6", "DML, transactions, procedures, triggers, security", "80% safety quiz"],
      ["Day 7", "Timed exam, repair, Final Boss", "85% final simulation"],
    ],
  },
  {
    id: "14-day",
    title: "14-day mastery plan",
    summary: "Slower repetition, deeper labs, and two separate proof-of-readiness exam scores.",
    days: [
      ["Days 1–2", "Diagnostic, vocabulary, keys, ERDs", "80% foundations"],
      ["Days 3–4", "1NF, 2NF, 3NF, BCNF basics", "Dependency drills"],
      ["Days 5–6", "SELECT, predicates, NULL, sorting", "85% SQL basics"],
      ["Days 7–8", "Joins, aggregation, HAVING", "85% query reasoning"],
      ["Days 9–10", "Subqueries, views, DDL, indexes", "Complete Labs 5–6"],
      ["Days 11–12", "DML, transactions, procedures, triggers", "Complete Labs 7–8"],
      ["Days 13–14", "Security, troubleshooting, two timed exams", "85% twice"],
    ],
  },
];

const checklist = [
  "DBMS/RDBMS, schema/instance, data types, and NULL",
  "Candidate, primary, foreign, composite, and surrogate keys",
  "ERD cardinality, optionality, and junction tables",
  "1NF, 2NF, 3NF, BCNF basics, and anomalies",
  "SELECT, filtering, sorting, LIMIT/TOP, and aliases",
  "INNER, LEFT, RIGHT, FULL, CROSS, and SELF joins",
  "Aggregation, GROUP BY, HAVING, and NULL behavior",
  "Subqueries, EXISTS, UNION, CASE, CTEs, and views",
  "DDL, constraints, referential actions, and indexes",
  "DML, ACID transactions, savepoints, and safe updates",
  "Procedures, functions, triggers, and cross-platform syntax",
  "Roles, least privilege, injection, backup, and troubleshooting",
];

export default function RoadmapPage() {
  return (
    <main className="page-shell section-space">
      <section className="page-intro">
        <p className="eyebrow">Study roadmap</p>
        <h1>Use a plan that matches the time you actually have.</h1>
        <p>Every checkpoint is pass/fail. If you miss it, study one worked example, solve three fresh examples, then retake a focused quiz.</p>
      </section>
      <nav className="plan-jump" aria-label="Study plans">
        {plans.map((plan) => <a key={plan.id} href={`#${plan.id}`}>{plan.title}</a>)}
      </nav>
      <div className="roadmap-list">
        {plans.map((plan) => (
          <section className="roadmap-card" id={plan.id} key={plan.id}>
            <p className="eyebrow">Training plan</p>
            <h2>{plan.title}</h2>
            <p>{plan.summary}</p>
            <div className="roadmap-table">
              {plan.days.map(([day, work, checkpoint]) => (
                <div key={day}>
                  <strong>{day}</strong>
                  <span>{work}</span>
                  <b>{checkpoint}</b>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <section className="content-card checklist-card">
        <p className="eyebrow">Mastery checklist</p>
        <h2>Can you explain it and solve a fresh problem?</h2>
        <div className="checklist-grid">
          {checklist.map((item) => <label key={item}><input type="checkbox" /> <span>{item}</span></label>)}
        </div>
        <div className="button-row">
          <Link className="button primary" href="/exam?mode=diagnostic">Build my baseline</Link>
          <Link className="button secondary" href="/labs">Open SQL labs</Link>
        </div>
      </section>
    </main>
  );
}

