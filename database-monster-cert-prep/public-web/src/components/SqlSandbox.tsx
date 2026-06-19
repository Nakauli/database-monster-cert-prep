"use client";

import { sql, SQLite } from "@codemirror/lang-sql";
import CodeMirror from "@uiw/react-codemirror";
import { CheckCircle, CircleAlert, Database, Eye, LoaderCircle, Play, RotateCcw } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { CodeBlock, ResultTable, SchemaDisplay } from "@/components/DataDisplay";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { checkSqlPatterns, findUnresolvedSqlHints, type SqlExpectedPattern } from "@/lib/sql-patterns";
import { gradeSql, runSql, type SqlCell, type SqlResultSet } from "@/lib/sql-engine";
import type { DataTable, SchemaTable } from "@/lib/types";

type Status =
  | { kind: "idle" }
  | { kind: "running"; label: string }
  | { kind: "ran"; result: SqlResultSet | null; rowsAffected: number }
  | { kind: "graded"; pass: boolean; message: string; result: SqlResultSet | null }
  | { kind: "hint"; messages: string[] }
  | { kind: "error"; message: string };

function cellToDisplay(cell: SqlCell): string | number | null {
  if (cell instanceof Uint8Array) return `blob(${cell.length})`;
  return cell;
}

function toDataTable(result: SqlResultSet): DataTable {
  return {
    label: `Result set · ${result.rows.length} row${result.rows.length === 1 ? "" : "s"}`,
    columns: result.columns,
    rows: result.rows.map((row) => row.map(cellToDisplay)),
  };
}

export function SqlSandbox({
  title = "SQL sandbox",
  description = "Run the query against the seeded practice database, then compare the result with the expected answer.",
  starter,
  expectedSql,
  answer,
  schema = [],
  sampleData = [],
  hints = [],
  placeholderHelp = {},
  expectedPatterns = [],
  rubric = [],
}: {
  title?: string;
  description?: string;
  starter: string;
  expectedSql?: string;
  answer?: string;
  schema?: SchemaTable[];
  sampleData?: DataTable[];
  hints?: string[];
  placeholderHelp?: Record<string, string>;
  expectedPatterns?: SqlExpectedPattern[];
  rubric?: string[];
}) {
  const [value, setValue] = useState(starter);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [showAnswer, setShowAnswer] = useState(false);
  const [showFallbackEditor, setShowFallbackEditor] = useState(false);
  const busy = useRef(false);
  const extensions = useMemo(() => [sql({ dialect: SQLite })], []);
  const patternResult = useMemo(
    () => (expectedPatterns.length ? checkSqlPatterns(value, expectedPatterns) : null),
    [expectedPatterns, value],
  );
  const unresolvedHints = useMemo(() => findUnresolvedSqlHints(value), [value]);

  function blockUnresolvedHints(): boolean {
    if (!unresolvedHints.length) return false;

    setStatus({
      kind: "hint",
      messages: unresolvedHints.map((hint) => placeholderHelp[hint.label.toLowerCase()] ?? hint.message),
    });
    return true;
  }

  async function handleRun() {
    if (busy.current) return;
    if (blockUnresolvedHints()) return;
    busy.current = true;
    setStatus({ kind: "running", label: "Running query" });
    const result = await runSql(value);
    busy.current = false;

    if (!result.ok) {
      setStatus({ kind: "error", message: result.error });
      return;
    }

    setStatus({ kind: "ran", result: result.result, rowsAffected: result.rowsAffected });
  }

  async function handleCheck() {
    if (!expectedSql || busy.current) return;
    if (blockUnresolvedHints()) return;
    busy.current = true;
    setStatus({ kind: "running", label: "Checking answer" });
    const result = await gradeSql(value, expectedSql);
    busy.current = false;
    setStatus({
      kind: "graded",
      pass: result.pass,
      message: result.message,
      result: result.userResult ?? null,
    });
  }

  const isRunning = status.kind === "running";
  const resultSet =
    status.kind === "ran" ? status.result : status.kind === "graded" ? status.result : null;

  return (
    <Card className="overflow-hidden border-primary/20 bg-card/95 shadow-[0_18px_60px_rgb(23_37_44_/_0.08)]">
      <CardHeader className="border-b bg-muted/35">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex max-w-2xl flex-col gap-1">
            <CardTitle className="flex items-center gap-2">
              <Database className="text-primary" data-icon="inline-start" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant="secondary">SQLite sandbox</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {(schema.length > 0 || hints.length > 0 || expectedPatterns.length > 0) && (
          <div className="grid gap-4 2xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-xl border bg-muted/25 p-4">
              <p className="mb-3 text-sm font-semibold text-ink">How to answer this</p>
              <ol className="grid gap-2 pl-5 text-sm text-muted-foreground">
                {hints.map((hint) => <li className="list-decimal" key={hint}>{hint}</li>)}
                {expectedPatterns.length > 0 && (
                  <li className="list-decimal">Make sure your query includes the required concepts below.</li>
                )}
              </ol>
              {expectedPatterns.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {expectedPatterns.map((pattern) => <Badge key={pattern.id} variant="outline">{pattern.label}</Badge>)}
                </div>
              )}
            </div>
            {schema.length > 0 && (
              <div className="rounded-xl border bg-background p-4">
                <p className="mb-3 text-sm font-semibold text-ink">Available tables and columns</p>
                <SchemaDisplay compact schemas={schema} />
              </div>
            )}
          </div>
        )}

        {sampleData.map((table, index) => <ResultTable data={table} key={`${table.table ?? table.label ?? "sample"}-${index}`} />)}

        <div className="overflow-hidden rounded-xl border bg-background">
          {showFallbackEditor ? (
            <Textarea
              aria-label="SQL answer"
              className="min-h-64 w-full resize-y border-0 font-mono text-sm leading-6 shadow-none [field-sizing:fixed] focus-visible:ring-0"
              spellCheck={false}
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          ) : (
            <CodeMirror
              aria-label="SQL answer"
              basicSetup={{ foldGutter: false, highlightActiveLine: true, lineNumbers: true }}
              className="sql-editor"
              extensions={extensions}
              minHeight="260px"
              onChange={setValue}
              value={value}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={handleRun} disabled={isRunning}>
            {isRunning ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Play data-icon="inline-start" />}
            Run
          </Button>
          {expectedSql && (
            <Button type="button" variant="secondary" onClick={handleCheck} disabled={isRunning}>
              <CheckCircle data-icon="inline-start" />
              Check result
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => setValue(starter)} disabled={isRunning}>
            <RotateCcw data-icon="inline-start" />
            Reset
          </Button>
          {answer && (
            <Button type="button" variant="ghost" onClick={() => setShowAnswer((current) => !current)} aria-expanded={showAnswer}>
              <Eye data-icon="inline-start" />
              {showAnswer ? "Hide solution" : "Reveal solution"}
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={() => setShowFallbackEditor((current) => !current)}>
            {showFallbackEditor ? "Use editor" : "Plain textarea"}
          </Button>
        </div>

        {patternResult && (
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="mb-3 flex items-center gap-3">
              <Progress className="h-2" value={patternResult.score} />
              <span className="font-mono text-sm font-semibold text-ink">{patternResult.score}% pattern match</span>
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-ink">Matched</p>
                <div className="flex flex-wrap gap-2">
                  {patternResult.matched.length ? (
                    patternResult.matched.map((item) => <Badge key={item.id}>{item.label}</Badge>)
                  ) : (
                    <span className="text-sm text-muted-foreground">No required patterns matched yet.</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-ink">Still missing</p>
                <div className="flex flex-wrap gap-2">
                  {patternResult.missing.length ? (
                    patternResult.missing.map((item) => <Badge key={item.id} variant="outline">{item.label}</Badge>)
                  ) : (
                    <span className="text-sm text-muted-foreground">All required patterns are present.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {status.kind === "running" && (
          <Alert>
            <LoaderCircle className="animate-spin" />
            <AlertTitle>{status.label}</AlertTitle>
            <AlertDescription>Seeding a fresh database and evaluating your SQL.</AlertDescription>
          </Alert>
        )}

        {status.kind === "hint" && (
          <Alert>
            <CircleAlert />
            <AlertTitle>Replace starter hints first</AlertTitle>
            <AlertDescription>
              <ul className="grid gap-1">
                {status.messages.map((message) => <li key={message}>{message}</li>)}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {status.kind === "error" && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>SQL error</AlertTitle>
            <AlertDescription className="font-mono">{status.message}</AlertDescription>
          </Alert>
        )}

        {status.kind === "ran" && !status.result && (
          <Alert>
            <CheckCircle />
            <AlertTitle>Statement executed</AlertTitle>
            <AlertDescription>{status.rowsAffected} row{status.rowsAffected === 1 ? "" : "s"} affected.</AlertDescription>
          </Alert>
        )}

        {status.kind === "graded" && (
          <Alert variant={status.pass ? "default" : "destructive"}>
            {status.pass ? <CheckCircle /> : <CircleAlert />}
            <AlertTitle>{status.pass ? "Result matches" : "Keep refining"}</AlertTitle>
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}

        {resultSet && <ResultTable data={toDataTable(resultSet)} />}

        {rubric.length > 0 && (
          <div className="rounded-xl border bg-background p-4">
            <p className="mb-3 text-sm font-semibold text-ink">Rubric</p>
            <ul className="grid gap-2 text-sm text-muted-foreground xl:grid-cols-3">
              {rubric.map((item) => <li className="rounded-lg bg-muted/40 p-3" key={item}>{item}</li>)}
            </ul>
          </div>
        )}

        {showAnswer && answer && <CodeBlock code={answer} label="Reference solution" />}
      </CardContent>
    </Card>
  );
}
