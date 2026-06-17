# 08 — DDL, Constraints, and Indexes

DDL defines objects:

```sql
CREATE TABLE departments (
  department_id INTEGER PRIMARY KEY,
  department_name TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
  course_id INTEGER PRIMARY KEY,
  department_id INTEGER NOT NULL,
  course_code TEXT NOT NULL UNIQUE,
  units INTEGER NOT NULL CHECK (units BETWEEN 1 AND 6),
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (department_id) REFERENCES departments(department_id)
);
```

`ALTER TABLE` support differs. MySQL and SQL Server can add/drop/alter many columns and constraints; SQLite may require creating a replacement table for complex changes.

`DROP TABLE` removes structure and data. `TRUNCATE` removes all rows efficiently in DBMSs that support it, usually without a `WHERE`; transaction/identity behavior differs. SQLite has no `TRUNCATE`, so use `DELETE FROM table`.

## Referential actions

- `RESTRICT` / `NO ACTION`: reject parent change when children exist.
- `CASCADE`: propagate delete/update.
- `SET NULL`: set child FK to NULL; column must allow it.

Choose by business meaning, not convenience.

## Indexes

An index is an auxiliary structure that speeds matching, joining, and sorting at the cost of storage and slower writes.

Good candidates: frequently filtered/joined columns with useful selectivity. Weak candidates: tiny tables, frequently updated low-selectivity columns, and columns never used for access.

```sql
CREATE INDEX idx_enrollments_course
ON enrollments(course_id);
```

Composite index order matters. An index on `(department_id, status)` often supports searches by `department_id` and by both columns, but usually not status alone.

## Clustered versus nonclustered

A clustered index controls physical/logical row order in systems such as SQL Server; generally only one. Nonclustered indexes are separate structures pointing to rows; many may exist. SQLite's storage model differs, so learn this as a cross-platform concept.

## EXPLAIN

`EXPLAIN QUERY PLAN SELECT ...` in SQLite shows scans and index searches. A scan is not always bad—small tables or queries returning most rows may favor it.

## Common traps

- Constraints protect integrity; application validation alone is not enough.
- More indexes are not always better.
- An FK does not always create an index automatically.
- A default applies only when a column is omitted (DBMS details vary).
