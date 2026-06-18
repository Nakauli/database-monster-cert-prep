"use client";

import { motion } from "framer-motion";
import { Database, Lightning, Stack } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { SchemaDisplay } from "@/components/DataDisplay";
import { SqlSandbox } from "@/components/SqlSandbox";
import { labs } from "@/data/labs";
import { DATASET_TABLES } from "@/data/sql-datasets";
import { preloadSqlEngine } from "@/lib/sql-engine";
import type { SchemaTable } from "@/lib/types";

const datasetSchemas: SchemaTable[] = DATASET_TABLES.map((table) => ({
  table: table.name,
  columns: table.columns.map((column) => ({
    name: column.name,
    type: column.type,
    key: column.note === "PK" ? "PRIMARY KEY" : column.note === "FK" ? "FOREIGN KEY" : undefined,
    nullable: column.note === "nullable" ? true : undefined,
  })),
}));

export function LabsClient() {
  const [showSchema, setShowSchema] = useState(false);

  useEffect(() => {
    preloadSqlEngine();
  }, []);

  return (
    <main className="page-shell section-space">
      <section className="page-intro rise">
        <p className="eyebrow">Hands-on SQL labs</p>
        <h1>Write real queries. Run them. See the rows.</h1>
        <p>
          Every lab runs against a live in-browser SQLite database seeded with the same student
          records. Nothing leaves this tab — the engine executes entirely on your machine.
        </p>
        <div className="button-row">
          <button className="button secondary" type="button" onClick={() => setShowSchema((v) => !v)}>
            <Database size={16} weight="bold" /> {showSchema ? "Hide" : "Browse"} dataset schema
          </button>
          <span className="sql-hint" style={{ alignSelf: "center" }}>
            <Lightning size={14} weight="fill" style={{ verticalAlign: "-2px" }} /> 8 labs · auto-graded
          </span>
        </div>
        {showSchema && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            style={{ overflow: "hidden", marginTop: 18 }}
          >
            <SchemaDisplay schemas={datasetSchemas} />
          </motion.div>
        )}
      </section>

      <section className="lab-list">
        {labs.map((lab, index) => (
          <motion.article
            className="lab-card"
            key={lab.id}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: Math.min(index, 4) * 0.05 }}
          >
            <div className="lab-number">{String(index + 1).padStart(2, "0")}</div>
            <div className="lab-body">
              <div className="question-badges">
                <span><Stack size={12} weight="bold" style={{ verticalAlign: "-2px" }} /> {lab.topic}</span>
                <span>Interactive lab</span>
              </div>
              <h2>{lab.title}</h2>
              <p>{lab.objective}</p>
              <div className="schema-text">
                <strong>Schema</strong>
                <pre><code>{lab.schema}</code></pre>
              </div>
              <h3>Tasks</h3>
              <ol>{lab.tasks.map((task) => <li key={task}>{task}</li>)}</ol>
              <SqlSandbox
                initialSql={lab.starter}
                expectedSql={lab.answer}
                revealAnswer={lab.answer}
              />
            </div>
          </motion.article>
        ))}
      </section>
    </main>
  );
}
