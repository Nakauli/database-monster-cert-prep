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
