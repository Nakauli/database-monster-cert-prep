export const SEED_SQL = `
CREATE TABLE departments (
  department_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

INSERT INTO departments (department_id, name) VALUES
  (1, 'Information Technology'),
  (2, 'Business'),
  (3, 'Engineering');

CREATE TABLE students (
  student_id     INTEGER PRIMARY KEY,
  student_number TEXT NOT NULL,
  full_name      TEXT NOT NULL,
  email          TEXT,
  department_id  INTEGER,
  year_level     INTEGER,
  status         TEXT NOT NULL
);

INSERT INTO students (student_id, student_number, full_name, email, department_id, year_level, status) VALUES
  (1, '2021-00481', 'Maricel Bautista', 'mbautista@uni.edu', 1, 4, 'active'),
  (2, '2022-01193', 'Joaquin Villanueva', 'jvillanueva@uni.edu', 1, 3, 'active'),
  (3, '2023-00027', 'Daniela Concepcion', NULL, 1, 2, 'active'),
  (4, '2020-00874', 'Reuben Salcedo', 'rsalcedo@uni.edu', 2, 4, 'inactive'),
  (5, '2022-00650', 'Annika Pangilinan', 'apangilinan@uni.edu', 2, 3, 'active'),
  (6, '2023-01420', 'Teodoro Mabini', NULL, 3, 1, 'active'),
  (7, '2021-00309', 'Soledad Alcaraz', 'salcaraz@uni.edu', 3, 4, 'active'),
  (8, '2024-00118', 'Lorenzo Datu', 'ldatu@uni.edu', 1, 1, 'active'),
  (9, '2019-00733', 'Crisanta Yulo', 'cyulo@uni.edu', 2, 4, 'graduated'),
  (10, '2023-00992', 'Emil Trinidad', 'etrinidad@uni.edu', 3, 2, 'active');

CREATE TABLE courses (
  course_id     INTEGER PRIMARY KEY,
  course_code   TEXT NOT NULL,
  title         TEXT NOT NULL,
  department_id INTEGER
);

INSERT INTO courses (course_id, course_code, title, department_id) VALUES
  (1, 'CS231', 'Database Systems', 1),
  (2, 'CS118', 'Intro to Programming', 1),
  (3, 'BUS204', 'Operations Management', 2),
  (4, 'ENG150', 'Statics', 3),
  (5, 'CS340', 'Distributed Systems', 1),
  (6, 'CS499', 'Capstone', 1);

CREATE TABLE enrollments (
  enrollment_id INTEGER PRIMARY KEY,
  student_id    INTEGER,
  course_id     INTEGER,
  grade         NUMERIC
);

INSERT INTO enrollments (enrollment_id, student_id, course_id, grade) VALUES
  (1, 1, 1, 92),
  (2, 1, 2, 88),
  (3, 2, 1, 79),
  (4, 2, 5, 84),
  (5, 3, 2, 95),
  (6, 5, 3, 81),
  (7, 7, 4, 90),
  (8, 7, 1, 73),
  (9, 9, 3, NULL),
  (10, 10, 4, 67),
  (11, 1, 5, 91);

CREATE TABLE payments (
  payment_id       INTEGER PRIMARY KEY,
  student_id       INTEGER,
  payment_type     TEXT NOT NULL,
  amount           NUMERIC NOT NULL,
  reference_number TEXT
);

INSERT INTO payments (payment_id, student_id, payment_type, amount, reference_number) VALUES
  (1, 1, 'tuition', 18500, 'RF-100482'),
  (2, 2, 'tuition', 18500, 'RF-100517'),
  (3, 5, 'laboratory', 2400, 'RF-100539'),
  (4, 7, 'tuition', 18500, 'RF-100560'),
  (5, 10, 'miscellaneous', 1750, 'RF-100588');

CREATE TABLE audit_logs (
  audit_id   INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id  INTEGER,
  old_value  TEXT,
  new_value  TEXT
);
`;

export interface DatasetTable {
  name: string;
  columns: { name: string; type: string; note?: string }[];
}

export const DATASET_TABLES: DatasetTable[] = [
  {
    name: "students",
    columns: [
      { name: "student_id", type: "INTEGER", note: "PK" },
      { name: "student_number", type: "TEXT" },
      { name: "full_name", type: "TEXT" },
      { name: "email", type: "TEXT", note: "nullable" },
      { name: "department_id", type: "INTEGER", note: "FK" },
      { name: "year_level", type: "INTEGER" },
      { name: "status", type: "TEXT" },
    ],
  },
  {
    name: "departments",
    columns: [
      { name: "department_id", type: "INTEGER", note: "PK" },
      { name: "name", type: "TEXT" },
    ],
  },
  {
    name: "courses",
    columns: [
      { name: "course_id", type: "INTEGER", note: "PK" },
      { name: "course_code", type: "TEXT" },
      { name: "title", type: "TEXT" },
      { name: "department_id", type: "INTEGER", note: "FK" },
    ],
  },
  {
    name: "enrollments",
    columns: [
      { name: "enrollment_id", type: "INTEGER", note: "PK" },
      { name: "student_id", type: "INTEGER", note: "FK" },
      { name: "course_id", type: "INTEGER", note: "FK" },
      { name: "grade", type: "NUMERIC", note: "nullable" },
    ],
  },
  {
    name: "payments",
    columns: [
      { name: "payment_id", type: "INTEGER", note: "PK" },
      { name: "student_id", type: "INTEGER", note: "FK" },
      { name: "payment_type", type: "TEXT" },
      { name: "amount", type: "NUMERIC" },
      { name: "reference_number", type: "TEXT" },
    ],
  },
  {
    name: "audit_logs",
    columns: [
      { name: "audit_id", type: "INTEGER", note: "PK" },
      { name: "table_name", type: "TEXT" },
      { name: "record_id", type: "INTEGER" },
      { name: "old_value", type: "TEXT" },
      { name: "new_value", type: "TEXT" },
    ],
  },
];
