import type { SqlExpectedPattern } from "@/lib/sql-patterns";
import type { SchemaTable } from "@/lib/types";
import { DATASET_TABLES } from "@/data/sql-datasets";

export function schemaFor(...names: string[]): SchemaTable[] {
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

export interface SqlChallenge {
  id: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  prompt: string;
  starter: string;
  expectedSql: string;
  explanation: string;
  schema: SchemaTable[];
  expectedPatterns: SqlExpectedPattern[];
  rubric: string[];
}

export const sqlChallenges: SqlChallenge[] = [
  {
    id: "sqlw-active-students",
    topic: "SQL",
    difficulty: "easy",
    prompt: "Return the full_name of every active student, sorted alphabetically.",
    schema: schemaFor("students"),
    starter: "SELECT full_name\nFROM students\nWHERE /* TODO: status filter */\nORDER BY /* TODO: sort column */;",
    expectedSql: "SELECT full_name FROM students WHERE status = 'active' ORDER BY full_name ASC;",
    explanation: "Filter with WHERE status = 'active', then sort with ORDER BY full_name ASC.",
    expectedPatterns: [
      { id: "select-name", label: "Select full_name", pattern: "\\bselect\\b[\\s\\S]*full_name" },
      { id: "from-students", label: "FROM students", pattern: "\\bfrom\\s+students\\b" },
      { id: "active", label: "Filter active", pattern: "status\\s*=\\s*'active'" },
      { id: "sort", label: "Sort by full_name", pattern: "\\border\\s+by\\s+full_name\\b" },
    ],
    rubric: ["Returns one readable name column.", "Keeps only active students.", "Sorts names A to Z."],
  },
  {
    id: "sqlw-left-join-grades",
    topic: "Joins",
    difficulty: "medium",
    prompt: "Return each student's full_name beside their enrollment grade. Students with no enrollments must still appear.",
    schema: schemaFor("students", "enrollments"),
    starter:
      "SELECT s.full_name, e.grade\nFROM students AS s\n/* TODO: join that keeps unmatched students */ enrollments AS e\n  ON e.student_id = s.student_id;",
    expectedSql:
      "SELECT s.full_name, e.grade FROM students AS s LEFT JOIN enrollments AS e ON e.student_id = s.student_id;",
    explanation: "LEFT JOIN preserves rows from students even when no matching enrollment exists.",
    expectedPatterns: [
      { id: "students", label: "FROM students", pattern: "\\bfrom\\s+students\\b" },
      { id: "left-join", label: "LEFT JOIN enrollments", pattern: "\\bleft\\s+join\\s+enrollments\\b" },
      { id: "join-key", label: "Join on student_id", pattern: "student_id\\s*=\\s*.*student_id" },
    ],
    rubric: ["Starts from students.", "Uses LEFT JOIN.", "Joins on student_id."],
  },
  {
    id: "sqlw-having-count",
    topic: "Aggregation",
    difficulty: "medium",
    prompt: "Return course_id and enrollment_count only for courses with at least two enrollments.",
    schema: schemaFor("enrollments"),
    starter: "SELECT course_id, COUNT(*) AS enrollment_count\nFROM enrollments\nGROUP BY course_id\n/* TODO: HAVING count filter */;",
    expectedSql:
      "SELECT course_id, COUNT(*) AS enrollment_count FROM enrollments GROUP BY course_id HAVING COUNT(*) >= 2;",
    explanation: "Use GROUP BY for course_id and HAVING for the aggregate count filter.",
    expectedPatterns: [
      { id: "count", label: "COUNT(*)", pattern: "\\bcount\\s*\\(\\s*\\*\\s*\\)" },
      { id: "group", label: "GROUP BY course", pattern: "\\bgroup\\s+by\\s+course_id\\b" },
      { id: "having", label: "HAVING count", pattern: "\\bhaving\\b[\\s\\S]*count\\s*\\(" },
    ],
    rubric: ["Counts enrollments per course.", "Groups by course_id.", "Uses HAVING after grouping."],
  },
  {
    id: "sqlw-above-average",
    topic: "Advanced Queries",
    difficulty: "hard",
    prompt: "Return distinct student names for students with at least one grade above the overall average grade.",
    schema: schemaFor("students", "enrollments"),
    starter:
      "SELECT DISTINCT s.full_name\nFROM students AS s\nJOIN enrollments AS e ON e.student_id = s.student_id\nWHERE e.grade > (/* TODO: SELECT AVG(grade) FROM enrollments */);",
    expectedSql:
      "SELECT DISTINCT s.full_name FROM students AS s JOIN enrollments AS e ON e.student_id = s.student_id WHERE e.grade > (SELECT AVG(grade) FROM enrollments);",
    explanation: "A scalar subquery computes the overall average; DISTINCT avoids duplicate names.",
    expectedPatterns: [
      { id: "distinct", label: "DISTINCT names", pattern: "\\bselect\\s+distinct\\b[\\s\\S]*full_name" },
      { id: "join", label: "JOIN enrollments", pattern: "\\bjoin\\s+enrollments\\b" },
      { id: "avg-subquery", label: "AVG subquery", pattern: "\\(\\s*select\\s+avg\\s*\\(\\s*grade\\s*\\)" },
    ],
    rubric: ["Joins students to enrollments.", "Compares against AVG(grade).", "Returns each matching student once."],
  },
];
