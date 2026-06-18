"use client";

import { useCallbackRef } from "@/lib/use-callback-ref";
import CodeMirror from "@uiw/react-codemirror";
import { sql, SQLite } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { Play, Sparkle, Eye, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ResultTable } from "@/components/DataDisplay";
import { gradeSql, runSql, type SqlResultSet } from "@/lib/sql-engine";
import type { DataTable } from "@/lib/types";

function useTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const read = () =>
      setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return theme;
}

function toDataTable(rs: SqlResultSet): DataTable {
  return {
    label: `Result · ${rs.rows.length} row${rs.rows.length === 1 ? "" : "s"}`,
    columns: rs.columns,
    rows: rs.rows.map((row) =>
      row.map((cell) => (cell instanceof Uint8Array ? `blob(${cell.length})` : cell)),
    ),
  };
}

type Status =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "ran"; result: SqlResultSet | null; rowsAffected: number }
  | { kind: "error"; message: string }
  | { kind: "graded"; pass: boolean; message: string; result: SqlResultSet | null };

interface SqlSandboxProps {
  initialSql: string;
  expectedSql?: string;
  revealAnswer?: string;
  /** Notified on every edit (used by the exam to store the candidate's query). */
  onChange?: (value: string) => void;
  /** Notified when a Check produces a verdict (used by the exam for live feedback). */
  onGraded?: (pass: boolean) => void;
}

export function SqlSandbox({
  initialSql,
  expectedSql,
  revealAnswer,
  onChange,
  onGraded,
}: SqlSandboxProps) {
  const theme = useTheme();
  const [value, setValue] = useState(initialSql);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [revealed, setRevealed] = useState(false);
  const onChangeRef = useCallbackRef(onChange);
  const onGradedRef = useCallbackRef(onGraded);
  const busy = useRef(false);

  const extensions = useMemo(() => [sql({ dialect: SQLite })], []);

  function handleChange(next: string) {
    setValue(next);
    onChangeRef(next);
  }

  async function handleRun() {
    if (busy.current) return;
    busy.current = true;
    setStatus({ kind: "running" });
    const res = await runSql(value);
    busy.current = false;
    if (!res.ok) {
      setStatus({ kind: "error", message: res.error });
      return;
    }
    setStatus({ kind: "ran", result: res.result, rowsAffected: res.rowsAffected });
  }

  async function handleCheck() {
    if (!expectedSql || busy.current) return;
    busy.current = true;
    setStatus({ kind: "running" });
    const grade = await gradeSql(value, expectedSql);
    busy.current = false;
    setStatus({
      kind: "graded",
      pass: grade.pass,
      message: grade.message,
      result: grade.userResult ?? null,
    });
    onGradedRef(grade.pass);
  }

  const running = status.kind === "running";
  const resultSet =
    status.kind === "ran" ? status.result : status.kind === "graded" ? status.result : null;

  return (
    <div className="sql-sandbox">
      <div className="sql-sandbox-head">
        <span>
          <Sparkle size={14} weight="fill" /> SQL Console
        </span>
        <span style={{ letterSpacing: 0, textTransform: "none", fontWeight: 600 }}>
          SQLite · seeded sandbox
        </span>
      </div>

      <div className="sql-editor-wrap">
        <CodeMirror
          value={value}
          height="auto"
          minHeight="120px"
          theme={theme === "dark" ? oneDark : undefined}
          extensions={extensions}
          basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }}
          onChange={handleChange}
        />
      </div>

      <div className="sql-toolbar">
        <button className="button primary" type="button" onClick={handleRun} disabled={running}>
          <Play size={15} weight="fill" /> {running ? "Running…" : "Run"}
        </button>
        {expectedSql && (
          <button className="button secondary" type="button" onClick={handleCheck} disabled={running}>
            <CheckCircle size={15} weight="bold" /> Check answer
          </button>
        )}
        <span className="spacer" />
        {revealAnswer && (
          <button
            className="button mark"
            type="button"
            onClick={() => setRevealed((v) => !v)}
          >
            <Eye size={15} weight="bold" /> {revealed ? "Hide" : "Reveal"} solution
          </button>
        )}
      </div>

      {running && <div className="sql-skeleton" aria-hidden="true" />}

      {status.kind === "error" && (
        <div className="sql-status err" role="alert">
          <WarningCircle size={15} weight="fill" /> {status.message}
        </div>
      )}

      {status.kind === "ran" && !status.result && (
        <div className="sql-status ok">
          <CheckCircle size={15} weight="fill" /> Statement executed · {status.rowsAffected} row
          {status.rowsAffected === 1 ? "" : "s"} affected.
        </div>
      )}

      {status.kind === "graded" && (
        <div className={`sql-status ${status.pass ? "pass" : "err"}`} role="status">
          {status.pass ? <CheckCircle size={15} weight="fill" /> : <WarningCircle size={15} weight="fill" />}
          {status.message}
        </div>
      )}

      {resultSet && (
        <div className="sql-result">
          <ResultTable data={toDataTable(resultSet)} />
        </div>
      )}

      {revealed && revealAnswer && (
        <div className="sql-result answer-reveal">
          <pre className="schema-text" style={{ margin: 0 }}>
            <strong>Reference solution</strong>
            {revealAnswer}
          </pre>
        </div>
      )}
    </div>
  );
}
