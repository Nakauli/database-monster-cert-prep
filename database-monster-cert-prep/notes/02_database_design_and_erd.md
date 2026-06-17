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
