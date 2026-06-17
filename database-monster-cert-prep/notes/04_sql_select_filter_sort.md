# 04 — SELECT, Filtering, and Sorting

## Logical query order

Think in this order even though SQL is written differently:

`FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT`

That explains why a `SELECT` alias often cannot be used in `WHERE`: the alias does not logically exist yet.

```sql
SELECT student_id, full_name AS student
FROM students
WHERE status = 'active'
ORDER BY full_name ASC
LIMIT 5;
```

SQL Server uses `TOP (5)` after `SELECT`; MySQL/PostgreSQL/SQLite use `LIMIT 5`.

## Predicates

- `BETWEEN 10 AND 20` is inclusive.
- `IN ('active', 'graduated')` is compact equality logic.
- `LIKE 'Mar%'` begins with Mar; `%` means any sequence, `_` one character.
- `IS NULL` and `IS NOT NULL` handle nulls.
- `AND` is evaluated before `OR`; use parentheses when intent matters.

```sql
WHERE status = 'active'
  AND (city = 'Manila' OR city = 'Pasig')
```

## DISTINCT and ordering

`DISTINCT` removes duplicate result rows after expressions are selected. It does not modify stored data. `ORDER BY 1` works in many systems but explicit column names are clearer. Without `ORDER BY`, row order is not guaranteed.

## Expressions and aliases

```sql
SELECT full_name,
       COALESCE(email, 'No email') AS email_display,
       tuition_due - amount_paid AS balance
FROM students;
```

Use `COALESCE` for the first non-null expression. Arithmetic involving NULL usually returns NULL.

## Common traps

- `WHERE city = 'Manila' OR 'Pasig'` is invalid logic; repeat the column or use `IN`.
- `NOT IN` can behave unexpectedly if the list/subquery contains NULL; prefer `NOT EXISTS` when nulls are possible.
- Text values require quotes; numeric values generally do not.
- `LIMIT` without `ORDER BY` gives an arbitrary subset.
- `SELECT *` can fetch unnecessary data and make applications fragile.
