# 06 — Grouping and Aggregation

Aggregate functions summarize rows:

- `COUNT(*)` counts rows.
- `COUNT(column)` counts non-null values.
- `COUNT(DISTINCT column)` counts distinct non-null values.
- `SUM`, `AVG`, `MIN`, `MAX` normally ignore NULL.

```sql
SELECT course_id, COUNT(*) AS enrollment_count, AVG(grade) AS average_grade
FROM enrollments
GROUP BY course_id
HAVING COUNT(*) >= 2;
```

## WHERE versus HAVING

`WHERE` filters individual rows before grouping. `HAVING` filters groups after aggregation.

```sql
SELECT department_id, COUNT(*) AS active_students
FROM students
WHERE status = 'active'
GROUP BY department_id
HAVING COUNT(*) >= 3;
```

## Grouping rule

Every selected expression should either be aggregated or be functionally determined by/grouped with the grouping columns. Strict SQL engines reject non-grouped columns; permissive engines may return an arbitrary value.

## Conditional aggregation

```sql
SELECT
  COUNT(*) AS all_students,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_students
FROM students;
```

## Outer joins and counting

To list all courses including empty courses:

```sql
SELECT c.course_code, COUNT(e.student_id) AS student_count
FROM courses AS c
LEFT JOIN enrollments AS e ON e.course_id = c.course_id
GROUP BY c.course_id, c.course_code;
```

Use `COUNT(e.student_id)`, not `COUNT(*)`; the left row still exists even when no enrollment matches.

## Common traps

- Aggregate functions cannot normally appear in `WHERE`.
- `AVG` ignores NULL, so it may divide by fewer rows than `COUNT(*)`.
- Grouping by too many columns makes groups too small.
- Filtering the right table in `WHERE` can remove empty groups from a left join.
