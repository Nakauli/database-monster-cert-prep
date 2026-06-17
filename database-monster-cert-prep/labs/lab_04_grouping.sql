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
