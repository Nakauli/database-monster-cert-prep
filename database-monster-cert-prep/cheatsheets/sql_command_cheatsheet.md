# SQL Command Cheatsheet

```sql
SELECT [DISTINCT] columns
FROM table
[JOIN table2 ON condition]
[WHERE row_condition]
[GROUP BY columns]
[HAVING group_condition]
[ORDER BY columns ASC|DESC]
[LIMIT n];
```

Logical order: `FROM → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT`.

```sql
INSERT INTO t(a, b) VALUES (?, ?);
UPDATE t SET a = ? WHERE id = ?;
DELETE FROM t WHERE id = ?;
BEGIN; SAVEPOINT s1; ROLLBACK TO s1; COMMIT;
```

NULL: `IS NULL`, `IS NOT NULL`, `COALESCE(value, fallback)`.
SQL Server row limit: `SELECT TOP (10) ...`; SQLite/MySQL: `... LIMIT 10`.
