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
