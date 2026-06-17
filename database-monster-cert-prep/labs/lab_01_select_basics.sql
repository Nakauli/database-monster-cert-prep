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
