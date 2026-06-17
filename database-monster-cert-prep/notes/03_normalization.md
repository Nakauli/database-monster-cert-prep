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
