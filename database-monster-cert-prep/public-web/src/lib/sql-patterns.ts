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

function normalizeSql(sql: string): string {
  return sql.trim().replace(/\s+/g, " ");
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
