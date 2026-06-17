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
