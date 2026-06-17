-- LAB 06: DDL, CONSTRAINTS, AND INDEXES
-- Objective: encode business rules in schema objects.

DROP TABLE IF EXISTS mentors;
CREATE TABLE mentors (
  mentor_id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  hourly_rate NUMERIC NOT NULL CHECK (hourly_rate > 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

-- Tasks
-- 1. Insert two valid mentors.
-- 2. Predict and test failures for duplicate email, NULL name, and negative rate.
-- 3. Add an index on full_name and inspect the query plan.
-- 4. Challenge: design mentor_assignments as a junction table with a unique pair.

INSERT INTO mentors(email, full_name, hourly_rate) VALUES
 ('mentor1@example.com', 'Rina Aquino', 450),
 ('mentor2@example.com', 'Jose Valdez', 500);
CREATE INDEX idx_mentors_name ON mentors(full_name);
EXPLAIN QUERY PLAN SELECT * FROM mentors WHERE full_name = 'Rina Aquino';

DROP TABLE IF EXISTS mentor_assignments;
CREATE TABLE mentor_assignments (
  mentor_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  assigned_on TEXT NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (mentor_id, student_id),
  FOREIGN KEY (mentor_id) REFERENCES mentors(mentor_id),
  FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- Common mistakes: trusting app validation only; adding needless indexes; forgetting FK parent types.
