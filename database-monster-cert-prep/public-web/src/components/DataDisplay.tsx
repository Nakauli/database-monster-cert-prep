import type { DataTable, SchemaTable } from "@/lib/types";

const sqlKeywords = new Set([
  "SELECT", "FROM", "WHERE", "JOIN", "INNER", "LEFT", "RIGHT", "FULL", "OUTER", "ON",
  "GROUP", "BY", "HAVING", "ORDER", "ASC", "DESC", "LIMIT", "TOP", "INSERT", "INTO",
  "VALUES", "UPDATE", "SET", "DELETE", "CREATE", "TABLE", "VIEW", "INDEX", "TRIGGER",
  "PROCEDURE", "BEGIN", "END", "COMMIT", "ROLLBACK", "AS", "AND", "OR", "NOT", "NULL",
  "IS", "EXISTS", "IN", "UNION", "ALL", "COUNT", "AVG", "SUM", "MIN", "MAX", "DISTINCT",
  "PRIMARY", "FOREIGN", "KEY", "UNIQUE", "CHECK", "DEFAULT", "REFERENCES", "AFTER", "BEFORE",
]);

export function CodeBlock({ code, label = "SQL Query" }: { code: string; label?: string }) {
  const tokens = code.split(/(\s+|[(),;.=<>+-])/);
  return (
    <section className="code-card" aria-label={label}>
      <div className="code-label">
        <span>{label}</span>
        <span aria-hidden="true">SQL</span>
      </div>
      <pre tabIndex={0}>
        <code>
          {tokens.map((token, index) => {
            const normalized = token.toUpperCase();
            const className = sqlKeywords.has(normalized)
              ? "sql-keyword"
              : /^'.*'$/.test(token)
                ? "sql-string"
                : /^\d+$/.test(token)
                  ? "sql-number"
                  : "";
            return <span className={className} key={`${token}-${index}`}>{token}</span>;
          })}
        </code>
      </pre>
    </section>
  );
}

export function SchemaDisplay({ schemas }: { schemas: SchemaTable[] }) {
  return (
    <div className="schema-grid">
      {schemas.map((schema) => (
        <section className="schema-card" key={schema.table}>
          <div className="data-label">Table Schema</div>
          <h3>Table: <code>{schema.table}</code></h3>
          <ul>
            {schema.columns.map((column) => (
              <li key={column.name}>
                <code>{column.name}</code>
                <span>{column.type}</span>
                {column.key && <strong>{column.key}</strong>}
                {column.nullable === false && <strong>NOT NULL</strong>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function ResultTable({ data }: { data: DataTable }) {
  return (
    <section className="table-card">
      <div className="data-label">{data.label ?? "Sample Data"}</div>
      {data.table && <h3>Table: <code>{data.table}</code></h3>}
      <div className="table-scroll" tabIndex={0}>
        <table>
          <thead>
            <tr>{data.columns.map((column) => <th key={column}><code>{column}</code></th>)}</tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((value, columnIndex) => <td key={columnIndex}><code>{value === null ? "NULL" : String(value)}</code></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

