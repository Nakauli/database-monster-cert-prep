// Client-side SQLite (sql.js / WASM) engine. The WASM module is loaded once and
// cached; every query runs against a *fresh* in-memory database seeded from the
// canonical dataset so DDL/DML/trigger labs never leak state between runs.
//
// Static-export safe: the .wasm asset lives in /public and is resolved via
// `locateFile`, so no bundler/runtime path magic is required.

import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import { SEED_SQL_FULL } from "@/data/sql-datasets";

export type SqlCell = string | number | Uint8Array | null;

export interface SqlResultSet {
  columns: string[];
  rows: SqlCell[][];
}

export type SqlRunResult =
  | { ok: true; result: SqlResultSet | null; rowsAffected: number }
  | { ok: false; error: string };

let sqlJsPromise: Promise<SqlJsStatic> | null = null;

function loadSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    // Fetch the WASM binary ourselves and hand it to Emscripten via
    // `wasmBinary`. This sidesteps sql.js's internal path resolution, which can
    // break under bundlers (Turbopack/webpack) — the .wasm lives in /public.
    sqlJsPromise = fetch("/sql-wasm.wasm")
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to fetch SQL engine (${response.status}).`);
        return response.arrayBuffer();
      })
      .then((wasmBinary) => initSqlJs({ wasmBinary }));
  }
  return sqlJsPromise;
}

/** Eagerly warm up the WASM module (e.g. on a page that will use SQL soon). */
export function preloadSqlEngine(): void {
  void loadSqlJs();
}

function seededDatabase(SQL: SqlJsStatic): Database {
  const db = new SQL.Database();
  db.run(SEED_SQL_FULL);
  return db;
}

/**
 * Run arbitrary SQL against a freshly seeded database. Returns the LAST result
 * set produced (matching how a SQL console shows the final SELECT), or null for
 * statements that yield no rows (INSERT/UPDATE/DDL).
 */
export async function runSql(sql: string): Promise<SqlRunResult> {
  let db: Database | null = null;
  try {
    const SQL = await loadSqlJs();
    db = seededDatabase(SQL);

    const trimmed = sql.trim();
    if (!trimmed) {
      return { ok: false, error: "Write a query first." };
    }

    const results = db.exec(trimmed);
    const rowsAffected = db.getRowsModified();
    const last = results.length ? results[results.length - 1] : null;

    return {
      ok: true,
      rowsAffected,
      result: last
        ? { columns: last.columns, rows: last.values as SqlCell[][] }
        : null,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    db?.close();
  }
}

function normalizeCell(cell: SqlCell): string {
  if (cell === null) return "␀NULL";
  if (cell instanceof Uint8Array) return `blob:${cell.length}`;
  if (typeof cell === "number") {
    // Treat 92 and 92.0 as equal.
    return Number.isInteger(cell) ? String(cell) : String(cell);
  }
  return String(cell).trim();
}

function rowKey(row: SqlCell[]): string {
  return row.map(normalizeCell).join("␟");
}

/** Order-insensitive multiset comparison of two result sets (by value, not column name). */
function sameResultSet(a: SqlResultSet, b: SqlResultSet, ordered: boolean): boolean {
  if (a.columns.length !== b.columns.length) return false;
  if (a.rows.length !== b.rows.length) return false;
  if (ordered) {
    return a.rows.every((row, i) => rowKey(row) === rowKey(b.rows[i]));
  }
  const counts = new Map<string, number>();
  for (const row of a.rows) {
    const k = rowKey(row);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  for (const row of b.rows) {
    const k = rowKey(row);
    const n = counts.get(k);
    if (!n) return false;
    counts.set(k, n - 1);
  }
  return true;
}

export interface GradeResult {
  pass: boolean;
  message: string;
  userResult?: SqlResultSet | null;
}

/**
 * Auto-grade a user query against an expected query. Both run on freshly seeded
 * databases and their result sets are compared by value. Comparison is
 * order-sensitive only when the user's query contains ORDER BY (so sorting is
 * graded when the task asks for it, and ignored otherwise).
 */
export async function gradeSql(userSql: string, expectedSql: string): Promise<GradeResult> {
  const userRun = await runSql(userSql);
  if (!userRun.ok) {
    return { pass: false, message: userRun.error };
  }
  const expectedRun = await runSql(expectedSql);
  if (!expectedRun.ok) {
    // Misconfigured question — fail open with a clear signal.
    return { pass: false, message: "Could not evaluate the expected answer." };
  }

  // Non-SELECT exercises (DDL/DML) won't return a result set; accept if the
  // statement executed without error.
  if (!expectedRun.result) {
    return {
      pass: !!userRun.ok && userRun.result === null,
      message:
        userRun.result === null
          ? "Statement executed successfully."
          : "Expected a data-changing statement, not a result set.",
      userResult: userRun.result,
    };
  }

  if (!userRun.result) {
    return { pass: false, message: "Your query returned no result set.", userResult: null };
  }

  const ordered = /\border\s+by\b/i.test(userSql);
  const pass = sameResultSet(userRun.result, expectedRun.result, ordered);
  return {
    pass,
    message: pass
      ? "Correct — your result set matches the expected output."
      : "Your result set does not match the expected output yet.",
    userResult: userRun.result,
  };
}
