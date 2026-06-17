"""Generate the written curriculum, SQL labs, and starter data files.

Run from the project root:
    python tools/build_curriculum.py
"""

from __future__ import annotations

import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def write(relative_path: str, content: str) -> None:
    path = ROOT / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.strip() + "\n", encoding="utf-8")


NOTES = {
    "notes/01_core_database_concepts.md": r"""
# 01 — Core Database Concepts

## The exam-ready model

A **database** is an organized collection of related data. A **DBMS** is the software used to define, store, query, secure, and recover that data. An **RDBMS** is a DBMS based mainly on the relational model: data is represented as tables and related through keys.

| Term | Meaning | Example |
|---|---|---|
| Table / relation | Data about one type of thing | `students` |
| Row / record / tuple | One occurrence | one student |
| Column / field / attribute | One property | `email` |
| Schema | The structure and rules | tables, columns, constraints |
| Instance | Data at a particular moment | today's rows |

Memory trick: **schema is the blueprint; instance is the snapshot**.

## Keys

- **Primary key (PK):** selected identifier; unique and not null.
- **Candidate key:** any minimal attribute set that could uniquely identify a row.
- **Alternate key:** a candidate key not chosen as the PK.
- **Foreign key (FK):** column(s) referencing a candidate/primary key in another table.
- **Composite key:** key made from multiple columns.
- **Surrogate key:** system-created identifier such as `student_id`.
- **Natural key:** meaningful real-world value such as a government-issued code.

A foreign key normally allows duplicates because many child rows may refer to one parent. It may allow `NULL` when the relationship is optional.

## Relationships

- **One-to-one:** place a unique FK on one side.
- **One-to-many:** put the FK on the many/child side.
- **Many-to-many:** create a junction table with two FKs, often a composite PK.

Example: students and courses are many-to-many, resolved by `enrollments(student_id, course_id)`.

## Data types and NULL

Choose the narrowest type that correctly represents the domain. IDs may be integers; dates should use date-aware types where supported; money should use fixed precision, not floating point.

`NULL` means unknown, missing, or not applicable. It is not zero, an empty string, or the text `"NULL"`. Use `IS NULL`, never `= NULL`. Most comparisons with `NULL` produce **UNKNOWN**, so the row is not selected by `WHERE`.

## Integrity constraints

- `PRIMARY KEY`: entity integrity.
- `FOREIGN KEY`: referential integrity.
- `UNIQUE`: prevents duplicate non-null values (exact NULL behavior varies).
- `NOT NULL`: requires a value.
- `CHECK`: enforces a condition.
- `DEFAULT`: supplies a value when omitted; it does not override explicit `NULL`.

## Common traps

1. A primary key identifies a row; an index mainly speeds access. A PK often creates an index, but the concepts are not identical.
2. Deleting a parent row may fail because child rows reference it.
3. `NULL` is handled with three-valued logic.
4. A table can have several candidate keys but only one chosen primary key.

## Quick exam drill

If each employee has one department and a department has many employees, put `department_id` in `employees`. If employees may belong to many projects, create `employee_projects`.
""",
    "notes/02_database_design_and_erd.md": r"""
# 02 — Database Design and ERDs

## From requirements to tables

1. Find nouns that need stored data → candidate **entities**.
2. Find properties → **attributes**.
3. Identify a stable key for each entity.
4. Find business verbs → **relationships**.
5. State cardinality and optionality in both directions.
6. Resolve many-to-many relationships with an associative/junction entity.
7. Add constraints that express business rules.

## ERD vocabulary

**Cardinality** is the maximum participation: one or many. **Optionality** is the minimum: zero or one. `0..*` means zero to many; `1..1` means exactly one.

Example rules:

- A department offers zero or many courses.
- Every course belongs to exactly one department.
- A student enrolls in zero or many courses.
- A course has zero or many students.

The last two rules require `enrollments`.

## Strong design choices

- Store one fact in one place.
- Give every table a clear subject.
- Avoid repeating groups (`phone1`, `phone2`, `phone3`).
- Avoid comma-separated lists inside a column.
- Do not store values that can reliably be calculated unless performance/history requires it.
- Name FKs consistently with the referenced key.
- Model relationship facts on the junction table. `grade` belongs to an enrollment, not merely a student or course.

## One-to-one implementation

A one-to-one relationship is usually implemented with an FK plus `UNIQUE`, or with a child PK that is also an FK. Ask whether the entities genuinely have different lifecycles; otherwise they may belong in one table.

## Surrogate versus natural keys

Surrogate keys are short, stable, and easy for FKs. Natural keys carry meaning but may change or be wide. A common design uses a surrogate PK and a `UNIQUE` constraint on the meaningful natural identifier.

## Bad design diagnosis

`Student(student_id, name, course1, course2, teacher1, teacher2)` has repeating groups and mixed subjects. Split it into `students`, `courses`, `instructors`, and `enrollments`.

## Common traps

- An FK goes on the many side, not automatically on the "more important" table.
- A junction table can have its own surrogate PK, but the pair of FKs should still usually be `UNIQUE`.
- Optionality is a business rule, not a guess based on current data.
- An ERD models structure; it does not show every query or screen.
""",
    "notes/03_normalization.md": r"""
# 03 — Normalization

Normalization reduces update, insertion, and deletion anomalies by organizing facts according to their dependencies.

## Functional dependency

`X → Y` means each value of X determines exactly one value of Y. If `student_id → student_name`, one student ID determines one student name.

## First Normal Form (1NF)

- Each cell contains one atomic value for the chosen design.
- No repeating groups or arrays of similar columns.
- Rows are distinguishable by a key.

Violation: `student_id, phones = "0917...,0998..."`. Fix with `student_phones(student_id, phone)`.

## Second Normal Form (2NF)

Be in 1NF and remove **partial dependencies**: a non-key attribute must not depend on only part of a composite candidate key.

In `enrollment(student_id, course_id, student_name, course_title, grade)`, the key is `(student_id, course_id)`. `student_name` depends only on `student_id`; `course_title` only on `course_id`. Move those facts to their parent tables. `grade` depends on the whole pair.

If every candidate key is a single column, partial dependency is impossible.

## Third Normal Form (3NF)

Be in 2NF and remove **transitive dependencies** between non-key attributes.

`employee_id → department_id → department_name` means `department_name` belongs in `departments`, not `employees`.

Memory trick: non-key facts depend on **the key, the whole key, and nothing but the key**.

## BCNF basics

For every non-trivial dependency `X → Y`, X must be a superkey. BCNF is stricter than 3NF and matters when overlapping candidate keys create unusual dependencies.

## Anomalies

- **Update:** department name must be changed in many rows.
- **Insert:** cannot add a course until a student enrolls.
- **Delete:** deleting the final enrollment accidentally removes course information.

## Denormalization

Deliberately duplicate or precompute data only for a measured reason such as reporting speed. Document the source of truth and synchronization strategy. Denormalization trades easier reads for harder writes and greater integrity risk.

## Exam method

1. Write the candidate key.
2. Write dependencies.
3. Check atomicity/repeating groups.
4. For a composite key, look for partial dependencies.
5. Look for non-key → non-key dependencies.

## Common traps

- 2NF is about partial dependency, not merely "having two tables."
- A comma-separated list violates relational design even if the DBMS accepts it.
- Normalization is driven by dependencies, not by the number of columns.
""",
    "notes/04_sql_select_filter_sort.md": r"""
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
""",
    "notes/05_joins.md": r"""
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
""",
    "notes/06_grouping_aggregation.md": r"""
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
""",
    "notes/07_subqueries_views.md": r"""
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
""",
    "notes/08_ddl_constraints_indexes.md": r"""
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
""",
    "notes/09_dml_transactions.md": r"""
# 09 — DML and Transactions

DML changes rows:

```sql
INSERT INTO students(full_name, email, status)
VALUES ('Ana Reyes', 'ana@example.com', 'active');

UPDATE students
SET status = 'graduated'
WHERE student_id = 12;

DELETE FROM students
WHERE student_id = 12;
```

## Safety routine

Before `UPDATE` or `DELETE`:

1. Write the `WHERE`.
2. Run it as a `SELECT`.
3. Confirm the exact rows.
4. Start a transaction if appropriate.
5. Run the change and verify row count.
6. Commit only when correct.

Omitting `WHERE` affects every row.

## ACID

- **Atomicity:** all or none.
- **Consistency:** rules hold before and after.
- **Isolation:** concurrent transactions interfere in controlled ways.
- **Durability:** committed work survives failure.

```sql
BEGIN;
UPDATE payments SET amount = amount + 500 WHERE payment_id = 1;
SAVEPOINT checked_amount;
UPDATE payments SET amount = -1 WHERE payment_id = 2; -- would violate a check
ROLLBACK TO checked_amount;
COMMIT;
```

Syntax and implicit-commit rules vary. SQLite supports `BEGIN`, `COMMIT`, `ROLLBACK`, and savepoints.

## Concurrency concepts

Isolation levels trade concurrency for protection against anomalies such as dirty reads, nonrepeatable reads, and phantom rows. Certification questions usually test the concepts, not engine internals.

## Constraint failures

- Duplicate PK/UNIQUE → duplicate key error.
- Missing parent → FK failure.
- Invalid domain → CHECK failure.
- Missing required value → NOT NULL failure.

Handle errors and roll back when a multi-step business operation cannot finish.

## Common traps

- `ROLLBACK` cannot undo a transaction already committed.
- A transaction is valuable when statements form one logical unit.
- Cascading deletes may remove far more data than expected.
- String-built SQL invites injection; parameterize values.
""",
    "notes/10_stored_procedures_functions_triggers.md": r"""
# 10 — Stored Procedures, Functions, and Triggers

## Procedures and functions

A stored procedure is a named server-side program that may accept input/output parameters, run multiple statements, manage a business operation, and return result sets. A function normally returns a value/table and is usable inside expressions, subject to DBMS restrictions.

SQLite does not support server-side stored procedures. Put reusable operations in parameterized application functions or use views/triggers where appropriate.

### MySQL procedure

```sql
DELIMITER //
CREATE PROCEDURE GetStudentsByDepartment(IN p_department_id INT)
BEGIN
  SELECT student_id, full_name
  FROM students
  WHERE department_id = p_department_id;
END//
DELIMITER ;

CALL GetStudentsByDepartment(1);
```

### SQL Server procedure

```sql
CREATE PROCEDURE dbo.GetStudentsByDepartment
  @DepartmentId INT
AS
BEGIN
  SET NOCOUNT ON;
  SELECT student_id, full_name
  FROM dbo.students
  WHERE department_id = @DepartmentId;
END;

EXEC dbo.GetStudentsByDepartment @DepartmentId = 1;
```

## Triggers

A trigger runs automatically in response to events. Common uses: audit trails, derived-value enforcement, and rules that cannot be expressed with a constraint. Risks: hidden side effects, recursion, multi-row mistakes, performance cost, and difficult debugging.

SQLite uses `OLD.column` and `NEW.column` per row. MySQL uses similar row aliases. SQL Server triggers are statement-level and expose `inserted`/`deleted` tables, which may contain many rows.

### SQLite audit trigger

```sql
CREATE TRIGGER payments_after_update
AFTER UPDATE OF amount ON payments
FOR EACH ROW
BEGIN
  INSERT INTO audit_logs(table_name, record_id, action, old_value, new_value)
  VALUES ('payments', OLD.payment_id, 'UPDATE',
          CAST(OLD.amount AS TEXT), CAST(NEW.amount AS TEXT));
END;
```

## When to use—or avoid

Use a constraint for simple integrity first. Use a procedure for an explicit reusable operation. Use a trigger when every write path must automatically enforce/log an event. Avoid triggers for complex workflows that users need to see and control.

## Common traps

- A trigger is not called manually.
- SQL Server triggers must handle multiple affected rows.
- A procedure cannot be used exactly like a scalar function.
- Parameterized procedures help security, but dynamic SQL inside them can still be injectable.
""",
    "notes/11_security_admin_backup.md": r"""
# 11 — Security, Administration, and Backups

## Authentication and authorization

**Authentication** proves identity. **Authorization** decides permitted actions. Use roles to group permissions and apply **least privilege**: grant only what is needed, for only as long as needed.

```sql
GRANT SELECT ON students TO reporting_role;
REVOKE UPDATE ON students FROM reporting_role;
```

SQL Server also supports `DENY`, which explicitly blocks a permission and can override grants. Exact syntax differs by DBMS.

## SQL injection

Never concatenate untrusted values into SQL.

```python
# Correct SQLite parameterization
cursor.execute(
    "SELECT * FROM students WHERE email = ?",
    (email,)
)
```

Parameters represent values, not table names or SQL keywords. Dynamic identifiers require allow-listing.

## Defense in depth

- strong authentication and secret handling,
- least-privilege accounts,
- encryption in transit and at rest,
- patching,
- validation plus DB constraints,
- auditing and monitoring,
- tested backups,
- restricted network access.

## Backup concepts

A backup is useful only if restoration works. Know:

- full, differential, and transaction-log/incremental concepts,
- recovery point objective (acceptable data loss),
- recovery time objective (acceptable downtime),
- off-site/offline copies,
- retention and encryption,
- periodic restore tests.

SQLite backup may be a safe file copy while no write is occurring, the backup API, or `.backup`. Copying a live changing file carelessly can be inconsistent.

## Integrity versus security

Integrity means data remains valid and consistent; security protects confidentiality, integrity, and availability against unauthorized action. Constraints help integrity but do not replace access control.

## Common traps

- Application hiding is not authorization.
- Hash passwords with a dedicated password-hashing algorithm; do not encrypt/store plaintext passwords.
- A successful backup job does not prove restorability.
- Do not grant administrator privileges to solve a narrow permission problem.
""",
    "notes/12_troubleshooting.md": r"""
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
""",
}


PLANS = {
    "study_plan/emergency_48_hour_plan.md": r"""
# Emergency 48-Hour Plan

Use 50-minute focus blocks with 10-minute breaks. Type every query yourself.

## Day 1 — Foundations and high-yield SQL

| Block | Work | Checkpoint |
|---|---|---|
| 1 | Diagnostic exam, no notes | Record every weak topic |
| 2 | Notes 01–03; draw keys and dependencies | 80% on 20 concept questions |
| 3 | Labs 01–03 | Complete joins without answer key |
| 4 | Notes 04–06 | Explain WHERE vs HAVING aloud |
| 5 | Labs 04–05 | 8/10 queries correct |
| 6 | Mistake notebook review | Re-answer all misses |

If a checkpoint fails, do one worked example, one similar example without notes, then a 10-question panic quiz. Do not reread passively.

## Day 2 — Objects, safety, and exam pressure

| Block | Work | Checkpoint |
|---|---|---|
| 1 | Notes 07–10 | Distinguish view/procedure/function/trigger |
| 2 | Labs 06–09 | Trigger audit row appears correctly |
| 3 | Notes 11–12 and security lab | 80% security/troubleshooting quiz |
| 4 | Certiport-style timed exam | At least 80% with time remaining |
| 5 | Repair weakest two topics | At least 85% in focused quizzes |
| 6 | Final Boss exam | Target 85%; minimum go/no-go 80% |

## Final strategy

Aim for **85%+ on two different timed exams**, not one lucky run. During the exam: answer direct questions first, mark long scenarios, watch `NULL`, join preservation, aggregate level, and missing `WHERE`. Use the final five minutes to inspect multi-select and unanswered items.
""",
    "study_plan/7_day_cram_plan.md": r"""
# 7-Day Cram Plan

Daily pattern: 45 minutes notes, 60 minutes lab, 25-question quiz, then mistake repair.

| Day | Topics | Lab | Pass checkpoint |
|---|---|---|---|
| 1 | Core concepts, keys, relationships | 01 | 80% concept quiz |
| 2 | ERD and normalization | 06 design tasks | Normalize one table to 3NF unaided |
| 3 | SELECT, filters, sorting | 01–02 | 18/20 SQL fundamentals |
| 4 | Joins and grouping | 03–04 | Explain every row multiplication |
| 5 | Subqueries, views, DDL, indexes | 05–06 | 80% mixed quiz |
| 6 | DML, transactions, procedures, triggers, security | 07–10 | 80% and zero unsafe UPDATE habits |
| 7 | Timed exam, repair, Final Boss | all weak labs | 85% on final simulation |

If you fail a checkpoint: isolate the weakest concept, study its note for 15 minutes, complete three fresh examples, then retake a focused 10-question quiz. Advance only at 80%.

Exam strategy: budget about one minute per question on the first pass. Mark scenario questions. For SQL, mentally execute `FROM → WHERE → GROUP → HAVING → SELECT → ORDER`.
""",
    "study_plan/14_day_mastery_plan.md": r"""
# 14-Day Mastery Plan

| Day | Topic and action | Lab/quiz target |
|---|---|---|
| 1 | Diagnostic; core vocabulary | Lab 01 + 75% |
| 2 | Keys, relationships, ERDs | Draw sample schema + 80% |
| 3 | 1NF and 2NF | Normalize repeating groups |
| 4 | 3NF and BCNF basics | Dependency drills + 80% |
| 5 | SELECT and expressions | Lab 01 |
| 6 | Filtering, NULL, ordering | Lab 02 + 85% |
| 7 | All joins | Lab 03 + explain unmatched rows |
| 8 | Aggregation and HAVING | Lab 04 + 85% |
| 9 | Subqueries, EXISTS, set operations | Lab 05 |
| 10 | DDL, constraints, indexes | Lab 06 |
| 11 | DML and transactions | Lab 07 |
| 12 | Procedures, functions, triggers | Labs 08–09 |
| 13 | Security, backup, troubleshooting | Lab 10 + 85% |
| 14 | Two timed exams and Final Boss | two scores ≥85% |

Every day: add misses to the notebook, state why your answer was tempting, and write the rule that defeats the trap. If below the checkpoint, repeat a focused quiz the same day; if still below, begin the next day with that topic before new material.

Final strategy: sleep normally, do a 15-minute cheatsheet scan, and avoid learning new material in the last hour.
""",
    "study_plan/topic_checklist.md": r"""
# Topic Mastery Checklist

Mark a topic mastered only when you can explain it and solve a fresh problem without notes.

- [ ] DBMS/RDBMS, schema/instance, data types, NULL
- [ ] Candidate, primary, foreign, composite, surrogate keys
- [ ] 1:1, 1:M, M:N and junction tables
- [ ] ERD cardinality and optionality
- [ ] 1NF, 2NF, 3NF, BCNF basics and anomalies
- [ ] SELECT, WHERE, ORDER BY, DISTINCT, LIMIT/TOP
- [ ] LIKE, IN, BETWEEN, NULL, Boolean precedence
- [ ] INNER/LEFT/RIGHT/FULL/CROSS/SELF joins
- [ ] COUNT/SUM/AVG/MIN/MAX, GROUP BY, HAVING
- [ ] Scalar/multi-row/correlated subqueries and EXISTS
- [ ] UNION/UNION ALL, CASE, CTEs, views
- [ ] CREATE/ALTER/DROP/TRUNCATE concepts
- [ ] Constraints and referential actions
- [ ] INSERT/UPDATE/DELETE and transaction safety
- [ ] Procedures, functions, triggers across DBMSs
- [ ] Index tradeoffs and EXPLAIN basics
- [ ] Users, roles, permissions, injection, least privilege
- [ ] Backups, restore testing, integrity
- [ ] Troubleshoot syntax, constraints, joins, grouping, NULL
- [ ] Two timed exam scores at or above 85%
""",
}


CHEATSHEETS = {
    "cheatsheets/sql_command_cheatsheet.md": r"""
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
""",
    "cheatsheets/joins_cheatsheet.md": r"""
# Joins Cheatsheet

- INNER: matches only.
- LEFT: all left + matching right.
- RIGHT: all right + matching left.
- FULL: all from both.
- CROSS: every combination.
- SELF: same table with two aliases.

Outer-join trap: a right-table filter in `WHERE` removes NULL-extended rows. Put match-specific filtering in `ON`.

Unexpected duplicates: inspect cardinality, missing/incomplete `ON`, and parallel one-to-many paths before considering `DISTINCT`.
""",
    "cheatsheets/normalization_cheatsheet.md": r"""
# Normalization Cheatsheet

- 1NF: atomic cells; no repeating groups.
- 2NF: 1NF + no non-key fact depends on part of a composite key.
- 3NF: 2NF + no non-key fact depends on another non-key fact.
- BCNF: every determinant is a superkey.

Method: identify key → list dependencies → split repeating groups → remove partial dependencies → remove transitive dependencies.
""",
    "cheatsheets/triggers_procedures_cheatsheet.md": r"""
# Procedures and Triggers Cheatsheet

Procedure: explicitly called, parameters, multiple statements/result sets.
Function: returns a value/table; often usable in expressions.
Trigger: automatic response to INSERT/UPDATE/DELETE.

SQLite: triggers yes, stored procedures no.
MySQL: row triggers with `OLD`/`NEW`.
SQL Server: statement triggers using multi-row `inserted`/`deleted`.

Prefer constraints for simple integrity. Keep triggers short, set-based where required, documented, and tested.
""",
    "cheatsheets/common_errors_cheatsheet.md": r"""
# Common Errors Cheatsheet

- `= NULL` → `IS NULL`
- Aggregate in `WHERE` → use `HAVING`
- Lost left rows → move right-table condition from `WHERE` to `ON`
- Duplicate key → inspect PK/UNIQUE value
- FK failure → verify parent exists / children before parent delete
- Too many joined rows → inspect one-to-many relationships and `ON`
- Unsafe change → preview `WHERE` with `SELECT`, then transact
- `NOT IN` with NULL → use `NOT EXISTS`
- Injection risk → parameterize values
""",
}


SETUP_SQL = r"""
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS alumni;
DROP TABLE IF EXISTS job_fair_registrations;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS departments;

CREATE TABLE departments (
    department_id INTEGER PRIMARY KEY,
    department_name TEXT NOT NULL UNIQUE,
    office TEXT
);

CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    student_number TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    birth_date TEXT,
    department_id INTEGER,
    year_level INTEGER CHECK (year_level BETWEEN 1 AND 5),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'graduated', 'inactive')),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY,
    course_code TEXT NOT NULL UNIQUE,
    course_title TEXT NOT NULL,
    department_id INTEGER NOT NULL,
    units INTEGER NOT NULL CHECK (units BETWEEN 1 AND 6),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

CREATE TABLE enrollments (
    enrollment_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    school_year TEXT NOT NULL,
    semester INTEGER NOT NULL CHECK (semester IN (1, 2, 3)),
    grade REAL CHECK (grade BETWEEN 0 AND 100),
    enrolled_on TEXT NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE (student_id, course_id, school_year, semester),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);

CREATE TABLE companies (
    company_id INTEGER PRIMARY KEY,
    company_name TEXT NOT NULL UNIQUE,
    industry TEXT NOT NULL,
    slots INTEGER NOT NULL DEFAULT 0 CHECK (slots >= 0)
);

CREATE TABLE job_fair_registrations (
    registration_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    registered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    interview_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (interview_status IN ('pending', 'scheduled', 'completed', 'declined')),
    UNIQUE (student_id, company_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

CREATE TABLE alumni (
    alumni_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL UNIQUE,
    graduation_year INTEGER NOT NULL CHECK (graduation_year >= 2000),
    employer TEXT,
    job_title TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

CREATE TABLE payments (
    payment_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    payment_type TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    paid_on TEXT NOT NULL DEFAULT CURRENT_DATE,
    reference_number TEXT NOT NULL UNIQUE,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

CREATE TABLE audit_logs (
    audit_id INTEGER PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_department ON students(department_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_registrations_company ON job_fair_registrations(company_id);

INSERT INTO departments VALUES
 (1, 'Information Technology', 'Tech 201'),
 (2, 'Business Administration', 'Biz 105'),
 (3, 'Multimedia Arts', 'Arts 303'),
 (4, 'Hospitality Management', 'HM 110');

INSERT INTO students VALUES
 (1, '2024-0001', 'Maya Santos', 'maya@example.com', '2005-03-14', 1, 2, 'active'),
 (2, '2024-0002', 'Luis Cruz', 'luis@example.com', '2004-11-02', 1, 3, 'active'),
 (3, '2024-0003', 'Ana Reyes', 'ana@example.com', '2003-07-19', 2, 4, 'active'),
 (4, '2023-0011', 'Noel Garcia', NULL, '2002-01-08', 3, 4, 'graduated'),
 (5, '2025-0005', 'Bea Lim', 'bea@example.com', '2006-09-21', 1, 1, 'active'),
 (6, '2024-0017', 'Carlo Mendoza', 'carlo@example.com', '2004-05-30', 2, 3, 'inactive'),
 (7, '2025-0022', 'Iris Dela Cruz', NULL, '2006-12-12', 4, 1, 'active'),
 (8, '2023-0030', 'Paolo Tan', 'paolo@example.com', '2002-04-16', 1, 4, 'graduated'),
 (9, '2025-0040', 'Sam Flores', 'sam@example.com', '2007-02-10', NULL, 1, 'active');

INSERT INTO courses VALUES
 (1, 'DB101', 'Database Fundamentals', 1, 3),
 (2, 'WEB201', 'Web Development', 1, 3),
 (3, 'NET110', 'Networking Basics', 1, 3),
 (4, 'MKT101', 'Principles of Marketing', 2, 3),
 (5, 'ART205', 'Digital Illustration', 3, 3),
 (6, 'HOS100', 'Hospitality Operations', 4, 3),
 (7, 'DB301', 'Database Administration', 1, 3);

INSERT INTO enrollments(enrollment_id, student_id, course_id, school_year, semester, grade, enrolled_on) VALUES
 (1, 1, 1, '2025-2026', 1, 92, '2025-08-10'),
 (2, 1, 2, '2025-2026', 1, 88, '2025-08-10'),
 (3, 2, 1, '2025-2026', 1, 81, '2025-08-11'),
 (4, 2, 3, '2025-2026', 1, 79, '2025-08-11'),
 (5, 3, 4, '2025-2026', 1, 95, '2025-08-09'),
 (6, 4, 5, '2024-2025', 2, 90, '2025-01-12'),
 (7, 5, 1, '2025-2026', 1, NULL, '2025-08-12'),
 (8, 6, 4, '2025-2026', 1, 72, '2025-08-12'),
 (9, 8, 1, '2024-2025', 2, 87, '2025-01-10'),
 (10, 8, 7, '2024-2025', 2, 91, '2025-01-10'),
 (11, 7, 6, '2025-2026', 1, 84, '2025-08-13');

INSERT INTO companies VALUES
 (1, 'ByteWorks', 'Software', 5),
 (2, 'Northstar Bank', 'Finance', 3),
 (3, 'PixelForge Studio', 'Creative', 2),
 (4, 'Harbor Hotels', 'Hospitality', 4),
 (5, 'CloudNine Data', 'Analytics', 0);

INSERT INTO job_fair_registrations VALUES
 (1, 1, 1, '2026-02-01 09:00:00', 'completed'),
 (2, 1, 5, '2026-02-01 09:05:00', 'pending'),
 (3, 2, 1, '2026-02-02 10:00:00', 'scheduled'),
 (4, 3, 2, '2026-02-02 11:00:00', 'completed'),
 (5, 4, 3, '2026-02-03 13:00:00', 'declined'),
 (6, 7, 4, '2026-02-04 14:00:00', 'scheduled'),
 (7, 8, 5, '2026-02-04 15:00:00', 'completed');

INSERT INTO alumni VALUES
 (1, 4, 2025, 'PixelForge Studio', 'Junior Designer'),
 (2, 8, 2025, 'CloudNine Data', 'Data Support Associate');

INSERT INTO payments VALUES
 (1, 1, 'tuition', 15000, '2026-01-10', 'PAY-1001'),
 (2, 2, 'tuition', 12000, '2026-01-11', 'PAY-1002'),
 (3, 3, 'job fair', 500, '2026-01-15', 'PAY-1003'),
 (4, 1, 'job fair', 500, '2026-01-15', 'PAY-1004'),
 (5, 5, 'tuition', 8000, '2026-01-20', 'PAY-1005'),
 (6, 7, 'tuition', 10000, '2026-01-22', 'PAY-1006'),
 (7, 8, 'alumni card', 300, '2026-02-01', 'PAY-1007');
"""


LABS = {
    "labs/setup_sample_database.sql": SETUP_SQL,
    "labs/lab_01_select_basics.sql": r"""
-- LAB 01: SELECT BASICS
-- Objective: retrieve columns, aliases, distinct values, and limited sorted results.
-- Setup: run setup_sample_database.sql first.

-- Starter
SELECT student_id, full_name FROM students;

-- Tasks
-- 1. Show student number, name, and status for every student.
-- 2. List distinct student statuses.
-- 3. Show the three highest year levels, then names A-Z within a year.
-- 4. Display each payment with a calculated 5% processing amount.
-- 5. Challenge: return a friendly email value using COALESCE.

-- Answer key / expected shape
SELECT student_number, full_name, status FROM students;
SELECT DISTINCT status FROM students ORDER BY status;
SELECT full_name, year_level FROM students
ORDER BY year_level DESC, full_name ASC LIMIT 3;
SELECT reference_number, amount, amount * 0.05 AS processing_amount FROM payments;
SELECT full_name, COALESCE(email, 'No email') AS email_display FROM students;

-- Common mistakes: assuming row order without ORDER BY; using = NULL; forgetting aliases.
""",
    "labs/lab_02_filtering_sorting.sql": r"""
-- LAB 02: FILTERING AND SORTING
-- Objective: combine predicates safely and reason about NULL.

-- Tasks
-- 1. Active IT or Business students in year 2 or above.
-- 2. Students whose names contain "a" (case behavior can depend on collation).
-- 3. Payments from 500 through 10000 inclusive.
-- 4. Students with no email.
-- 5. Challenge: active students from IT OR all graduated students; use parentheses.

-- Answer key
SELECT * FROM students
WHERE status = 'active' AND department_id IN (1, 2) AND year_level >= 2
ORDER BY full_name;
SELECT * FROM students WHERE full_name LIKE '%a%';
SELECT * FROM payments WHERE amount BETWEEN 500 AND 10000 ORDER BY amount DESC;
SELECT * FROM students WHERE email IS NULL;
SELECT * FROM students
WHERE (status = 'active' AND department_id = 1) OR status = 'graduated';

-- Expected: BETWEEN includes both endpoints; IS NULL finds Noel and Iris.
-- Common mistakes: = NULL; missing parentheses; quoting a column name as a value.
""",
    "labs/lab_03_joins.sql": r"""
-- LAB 03: JOINS
-- Objective: choose joins from required rows and detect row multiplication.

-- Tasks
-- 1. Student names with course codes and grades.
-- 2. Every student and any company registration, including students with none.
-- 3. Courses with no enrollments.
-- 4. Company and number of registrations, including zero.
-- 5. Challenge: students registered with companies outside their department's obvious field.

-- Answer key
SELECT s.full_name, c.course_code, e.grade
FROM students s
JOIN enrollments e ON e.student_id = s.student_id
JOIN courses c ON c.course_id = e.course_id
ORDER BY s.full_name, c.course_code;

SELECT s.full_name, co.company_name, j.interview_status
FROM students s
LEFT JOIN job_fair_registrations j ON j.student_id = s.student_id
LEFT JOIN companies co ON co.company_id = j.company_id
ORDER BY s.full_name;

SELECT c.course_code
FROM courses c
LEFT JOIN enrollments e ON e.course_id = c.course_id
WHERE e.enrollment_id IS NULL;

SELECT co.company_name, COUNT(j.registration_id) AS registrations
FROM companies co
LEFT JOIN job_fair_registrations j ON j.company_id = co.company_id
GROUP BY co.company_id, co.company_name;

SELECT s.full_name, d.department_name, co.company_name, co.industry
FROM students s
JOIN departments d ON d.department_id = s.department_id
JOIN job_fair_registrations j ON j.student_id = s.student_id
JOIN companies co ON co.company_id = j.company_id
WHERE (d.department_name = 'Information Technology' AND co.industry <> 'Software')
   OR (d.department_name = 'Hospitality Management' AND co.industry <> 'Hospitality');

-- Common mistakes: missing ON, filtering the right side in WHERE, hiding bad joins with DISTINCT.
""",
    "labs/lab_04_grouping.sql": r"""
-- LAB 04: GROUPING AND AGGREGATION
-- Objective: group at the correct level and distinguish WHERE from HAVING.

-- Tasks
-- 1. Enrollment count and average recorded grade per course.
-- 2. Departments with at least two students.
-- 3. Total payments per student, including students with no payment.
-- 4. Count active and graduated students in one row.
-- 5. Challenge: companies whose registrations exceed available slots.

-- Answer key
SELECT c.course_code, COUNT(e.enrollment_id) AS enrollments, AVG(e.grade) AS avg_grade
FROM courses c LEFT JOIN enrollments e ON e.course_id = c.course_id
GROUP BY c.course_id, c.course_code;

SELECT d.department_name, COUNT(s.student_id) AS student_count
FROM departments d JOIN students s ON s.department_id = d.department_id
GROUP BY d.department_id, d.department_name
HAVING COUNT(s.student_id) >= 2;

SELECT s.full_name, COALESCE(SUM(p.amount), 0) AS total_paid
FROM students s LEFT JOIN payments p ON p.student_id = s.student_id
GROUP BY s.student_id, s.full_name;

SELECT COUNT(*) AS total,
       SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count,
       SUM(CASE WHEN status = 'graduated' THEN 1 ELSE 0 END) AS graduate_count
FROM students;

SELECT c.company_name, c.slots, COUNT(j.registration_id) AS registrations
FROM companies c LEFT JOIN job_fair_registrations j ON j.company_id = c.company_id
GROUP BY c.company_id, c.company_name, c.slots
HAVING COUNT(j.registration_id) > c.slots;

-- Common mistakes: COUNT(*) on a left join; aggregate in WHERE; selecting random non-grouped columns.
""",
    "labs/lab_05_subqueries.sql": r"""
-- LAB 05: SUBQUERIES, EXISTS, UNION, CASE, AND VIEWS
-- Objective: choose the clearest advanced-query tool.

-- Tasks and answer key
-- 1. Students with a grade above the overall recorded average.
SELECT DISTINCT s.full_name
FROM students s JOIN enrollments e ON e.student_id = s.student_id
WHERE e.grade > (SELECT AVG(grade) FROM enrollments);

-- 2. Students with no job-fair registration.
SELECT s.full_name
FROM students s
WHERE NOT EXISTS (
  SELECT 1 FROM job_fair_registrations j WHERE j.student_id = s.student_id
);

-- 3. One contact list from students and companies.
SELECT full_name AS contact, email AS detail, 'student' AS kind FROM students
UNION ALL
SELECT company_name, industry, 'company' FROM companies;

-- 4. Grade bands.
SELECT student_id, grade,
 CASE WHEN grade IS NULL THEN 'Pending'
      WHEN grade >= 90 THEN 'Excellent'
      WHEN grade >= 75 THEN 'Passing'
      ELSE 'Needs work' END AS grade_band
FROM enrollments;

-- 5. Challenge: create a reusable view.
DROP VIEW IF EXISTS student_balances;
CREATE VIEW student_balances AS
SELECT s.student_id, s.full_name, COALESCE(SUM(p.amount), 0) AS total_paid
FROM students s LEFT JOIN payments p ON p.student_id = s.student_id
GROUP BY s.student_id, s.full_name;
SELECT * FROM student_balances ORDER BY total_paid DESC;

-- Common mistakes: = with multi-row subquery; NOT IN with nullable results; UNION column mismatch.
""",
    "labs/lab_06_ddl_constraints.sql": r"""
-- LAB 06: DDL, CONSTRAINTS, AND INDEXES
-- Objective: encode business rules in schema objects.

DROP TABLE IF EXISTS mentors;
CREATE TABLE mentors (
  mentor_id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  hourly_rate NUMERIC NOT NULL CHECK (hourly_rate > 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

-- Tasks
-- 1. Insert two valid mentors.
-- 2. Predict and test failures for duplicate email, NULL name, and negative rate.
-- 3. Add an index on full_name and inspect the query plan.
-- 4. Challenge: design mentor_assignments as a junction table with a unique pair.

INSERT INTO mentors(email, full_name, hourly_rate) VALUES
 ('mentor1@example.com', 'Rina Aquino', 450),
 ('mentor2@example.com', 'Jose Valdez', 500);
CREATE INDEX idx_mentors_name ON mentors(full_name);
EXPLAIN QUERY PLAN SELECT * FROM mentors WHERE full_name = 'Rina Aquino';

DROP TABLE IF EXISTS mentor_assignments;
CREATE TABLE mentor_assignments (
  mentor_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  assigned_on TEXT NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (mentor_id, student_id),
  FOREIGN KEY (mentor_id) REFERENCES mentors(mentor_id),
  FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- Common mistakes: trusting app validation only; adding needless indexes; forgetting FK parent types.
""",
    "labs/lab_07_dml_transactions.sql": r"""
-- LAB 07: DML AND TRANSACTIONS
-- Objective: make reversible, targeted changes.

-- Run each scenario separately.
BEGIN;
INSERT INTO payments(student_id, payment_type, amount, reference_number)
VALUES (2, 'certification fee', 1200, 'PAY-LAB-01');

UPDATE students SET status = 'active' WHERE student_id = 6;
SELECT * FROM payments WHERE reference_number = 'PAY-LAB-01';
SELECT student_id, status FROM students WHERE student_id = 6;
ROLLBACK;

-- Verify rollback: both changes are gone.
SELECT * FROM payments WHERE reference_number = 'PAY-LAB-01';
SELECT student_id, status FROM students WHERE student_id = 6;

-- Tasks
-- 1. Preview students in department 1, then update only inactive ones.
-- 2. Use a savepoint before a second payment insert and roll back only that insert.
-- 3. Trigger a CHECK failure with a negative payment.
-- 4. Challenge: delete a student with children and explain the FK failure.

-- Common mistakes: omitting WHERE; committing before verification; assuming rollback after commit.
""",
    "labs/lab_08_triggers_audit_log.sql": r"""
-- LAB 08: SQLITE TRIGGER AUDIT LOG
-- Objective: automatically audit payment amount changes.

DROP TRIGGER IF EXISTS payments_after_amount_update;
CREATE TRIGGER payments_after_amount_update
AFTER UPDATE OF amount ON payments
FOR EACH ROW
WHEN OLD.amount <> NEW.amount
BEGIN
  INSERT INTO audit_logs(table_name, record_id, action, old_value, new_value)
  VALUES ('payments', OLD.payment_id, 'UPDATE_AMOUNT',
          CAST(OLD.amount AS TEXT), CAST(NEW.amount AS TEXT));
END;

UPDATE payments SET amount = amount + 250 WHERE payment_id = 1;
SELECT * FROM audit_logs ORDER BY audit_id DESC LIMIT 1;

-- Expected: one audit row for payment 1 with old and new amount.
-- Tasks: update a non-amount column; confirm no audit row. Update two payments; count rows.
-- Challenge: add an AFTER DELETE trigger using OLD values.
-- Common mistakes: swapping OLD/NEW; trigger recursion; forgetting multi-row behavior differs by DBMS.
""",
    "labs/lab_09_stored_procedure_examples_mysql.sql": r"""
-- LAB 09: MYSQL PROCEDURE AND TRIGGER EXAMPLES
-- Do not run this file in SQLite.

DELIMITER //
CREATE PROCEDURE RegisterForJobFair(
  IN p_student_id INT,
  IN p_company_id INT
)
BEGIN
  INSERT INTO job_fair_registrations(student_id, company_id)
  VALUES (p_student_id, p_company_id);
END//

CREATE TRIGGER payments_after_update
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
  IF OLD.amount <> NEW.amount THEN
    INSERT INTO audit_logs(table_name, record_id, action, old_value, new_value)
    VALUES ('payments', OLD.payment_id, 'UPDATE_AMOUNT',
            CAST(OLD.amount AS CHAR), CAST(NEW.amount AS CHAR));
  END IF;
END//
DELIMITER ;

CALL RegisterForJobFair(5, 2);

-- SQL Server / T-SQL equivalent procedure:
-- CREATE PROCEDURE dbo.RegisterForJobFair @StudentId INT, @CompanyId INT AS
-- BEGIN
--   SET NOCOUNT ON;
--   INSERT dbo.job_fair_registrations(student_id, company_id)
--   VALUES (@StudentId, @CompanyId);
-- END;
-- EXEC dbo.RegisterForJobFair @StudentId = 5, @CompanyId = 2;

-- SQL Server trigger principle: join the multi-row inserted/deleted tables.
-- INSERT dbo.audit_logs(...)
-- SELECT 'payments', i.payment_id, 'UPDATE_AMOUNT',
--        CONVERT(varchar(50), d.amount), CONVERT(varchar(50), i.amount)
-- FROM inserted i JOIN deleted d ON d.payment_id = i.payment_id
-- WHERE i.amount <> d.amount;

-- Tasks: identify parameters; explain automatic vs explicit execution; explain multi-row risk.
""",
    "labs/lab_10_security_permissions_concepts.md": r"""
# Lab 10 — Security and Permissions

## Objective

Choose least-privilege access and replace injectable code with parameterized access.

## Scenario

The reporting application only reads student names, departments, and enrollment counts. It currently connects as a database administrator.

## Tasks

1. Define the minimum operations required.
2. Explain why a reporting role is safer than a personal administrator account.
3. Repair: `sql = "SELECT * FROM students WHERE email = '" + email + "'"`.
4. Decide whether the app should read birth dates and payment details.
5. Design a backup verification checklist.

## Answer key

- Grant `SELECT` only on a restricted view containing required columns; no DDL or writes.
- Use a dedicated service identity assigned to a reporting role.
- SQLite/Python: `cursor.execute("SELECT * FROM students WHERE email = ?", (email,))`.
- Exclude unrelated personal/financial data.
- Encrypt backups, restrict access, record retention, restore into an isolated environment, validate row/object counts, and document RPO/RTO results.

## Common mistakes

Escaping strings by hand, granting broad rights "temporarily," treating a hidden UI field as access control, and never testing restore.

## Challenge

Explain why a stored procedure can reduce exposed operations but does not make unsafe dynamic SQL inside it secure.
""",
}


def build_sample_database() -> None:
    db_path = ROOT / "data" / "sample_school_database.db"
    db_path.parent.mkdir(parents=True, exist_ok=True)
    if db_path.exists():
        db_path.unlink()
    connection = sqlite3.connect(db_path)
    try:
        connection.executescript(SETUP_SQL)
        connection.commit()
    finally:
        connection.close()


def main() -> None:
    for collection in (NOTES, PLANS, CHEATSHEETS, LABS):
        for relative_path, content in collection.items():
            write(relative_path, content)
    build_sample_database()
    print(
        f"Generated {len(NOTES)} notes, {len(PLANS)} plans, "
        f"{len(CHEATSHEETS)} cheatsheets, {len(LABS)} labs, and the sample DB."
    )


if __name__ == "__main__":
    main()
