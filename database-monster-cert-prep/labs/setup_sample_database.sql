PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS alumni;
DROP TABLE IF EXISTS job_fair_registrations;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS departments;

CREATE TABLE departments (
    department_id INTEGER PRIMARY KEY,
    department_name TEXT NOT NULL UNIQUE,
    office TEXT
);

CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    student_number TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    birth_date TEXT,
    department_id INTEGER,
    year_level INTEGER CHECK (year_level BETWEEN 1 AND 5),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'graduated', 'inactive')),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY,
    course_code TEXT NOT NULL UNIQUE,
    course_title TEXT NOT NULL,
    department_id INTEGER NOT NULL,
    units INTEGER NOT NULL CHECK (units BETWEEN 1 AND 6),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

CREATE TABLE enrollments (
    enrollment_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    school_year TEXT NOT NULL,
    semester INTEGER NOT NULL CHECK (semester IN (1, 2, 3)),
    grade REAL CHECK (grade BETWEEN 0 AND 100),
    enrolled_on TEXT NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE (student_id, course_id, school_year, semester),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);

CREATE TABLE companies (
    company_id INTEGER PRIMARY KEY,
    company_name TEXT NOT NULL UNIQUE,
    industry TEXT NOT NULL,
    slots INTEGER NOT NULL DEFAULT 0 CHECK (slots >= 0)
);

CREATE TABLE job_fair_registrations (
    registration_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    registered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    interview_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (interview_status IN ('pending', 'scheduled', 'completed', 'declined')),
    UNIQUE (student_id, company_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

CREATE TABLE alumni (
    alumni_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL UNIQUE,
    graduation_year INTEGER NOT NULL CHECK (graduation_year >= 2000),
    employer TEXT,
    job_title TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

CREATE TABLE payments (
    payment_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    payment_type TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    paid_on TEXT NOT NULL DEFAULT CURRENT_DATE,
    reference_number TEXT NOT NULL UNIQUE,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

CREATE TABLE audit_logs (
    audit_id INTEGER PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_department ON students(department_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_registrations_company ON job_fair_registrations(company_id);

INSERT INTO departments VALUES
 (1, 'Information Technology', 'Tech 201'),
 (2, 'Business Administration', 'Biz 105'),
 (3, 'Multimedia Arts', 'Arts 303'),
 (4, 'Hospitality Management', 'HM 110');

INSERT INTO students VALUES
 (1, '2024-0001', 'Maya Santos', 'maya@example.com', '2005-03-14', 1, 2, 'active'),
 (2, '2024-0002', 'Luis Cruz', 'luis@example.com', '2004-11-02', 1, 3, 'active'),
 (3, '2024-0003', 'Ana Reyes', 'ana@example.com', '2003-07-19', 2, 4, 'active'),
 (4, '2023-0011', 'Noel Garcia', NULL, '2002-01-08', 3, 4, 'graduated'),
 (5, '2025-0005', 'Bea Lim', 'bea@example.com', '2006-09-21', 1, 1, 'active'),
 (6, '2024-0017', 'Carlo Mendoza', 'carlo@example.com', '2004-05-30', 2, 3, 'inactive'),
 (7, '2025-0022', 'Iris Dela Cruz', NULL, '2006-12-12', 4, 1, 'active'),
 (8, '2023-0030', 'Paolo Tan', 'paolo@example.com', '2002-04-16', 1, 4, 'graduated'),
 (9, '2025-0040', 'Sam Flores', 'sam@example.com', '2007-02-10', NULL, 1, 'active');

INSERT INTO courses VALUES
 (1, 'DB101', 'Database Fundamentals', 1, 3),
 (2, 'WEB201', 'Web Development', 1, 3),
 (3, 'NET110', 'Networking Basics', 1, 3),
 (4, 'MKT101', 'Principles of Marketing', 2, 3),
 (5, 'ART205', 'Digital Illustration', 3, 3),
 (6, 'HOS100', 'Hospitality Operations', 4, 3),
 (7, 'DB301', 'Database Administration', 1, 3);

INSERT INTO enrollments(enrollment_id, student_id, course_id, school_year, semester, grade, enrolled_on) VALUES
 (1, 1, 1, '2025-2026', 1, 92, '2025-08-10'),
 (2, 1, 2, '2025-2026', 1, 88, '2025-08-10'),
 (3, 2, 1, '2025-2026', 1, 81, '2025-08-11'),
 (4, 2, 3, '2025-2026', 1, 79, '2025-08-11'),
 (5, 3, 4, '2025-2026', 1, 95, '2025-08-09'),
 (6, 4, 5, '2024-2025', 2, 90, '2025-01-12'),
 (7, 5, 1, '2025-2026', 1, NULL, '2025-08-12'),
 (8, 6, 4, '2025-2026', 1, 72, '2025-08-12'),
 (9, 8, 1, '2024-2025', 2, 87, '2025-01-10'),
 (10, 8, 7, '2024-2025', 2, 91, '2025-01-10'),
 (11, 7, 6, '2025-2026', 1, 84, '2025-08-13');

INSERT INTO companies VALUES
 (1, 'ByteWorks', 'Software', 5),
 (2, 'Northstar Bank', 'Finance', 3),
 (3, 'PixelForge Studio', 'Creative', 2),
 (4, 'Harbor Hotels', 'Hospitality', 4),
 (5, 'CloudNine Data', 'Analytics', 0);

INSERT INTO job_fair_registrations VALUES
 (1, 1, 1, '2026-02-01 09:00:00', 'completed'),
 (2, 1, 5, '2026-02-01 09:05:00', 'pending'),
 (3, 2, 1, '2026-02-02 10:00:00', 'scheduled'),
 (4, 3, 2, '2026-02-02 11:00:00', 'completed'),
 (5, 4, 3, '2026-02-03 13:00:00', 'declined'),
 (6, 7, 4, '2026-02-04 14:00:00', 'scheduled'),
 (7, 8, 5, '2026-02-04 15:00:00', 'completed');

INSERT INTO alumni VALUES
 (1, 4, 2025, 'PixelForge Studio', 'Junior Designer'),
 (2, 8, 2025, 'CloudNine Data', 'Data Support Associate');

INSERT INTO payments VALUES
 (1, 1, 'tuition', 15000, '2026-01-10', 'PAY-1001'),
 (2, 2, 'tuition', 12000, '2026-01-11', 'PAY-1002'),
 (3, 3, 'job fair', 500, '2026-01-15', 'PAY-1003'),
 (4, 1, 'job fair', 500, '2026-01-15', 'PAY-1004'),
 (5, 5, 'tuition', 8000, '2026-01-20', 'PAY-1005'),
 (6, 7, 'tuition', 10000, '2026-01-22', 'PAY-1006'),
 (7, 8, 'alumni card', 300, '2026-02-01', 'PAY-1007');
