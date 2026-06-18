import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(here, "../../data/question_bank.json");
const targetPath = resolve(here, "../src/data/questions.json");

const topicNames = {
  "Core Concepts": "Database Concepts",
  "Database Design and ERD": "ERD & Design",
  Normalization: "Normalization",
  "SQL Fundamentals": "SQL",
  "Joins and Relationships": "Joins",
  "Aggregation and Grouping": "Aggregation",
  "Subqueries, Views, and Set Operations": "Advanced Queries",
  "DDL, Constraints, and Indexes": "Constraints & Indexes",
  "DML and Transactions": "Transactions",
  "Procedures, Functions, and Triggers": "Triggers & Procedures",
  "Security, Administration, and Backup": "Security & Admin",
  Troubleshooting: "Troubleshooting",
};

const typeNames = {
  multiple_choice: "single-choice",
  scenario: "single-choice",
  true_false: "single-choice",
  sql_output: "single-choice",
  multi_select: "multiple-answer",
};

const schemas = {
  "Database Concepts": [
    {
      table: "students",
      columns: [
        { name: "student_id", type: "INTEGER", key: "PRIMARY KEY" },
        { name: "student_number", type: "TEXT", key: "UNIQUE" },
        { name: "full_name", type: "TEXT", nullable: false },
        { name: "department_id", type: "INTEGER", key: "FOREIGN KEY" },
      ],
    },
  ],
  "ERD & Design": [
    {
      table: "enrollments",
      columns: [
        { name: "student_id", type: "INTEGER", key: "FOREIGN KEY" },
        { name: "course_id", type: "INTEGER", key: "FOREIGN KEY" },
        { name: "grade", type: "NUMERIC", nullable: true },
      ],
    },
  ],
  Normalization: [
    {
      table: "enrollment_report",
      columns: [
        { name: "student_id", type: "INTEGER", key: "COMPOSITE KEY" },
        { name: "course_id", type: "INTEGER", key: "COMPOSITE KEY" },
        { name: "student_name", type: "TEXT" },
        { name: "course_title", type: "TEXT" },
        { name: "grade", type: "NUMERIC" },
      ],
    },
  ],
  Joins: [
    {
      table: "students",
      columns: [
        { name: "student_id", type: "INTEGER", key: "PRIMARY KEY" },
        { name: "full_name", type: "TEXT", nullable: false },
      ],
    },
    {
      table: "enrollments",
      columns: [
        { name: "enrollment_id", type: "INTEGER", key: "PRIMARY KEY" },
        { name: "student_id", type: "INTEGER", key: "FOREIGN KEY" },
        { name: "course_id", type: "INTEGER", key: "FOREIGN KEY" },
      ],
    },
  ],
  "Constraints & Indexes": [
    {
      table: "courses",
      columns: [
        { name: "course_id", type: "INTEGER", key: "PRIMARY KEY" },
        { name: "course_code", type: "TEXT", key: "UNIQUE" },
        { name: "units", type: "INTEGER", key: "CHECK 1–6" },
      ],
    },
  ],
  Transactions: [
    {
      table: "payments",
      columns: [
        { name: "payment_id", type: "INTEGER", key: "PRIMARY KEY" },
        { name: "student_id", type: "INTEGER", key: "FOREIGN KEY" },
        { name: "amount", type: "NUMERIC", key: "CHECK > 0" },
      ],
    },
  ],
  "Triggers & Procedures": [
    {
      table: "audit_logs",
      columns: [
        { name: "audit_id", type: "INTEGER", key: "PRIMARY KEY" },
        { name: "table_name", type: "TEXT", nullable: false },
        { name: "action", type: "TEXT", nullable: false },
        { name: "changed_at", type: "DATETIME", nullable: false },
      ],
    },
  ],
};

const codeByTopic = {
  SQL: `SELECT student_id, full_name, status
FROM students
WHERE status = 'active'
ORDER BY full_name ASC
LIMIT 5;`,
  Joins: `SELECT s.full_name, e.enrollment_id
FROM students AS s
LEFT JOIN enrollments AS e
  ON e.student_id = s.student_id
ORDER BY s.full_name;`,
  Aggregation: `SELECT course_id, COUNT(*) AS enrollment_count
FROM enrollments
WHERE grade IS NOT NULL
GROUP BY course_id
HAVING COUNT(*) >= 2;`,
  "Advanced Queries": `SELECT s.full_name
FROM students AS s
WHERE EXISTS (
  SELECT 1
  FROM enrollments AS e
  WHERE e.student_id = s.student_id
);`,
  "Constraints & Indexes": `CREATE TABLE courses (
  course_id INTEGER PRIMARY KEY,
  course_code TEXT NOT NULL UNIQUE,
  units INTEGER NOT NULL CHECK (units BETWEEN 1 AND 6)
);`,
  Transactions: `BEGIN;
UPDATE payments
SET amount = amount + 500
WHERE payment_id = 1;
COMMIT;`,
  "Triggers & Procedures": `CREATE TRIGGER payments_after_update
AFTER UPDATE OF amount ON payments
FOR EACH ROW
BEGIN
  INSERT INTO audit_logs(table_name, action)
  VALUES ('payments', 'UPDATE');
END;`,
  "Security & Admin": `cursor.execute(
  "SELECT student_id, full_name FROM students WHERE email = ?",
  (email,)
)`,
  Troubleshooting: `SELECT s.full_name, e.grade
FROM students AS s
LEFT JOIN enrollments AS e
  ON e.student_id = s.student_id
WHERE e.grade >= 75;`,
};

const sampleData = [
  {
    table: "students",
    columns: ["student_id", "full_name", "status"],
    rows: [
      [1, "Maria Santos", "active"],
      [2, "Juan Dela Cruz", "active"],
      [3, "Ari Reyes", "graduated"],
    ],
  },
];

const outputTable = {
  label: "Expected Output",
  columns: ["course_id", "enrollment_count"],
  rows: [
    [101, 3],
    [205, 2],
  ],
};

const raw = JSON.parse(await readFile(sourcePath, "utf8"));
const counters = {};
const questions = raw.map((question, index) => {
  const topic = topicNames[question.topic] ?? question.topic;
  counters[topic] = (counters[topic] ?? 0) + 1;
  const answer = Array.isArray(question.correct_answer)
    ? question.correct_answer
    : [question.correct_answer];
  const slug = topic.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const showSchema = Boolean(schemas[topic]) && (index % 2 === 0 || ["Joins", "Normalization"].includes(topic));
  const showCode = Boolean(codeByTopic[topic]) && (index % 3 !== 0 || ["SQL", "Joins"].includes(topic));
  return {
    id: `${slug}-${String(counters[topic]).padStart(3, "0")}`,
    legacyId: question.id,
    topic,
    difficulty: question.difficulty,
    type: typeNames[question.type] ?? "single-choice",
    question: question.question,
    scenario:
      question.type === "scenario"
        ? `Apply the database rule to this realistic school, job-fair, or reporting situation. Focus on correctness before syntax shortcuts.`
        : undefined,
    schema: showSchema ? schemas[topic] : undefined,
    sampleData: showCode && index % 5 === 0 ? sampleData : undefined,
    code: showCode ? codeByTopic[topic] : undefined,
    codeLabel: topic === "Security & Admin" ? "Parameterized Application Code" : showCode ? "SQL Query" : undefined,
    outputTable: question.type === "sql_output" ? outputTable : undefined,
    choices: question.choices,
    correctAnswers: answer,
    explanation: question.explanation,
    wrongAnswerExplanations: question.why_wrong_answers,
    relatedConcept: question.related_concept,
    reviewFile: question.recommended_review?.[0],
  };
});

await mkdir(dirname(targetPath), { recursive: true });
await writeFile(targetPath, `${JSON.stringify(questions, null, 2)}\n`, "utf8");

const metrics = {
  questions: questions.length,
  code: questions.filter((q) => q.code).length,
  schema: questions.filter((q) => q.schema).length,
  scenarios: questions.filter((q) => q.scenario).length,
  proceduresAndTriggers: questions.filter((q) => q.topic === "Triggers & Procedures").length,
  normalization: questions.filter((q) => q.topic === "Normalization").length,
  security: questions.filter((q) => q.topic === "Security & Admin").length,
};
console.log(metrics);

