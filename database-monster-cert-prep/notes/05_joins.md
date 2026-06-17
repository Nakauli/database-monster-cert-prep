# 05 — Joins

## Pick the join from the required rows

| Need | Join |
|---|---|
| Only matching rows | `INNER JOIN` |
| Every left row, matches when available | `LEFT JOIN` |
| Every right row | `RIGHT JOIN` |
| Every row from both sides | `FULL OUTER JOIN` |
| Every combination | `CROSS JOIN` |
| Relate a table to itself | `SELF JOIN` |

SQLite supports inner, left, and cross joins. Modern SQLite supports right/full joins, but portable exercises often simulate full joins with `UNION`.

```sql
SELECT s.full_name, c.course_code, e.grade
FROM students AS s
JOIN enrollments AS e ON e.student_id = s.student_id
JOIN courses AS c ON c.course_id = e.course_id;
```

## Preserving outer rows

This keeps students even if they have no 2026 enrollment:

```sql
SELECT s.full_name, e.course_id
FROM students AS s
LEFT JOIN enrollments AS e
  ON e.student_id = s.student_id
 AND e.school_year = '2025-2026';
```

Putting `e.school_year = ...` in `WHERE` removes the NULL-extended rows and often turns the result into inner-join behavior.

## Duplicate diagnosis

Joins multiply matching rows. If one student has three enrollments, joining students to enrollments returns three rows for that student. That is not automatically an error. Unexpected multiplication usually means:

- missing join condition,
- incomplete composite-key condition,
- joining two one-to-many paths,
- data contains duplicate relationship rows.

Do not hide a faulty join with `DISTINCT`.

## Self join

```sql
SELECT employee.name, manager.name AS manager_name
FROM employees AS employee
LEFT JOIN employees AS manager
  ON manager.employee_id = employee.manager_id;
```

## Common traps

- `ON a.id = a.id` is always true and creates a Cartesian effect.
- `LEFT JOIN` preserves the table written on the left.
- A cross join of 4 and 5 rows returns 20 rows.
- Joining on names instead of stable keys risks false matches.
