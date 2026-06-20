import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DataTable, SchemaTable } from "@/lib/types";

const sqlKeywords = new Set([
  "SELECT", "FROM", "WHERE", "JOIN", "INNER", "LEFT", "RIGHT", "FULL", "OUTER", "ON",
  "GROUP", "BY", "HAVING", "ORDER", "ASC", "DESC", "LIMIT", "TOP", "INSERT", "INTO",
  "VALUES", "UPDATE", "SET", "DELETE", "CREATE", "TABLE", "VIEW", "INDEX", "TRIGGER",
  "PROCEDURE", "BEGIN", "END", "COMMIT", "ROLLBACK", "AS", "AND", "OR", "NOT", "NULL",
  "IS", "EXISTS", "IN", "UNION", "ALL", "COUNT", "AVG", "SUM", "MIN", "MAX", "DISTINCT",
  "PRIMARY", "FOREIGN", "KEY", "UNIQUE", "CHECK", "DEFAULT", "REFERENCES", "AFTER", "BEFORE",
  "CASE", "WHEN", "THEN", "ELSE", "LIKE", "BETWEEN",
]);

export function CodeBlock({ code, label = "SQL query" }: { code: string; label?: string }) {
  const tokens = code.split(/(\s+|[(),;.=<>+-])/);

  return (
    <Card className="my-5 overflow-hidden bg-card py-0">
      <div className="flex items-center justify-between border-b bg-muted/60 px-4 py-2">
        <span className="mono-label">{label}</span>
        <Badge variant="outline">SQL</Badge>
      </div>
      <pre className="sql-code" tabIndex={0}>
        <code>
          {tokens.map((token, index) => {
            const normalized = token.toUpperCase();
            const className = sqlKeywords.has(normalized)
              ? "text-teal-200 font-semibold"
              : /^'.*'$/.test(token)
                ? "text-amber-200"
                : /^\d+$/.test(token)
                  ? "text-orange-200"
                  : "";
            return <span className={className} key={`${token}-${index}`}>{token}</span>;
          })}
        </code>
      </pre>
    </Card>
  );
}

export function SchemaDisplay({ schemas, compact = false }: { schemas: SchemaTable[]; compact?: boolean }) {
  if (compact) {
    return (
      <div className="grid gap-3">
        {schemas.map((schema) => (
          <div className="min-w-0 rounded-xl border border-primary/15 bg-background p-3 shadow-none" key={schema.table}>
            <div className="mb-2 flex min-w-0 flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">
                Table: <code className="font-mono">{schema.table}</code>
              </p>
              <Badge variant="secondary">Schema</Badge>
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {schema.columns.map((column) => (
                <li
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-muted/20 px-2.5 py-1 text-xs"
                  key={column.name}
                >
                  <span className="flex min-w-0 items-baseline gap-1.5">
                    <code className="truncate font-semibold text-ink">{column.name}</code>
                    <span className="shrink-0 font-mono text-[0.62rem] text-muted-foreground">{column.type}</span>
                  </span>
                  {(column.key || column.nullable === false) && (
                    <span className="flex shrink-0 gap-1">
                      {column.key && (
                        <span className="rounded-full border bg-background px-1.5 py-0.5 text-[0.58rem] font-medium leading-none text-muted-foreground">
                          {column.key === "PRIMARY KEY" ? "PK" : column.key === "FOREIGN KEY" ? "FK" : column.key}
                        </span>
                      )}
                      {column.nullable === false && (
                        <span className="rounded-full border bg-background px-1.5 py-0.5 text-[0.58rem] font-medium leading-none text-muted-foreground">
                          NOT NULL
                        </span>
                      )}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="my-5 grid gap-3 md:grid-cols-2">
      {schemas.map((schema) => (
        <Card className="min-w-0 bg-card/90" key={schema.table}>
          <CardHeader>
            <CardTitle className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <span className="min-w-0">Table: <code className="break-words">{schema.table}</code></span>
              <Badge variant="secondary">Schema</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {schema.columns.map((column) => (
                <li
                  className="grid min-w-0 grid-cols-[1fr_auto] gap-2 rounded-lg border bg-muted/30 p-3 text-sm"
                  key={column.name}
                >
                  <div className="contents min-w-0 gap-x-2 gap-y-1">
                    <code className="min-w-0 break-words font-semibold text-ink">{column.name}</code>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">{column.type}</span>
                  </div>
                  {(column.key || column.nullable === false) && (
                    <span className="col-span-2 flex flex-wrap gap-2">
                      {column.key && <Badge variant="outline">{column.key}</Badge>}
                      {column.nullable === false && <Badge variant="outline">NOT NULL</Badge>}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ResultTable({ data }: { data: DataTable }) {
  return (
    <Card className="my-5 overflow-hidden bg-card py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/60 px-4 py-2">
        <span className="mono-label">{data.label ?? "Sample data"}</span>
        {data.table && <Badge variant="outline">Table: {data.table}</Badge>}
      </div>
      <div className="overflow-x-auto" tabIndex={0}>
        <Table>
          <TableHeader>
            <TableRow>
              {data.columns.map((column) => (
                <TableHead key={column}><code>{column}</code></TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((value, columnIndex) => (
                  <TableCell key={columnIndex}><code>{value === null ? "NULL" : String(value)}</code></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
