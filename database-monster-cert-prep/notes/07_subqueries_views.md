# 07 — Subqueries, Set Operations, CASE, CTEs, and Views

## Subquery types

- **Scalar:** returns one value; usable with `=`, `<`, etc.
- **Multi-row:** returns a set; use `IN`, `ANY`, or `ALL` where supported.
- **Correlated:** refers to the outer row and runs conceptually per outer row.

```sql
SELECT full_name
FROM students
WHERE student_id IN (
  SELECT student_id FROM enrollments WHERE grade >= 90
);
```

## EXISTS

`EXISTS` tests whether at least one row exists. The selected expression inside is irrelevant.

```sql
SELECT s.full_name
FROM students AS s
WHERE EXISTS (
  SELECT 1
  FROM enrollments AS e
  WHERE e.student_id = s.student_id
);
```

`NOT EXISTS` is usually safer than `NOT IN` when nulls may appear.

## UNION

`UNION` combines compatible result sets and removes duplicates. `UNION ALL` retains duplicates and is usually faster. Both queries need the same number of columns with compatible types. One final `ORDER BY` sorts the combined result.

## CASE

```sql
SELECT full_name,
       CASE
         WHEN status = 'active' THEN 'Current'
         WHEN status = 'graduated' THEN 'Alumni'
         ELSE 'Other'
       END AS category
FROM students;
```

## CTE

A common table expression names a query for one statement:

```sql
WITH course_counts AS (
  SELECT course_id, COUNT(*) AS n
  FROM enrollments
  GROUP BY course_id
)
SELECT * FROM course_counts WHERE n >= 2;
```

CTEs improve readability and can be recursive in supported DBMSs. They are not automatically stored or indexed.

## Views

A view stores a query definition, not normally a separate copy of its rows.

```sql
CREATE VIEW active_students AS
SELECT student_id, full_name, department_id
FROM students
WHERE status = 'active';
```

Views simplify queries and can restrict exposed columns/rows, but they do not replace proper permissions. View updatability depends on the DBMS and query complexity.

## Common traps

- `=` with a multi-row subquery causes an error.
- A scalar subquery returning no rows usually yields NULL.
- `UNION` is vertical stacking; a join is horizontal combination.
- A correlated subquery must correctly reference the outer alias.
