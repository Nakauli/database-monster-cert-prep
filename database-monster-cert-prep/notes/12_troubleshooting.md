# 12 — Troubleshooting SQL

## A disciplined debugging loop

1. Read the exact error and line.
2. Reduce the query to the smallest failing part.
3. Verify table and column names with the schema.
4. Check data types and sample values.
5. Add joins and predicates one at a time.
6. Compare expected row counts after each step.
7. Use a transaction for repair experiments.

## Error map

| Symptom | Likely cause | First check |
|---|---|---|
| Syntax error | comma, quote, keyword, clause order | error location |
| Duplicate key | PK/UNIQUE collision | existing key |
| FK failure | parent absent or child exists | referenced rows |
| NOT NULL failure | required value omitted/null | insert column list |
| Wrong row count | predicate precedence or join | intermediate counts |
| Duplicate-looking rows | one-to-many join | relationship cardinality |
| Missing outer rows | right filter in `WHERE` | move predicate to `ON` |
| NULL mismatch | used `= NULL` | use `IS NULL` |

## Wrong-results strategy

Start with each base table. Then join two tables only and select the key columns. Confirm cardinality. Add the next join. Only after row shape is correct should you add grouping and presentation columns.

## SQLite tools

```sql
PRAGMA table_info(students);
PRAGMA foreign_key_list(enrollments);
PRAGMA foreign_keys = ON;
EXPLAIN QUERY PLAN
SELECT * FROM enrollments WHERE student_id = 1;
```

## Common logic bugs

- Missing parentheses around mixed `AND`/`OR`.
- Using inner join when unmatched rows are required.
- Comparing text to numbers or dates stored inconsistently.
- Grouping at the wrong level.
- `NOT IN` subquery includes NULL.
- Updating rows before previewing the predicate.

## Exam triage

For a broken query question, classify before solving: syntax, data type, key/constraint, join/cardinality, aggregation, NULL, or permission. Eliminate choices that address a different class of problem.
