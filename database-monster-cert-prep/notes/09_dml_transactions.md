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
