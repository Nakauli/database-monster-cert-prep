import { schemaFor, sqlChallenges } from "@/data/sql-questions";
import type { SqlExpectedPattern } from "@/lib/sql-patterns";
import type { SchemaTable } from "@/lib/types";

export interface PracticeDrill {
  title: string;
  prompt: string;
  starter: string;
  expectedSql: string;
  answer: string;
  schema: SchemaTable[];
  expectedPatterns: SqlExpectedPattern[];
  rubric: string[];
}

const topicDrills: Record<string, Omit<PracticeDrill, "title">> = {
  SQL: {
    prompt: "Write a query that lists active students alphabetically.",
    schema: schemaFor("students"),
    starter: "SELECT student_id, full_name\nFROM students\nWHERE status = 'active'\nORDER BY full_name;",
    expectedSql: "SELECT student_id, full_name\nFROM students\nWHERE status = 'active'\nORDER BY full_name ASC;",
    answer: "SELECT student_id, full_name\nFROM students\nWHERE status = 'active'\nORDER BY full_name ASC;",
    expectedPatterns: [
      { id: "select", label: "SELECT columns", pattern: "\\bselect\\b[\\s\\S]*full_name" },
      { id: "from", label: "FROM students", pattern: "\\bfrom\\s+students\\b" },
      { id: "where", label: "Filter active", pattern: "status\\s*=\\s*'active'" },
      { id: "order", label: "ORDER BY name", pattern: "\\border\\s+by\\s+full_name\\b" },
    ],
    rubric: ["Returns only active students.", "Selects readable student columns.", "Sorts by a stable name column."],
  },
  Joins: {
    prompt: "Write a query that keeps all students even when they have no enrollment.",
    schema: schemaFor("students", "enrollments"),
    starter: "SELECT s.full_name, e.grade\nFROM students AS s\nLEFT JOIN enrollments AS e\n  ON e.student_id = s.student_id;",
    expectedSql: "SELECT s.full_name, e.grade\nFROM students AS s\nLEFT JOIN enrollments AS e\n  ON e.student_id = s.student_id;",
    answer: "SELECT s.full_name, e.grade\nFROM students AS s\nLEFT JOIN enrollments AS e\n  ON e.student_id = s.student_id;",
    expectedPatterns: [
      { id: "students", label: "FROM students", pattern: "\\bfrom\\s+students\\b" },
      { id: "left", label: "LEFT JOIN enrollments", pattern: "\\bleft\\s+join\\s+enrollments\\b" },
      { id: "key", label: "Join student_id", pattern: "student_id\\s*=\\s*.*student_id" },
    ],
    rubric: ["Uses LEFT JOIN for unmatched rows.", "Joins on student_id.", "Selects fields from both table aliases."],
  },
  Aggregation: {
    prompt: "Write a query that counts enrollments per course and keeps courses with at least two enrollments.",
    schema: schemaFor("enrollments"),
    starter: "SELECT course_id, COUNT(*) AS enrollment_count\nFROM enrollments\nGROUP BY course_id\nHAVING COUNT(*) >= 2;",
    expectedSql: "SELECT course_id, COUNT(*) AS enrollment_count\nFROM enrollments\nGROUP BY course_id\nHAVING COUNT(*) >= 2;",
    answer: "SELECT course_id, COUNT(*) AS enrollment_count\nFROM enrollments\nGROUP BY course_id\nHAVING COUNT(*) >= 2;",
    expectedPatterns: [
      { id: "count", label: "COUNT", pattern: "\\bcount\\s*\\(" },
      { id: "group", label: "GROUP BY course", pattern: "\\bgroup\\s+by\\s+course_id\\b" },
      { id: "having", label: "HAVING count", pattern: "\\bhaving\\b[\\s\\S]*count\\s*\\(" },
    ],
    rubric: ["Groups at the course level.", "Counts rows per group.", "Uses HAVING for aggregate filters."],
  },
};

export function getPracticeDrill(topic: string): PracticeDrill | null {
  const staticDrill = topicDrills[topic];
  if (staticDrill) return { ...staticDrill, title: `${topic} drill` };

  const challenge = sqlChallenges.find((item) => item.topic === topic);
  if (!challenge) return null;

  return {
    title: `${topic} drill`,
    prompt: challenge.prompt,
    starter: challenge.starter,
    expectedSql: challenge.expectedSql,
    answer: challenge.expectedSql,
    schema: challenge.schema,
    expectedPatterns: challenge.expectedPatterns,
    rubric: challenge.rubric,
  };
}
