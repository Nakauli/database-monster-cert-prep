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
