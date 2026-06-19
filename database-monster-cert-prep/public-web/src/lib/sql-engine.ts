import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import { SEED_SQL } from "@/data/sql-datasets";

export type SqlCell = string | number | Uint8Array | null;

export interface SqlResultSet {
  columns: string[];
  rows: SqlCell[][];
}

export type SqlRunResult =
  | { ok: true; result: SqlResultSet | null; rowsAffected: number }
  | { ok: false; error: string };

export interface SqlGradeResult {
  pass: boolean;
  message: string;
  userResult?: SqlResultSet | null;
}

let sqlJsPromise: Promise<SqlJsStatic> | null = null;

function loadSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    sqlJsPromise = fetch("/sql-wasm.wasm")
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load SQL engine (${response.status}).`);
        return response.arrayBuffer();
      })
      .then((wasmBinary) => initSqlJs({ wasmBinary }));
  }

  return sqlJsPromise;
}

export function preloadSqlEngine(): void {
  void loadSqlJs();
}

function seededDatabase(SQL: SqlJsStatic): Database {
  const db = new SQL.Database();
  db.run(SEED_SQL);
  return db;
}

export async function runSql(sql: string): Promise<SqlRunResult> {
  let db: Database | null = null;

  try {
    const trimmed = sql.trim();
    if (!trimmed) {
      return { ok: false, error: "Write a query first." };
    }

    const SQL = await loadSqlJs();
    db = seededDatabase(SQL);
    const results = db.exec(trimmed);
    const rowsAffected = db.getRowsModified();
    const last = results.length ? results[results.length - 1] : null;

    return {
      ok: true,
      rowsAffected,
      result: last ? { columns: last.columns, rows: last.values as SqlCell[][] } : null,
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    db?.close();
  }
}

function normalizeCell(cell: SqlCell): string {
  if (cell === null) return "NULL";
  if (cell instanceof Uint8Array) return `blob:${cell.length}`;
  return String(cell).trim();
}

function rowKey(row: SqlCell[]): string {
  return row.map(normalizeCell).join("\u001f");
}

export function compareSqlResults(
  user: SqlResultSet,
  expected: SqlResultSet,
  options: { ordered: boolean },
): boolean {
  if (user.columns.length !== expected.columns.length) return false;
  if (user.rows.length !== expected.rows.length) return false;

  if (options.ordered) {
    return user.rows.every((row, index) => rowKey(row) === rowKey(expected.rows[index]));
  }

  const counts = new Map<string, number>();
  for (const row of expected.rows) {
    const key = rowKey(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  for (const row of user.rows) {
    const key = rowKey(row);
    const count = counts.get(key);
    if (!count) return false;
    counts.set(key, count - 1);
  }

  return true;
}

export async function gradeSql(userSql: string, expectedSql: string): Promise<SqlGradeResult> {
  const userRun = await runSql(userSql);
  if (!userRun.ok) {
    return { pass: false, message: userRun.error };
  }

  const expectedRun = await runSql(expectedSql);
  if (!expectedRun.ok) {
    return { pass: false, message: "Could not evaluate the expected answer." };
  }

  if (!expectedRun.result) {
    const pass = userRun.result === null;
    return {
      pass,
      message: pass ? "Statement executed successfully." : "Expected a statement with no result set.",
      userResult: userRun.result,
    };
  }

  if (!userRun.result) {
    return { pass: false, message: "Your query returned no result set.", userResult: null };
  }

  const ordered = /\border\s+by\b/i.test(expectedSql);
  const pass = compareSqlResults(userRun.result, expectedRun.result, { ordered });

  return {
    pass,
    message: pass
      ? "Correct. Your result set matches the expected output."
      : "The query ran, but the result set does not match the expected output yet.",
    userResult: userRun.result,
  };
}
