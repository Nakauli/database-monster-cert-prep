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

export function SchemaDisplay({ schemas }: { schemas: SchemaTable[] }) {
  return (
    <div className="my-5 grid gap-3 md:grid-cols-2">
      {schemas.map((schema) => (
        <Card className="bg-card/90" key={schema.table}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>Table: <code>{schema.table}</code></span>
              <Badge variant="secondary">Schema</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {schema.columns.map((column) => (
                <li className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border bg-muted/30 p-3 text-sm" key={column.name}>
                  <code className="font-semibold text-ink">{column.name}</code>
                  <span className="font-mono text-xs text-muted-foreground">{column.type}</span>
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
