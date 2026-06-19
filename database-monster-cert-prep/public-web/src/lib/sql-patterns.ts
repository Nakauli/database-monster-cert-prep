export interface SqlExpectedPattern {
  id: string;
  label: string;
  pattern: string;
  hint?: string;
}

export interface SqlPatternCheckResult {
  matched: SqlExpectedPattern[];
  missing: SqlExpectedPattern[];
  score: number;
  executed: false;
}

export interface SqlHintWarning {
  label: string;
  message: string;
}

const starterHintLabels = new Set([
  "add condition",
  "add sort",
  "choose join",
  "column",
  "condition",
  "correlated query",
  "filter groups",
  "finish safely",
  "insert audit row",
  "scalar subquery",
  "which join keeps unmatched students?",
]);

function normalizeSql(sql: string): string {
  return sql.trim().replace(/\s+/g, " ");
}

export function findUnresolvedSqlHints(sql: string): SqlHintWarning[] {
  const warnings: SqlHintWarning[] = [];
  const commentPattern = /\/\*\s*([^*]+?)\s*\*\//g;

  for (const match of sql.matchAll(commentPattern)) {
    const rawLabel = match[1].trim().replace(/\s+/g, " ");
    const label = rawLabel.replace(/^todo:\s*/i, "");
    if (!/^todo:/i.test(rawLabel) && !starterHintLabels.has(label.toLowerCase())) continue;

    warnings.push({
      label,
      message: `Replace the ${label} hint with a real SQL clause before running.`,
    });
  }

  return warnings;
}

export function checkSqlPatterns(sql: string, patterns: SqlExpectedPattern[]): SqlPatternCheckResult {
  const normalized = normalizeSql(sql);
  const matched: SqlExpectedPattern[] = [];
  const missing: SqlExpectedPattern[] = [];

  for (const expected of patterns) {
    const expression = new RegExp(expected.pattern, "i");
    if (expression.test(normalized)) {
      matched.push(expected);
    } else {
      missing.push(expected);
    }
  }

  const score = patterns.length ? Math.round((matched.length / patterns.length) * 100) : 100;

  return {
    matched,
    missing,
    score,
    executed: false,
  };
}
