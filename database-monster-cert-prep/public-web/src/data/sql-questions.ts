// Interactive "write the query" questions. These run against the canonical
// in-browser dataset (see sql-datasets.ts) and are auto-graded by comparing the
// candidate's result set to `expectedSql`. Kept separate from questions.json so
// the JSON data validator stays focused on the multiple-choice bank.

import type { Question, SchemaTable } from "@/lib/types";
import { DATASET_TABLES } from "@/data/sql-datasets";

function schemaFor(...names: string[]): SchemaTable[] {
  return DATASET_TABLES.filter((table) => names.includes(table.name)).map((table) => ({
    table: table.name,
    columns: table.columns.map((column) => ({
      name: column.name,
      type: column.type,
      key: column.note === "PK" ? "PRIMARY KEY" : column.note === "FK" ? "FOREIGN KEY" : undefined,
      nullable: column.note === "nullable" ? true : undefined,
    })),
  }));
}

const base = {
  type: "sql-write" as const,
  choices: [],
  correctAnswers: [],
  wrongAnswerExplanations: {},
};

export const sqlQuestions: Question[] = [
  {
    ...base,
    id: "sqlw-active-students",
    topic: "SQL",
    difficulty: "easy",
    question: "Write a query that returns the full_name of every active student, sorted alphabetically (A to Z).",
    schema: schemaFor("students"),
    starterSql: "SELECT full_name\nFROM students\nWHERE /* condition */\nORDER BY /* column */;",
    expectedSql: "SELECT full_name FROM students WHERE status = 'active' ORDER BY full_name ASC;",
    explanation:
      "Filter on status = 'active' in the WHERE clause, then ORDER BY full_name ASC. Because the task asks for a specific order, the grader checks row order here.",
  },
  {
    ...base,
    id: "sqlw-left-join-grades",
    topic: "Joins",
    difficulty: "medium",
    question:
      "Return each student's full_name alongside their enrollment grade. Students with no enrollments must still appear (with a NULL grade).",
    schema: schemaFor("students", "enrollments"),
    starterSql:
      "SELECT s.full_name, e.grade\nFROM students AS s\n/* which join keeps unmatched students? */ enrollments AS e\n  ON e.student_id = s.student_id;",
    expectedSql:
      "SELECT s.full_name, e.grade FROM students AS s LEFT JOIN enrollments AS e ON e.student_id = s.student_id;",
    explanation:
      "A LEFT JOIN preserves rows from the left table (students) even when no matching enrollment exists, producing NULL for e.grade.",
  },
  {
    ...base,
    id: "sqlw-having-count",
    topic: "Aggregation",
    difficulty: "medium",
    question:
      "For each course_id, return the course_id and the number of enrollments as enrollment_count — but only for courses that have at least two enrollments.",
    schema: schemaFor("enrollments"),
    starterSql: "SELECT course_id, COUNT(*) AS enrollment_count\nFROM enrollments\nGROUP BY course_id\n/* filter groups */;",
    expectedSql:
      "SELECT course_id, COUNT(*) AS enrollment_count FROM enrollments GROUP BY course_id HAVING COUNT(*) >= 2;",
    explanation:
      "Group by course_id, then use HAVING (not WHERE) to filter on the aggregated count. WHERE filters rows before grouping; HAVING filters groups after.",
  },
  {
    ...base,
    id: "sqlw-above-average",
    topic: "Advanced Queries",
    difficulty: "hard",
    question:
      "Return the distinct full_name of every student who has at least one enrollment grade above the overall average grade across all enrollments.",
    schema: schemaFor("students", "enrollments"),
    starterSql:
      "SELECT DISTINCT s.full_name\nFROM students AS s\nJOIN enrollments AS e ON e.student_id = s.student_id\nWHERE e.grade > (/* scalar subquery */);",
    expectedSql:
      "SELECT DISTINCT s.full_name FROM students AS s JOIN enrollments AS e ON e.student_id = s.student_id WHERE e.grade > (SELECT AVG(grade) FROM enrollments);",
    explanation:
      "A scalar subquery computes the overall AVG(grade) (which ignores NULL). Join students to enrollments and keep grades above that value, using DISTINCT to avoid duplicate names.",
  },
];
