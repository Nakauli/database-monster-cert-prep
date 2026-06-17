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
