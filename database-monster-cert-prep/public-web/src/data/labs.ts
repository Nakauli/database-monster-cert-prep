import type { SqlExpectedPattern } from "@/lib/sql-patterns";

interface Lab {
  id: string;
  title: string;
  topic: string;
  objective: string;
  schema: string;
  tasks: string[];
  starter: string;
  answer: string;
  expectedPatterns: SqlExpectedPattern[];
  rubric: string[];
}

export const labs: Lab[] = [
  {
    id: "select-basics",
    title: "SELECT fundamentals",
    topic: "SQL",
    objective: "Retrieve columns, use aliases, remove duplicates, sort deterministically, and limit results.",
    schema: "students(student_id, student_number, full_name, email, year_level, status)",
    tasks: ["List active students alphabetically.", "Return distinct status values.", "Show the three highest year levels.", "Replace NULL email with 'No email'."],
    starter: "SELECT student_id, full_name\nFROM students\nWHERE /* add condition */\nORDER BY /* add sort */;",
    answer: "SELECT student_id, full_name\nFROM students\nWHERE status = 'active'\nORDER BY full_name ASC;",
    expectedPatterns: [
      { id: "select", label: "Select student identity columns", pattern: "\\bselect\\b[\\s\\S]*(student_id|student_number)[\\s\\S]*full_name" },
      { id: "from", label: "Read from students", pattern: "\\bfrom\\s+students\\b" },
      { id: "active", label: "Filter active students", pattern: "\\bwhere\\b[\\s\\S]*status\\s*=\\s*'active'" },
      { id: "sort", label: "Sort by name", pattern: "\\border\\s+by\\s+full_name\\b" },
    ],
    rubric: ["Uses the students table.", "Filters active rows before sorting.", "Orders by a stable student name column."],
  },
  {
    id: "filtering",
    title: "Filtering and NULL",
    topic: "SQL",
    objective: "Combine predicates safely and distinguish NULL from zero and empty text.",
    schema: "students(student_id, full_name, email, department_id, year_level, status)",
    tasks: ["Find active IT students in year 2 or above.", "Find students with no email.", "Use parentheses with AND and OR."],
    starter: "SELECT *\nFROM students\nWHERE status = 'active';",
    answer: "SELECT *\nFROM students\nWHERE status = 'active'\n  AND department_id = 1\n  AND year_level >= 2;",
    expectedPatterns: [
      { id: "from", label: "Read from students", pattern: "\\bfrom\\s+students\\b" },
      { id: "active", label: "Filter active students", pattern: "status\\s*=\\s*'active'" },
      { id: "department", label: "Filter department", pattern: "department_id\\s*=\\s*1" },
      { id: "year", label: "Filter year level", pattern: "year_level\\s*>=\\s*2" },
    ],
    rubric: ["Combines all predicates with AND.", "Uses IS NULL for missing email tasks.", "Uses parentheses when mixing AND with OR."],
  },
  {
    id: "joins",
    title: "Joins and unmatched rows",
    topic: "Joins",
    objective: "Choose a join from the required rows and preserve students without enrollments.",
    schema: "students(student_id, full_name)\nenrollments(enrollment_id, student_id, course_id, grade)",
    tasks: ["Show student names with enrollment grades.", "Keep students with no enrollment.", "Find courses with zero enrollments."],
    starter: "SELECT s.full_name, e.grade\nFROM students AS s\n/* choose join */ enrollments AS e\n  ON e.student_id = s.student_id;",
    answer: "SELECT s.full_name, e.grade\nFROM students AS s\nLEFT JOIN enrollments AS e\n  ON e.student_id = s.student_id;",
    expectedPatterns: [
      { id: "left-join", label: "Use LEFT JOIN", pattern: "\\bleft\\s+join\\s+enrollments\\b" },
      { id: "students", label: "Start from students", pattern: "\\bfrom\\s+students\\b" },
      { id: "join-key", label: "Join on student_id", pattern: "e\\.student_id\\s*=\\s*s\\.student_id|s\\.student_id\\s*=\\s*e\\.student_id" },
    ],
    rubric: ["Starts from students to preserve unmatched students.", "Uses LEFT JOIN rather than INNER JOIN.", "Joins on the foreign key relationship."],
  },
  {
    id: "grouping",
    title: "Aggregation and grouping",
    topic: "Aggregation",
    objective: "Group at the correct level and separate row filters from group filters.",
    schema: "courses(course_id, course_code)\nenrollments(enrollment_id, course_id, grade)",
    tasks: ["Count enrollments per course.", "Calculate average recorded grade.", "Keep courses with at least two enrollments."],
    starter: "SELECT course_id, COUNT(*)\nFROM enrollments\nGROUP BY course_id;",
    answer: "SELECT course_id, COUNT(*) AS enrollment_count, AVG(grade) AS average_grade\nFROM enrollments\nGROUP BY course_id\nHAVING COUNT(*) >= 2;",
    expectedPatterns: [
      { id: "count", label: "Count enrollments", pattern: "\\bcount\\s*\\(" },
      { id: "avg", label: "Average grade", pattern: "\\bavg\\s*\\(\\s*grade\\s*\\)" },
      { id: "group", label: "Group by course", pattern: "\\bgroup\\s+by\\s+course_id\\b" },
      { id: "having", label: "Filter groups with HAVING", pattern: "\\bhaving\\b[\\s\\S]*count\\s*\\(" },
    ],
    rubric: ["Groups by course_id.", "Uses aggregate functions only for grouped facts.", "Uses HAVING for group-level filtering."],
  },
  {
    id: "subqueries",
    title: "Subqueries and EXISTS",
    topic: "Advanced Queries",
    objective: "Use scalar subqueries and robust existence checks.",
    schema: "students(student_id, full_name)\nenrollments(student_id, grade)",
    tasks: ["Find students above the overall average grade.", "Find students with no enrollment using NOT EXISTS."],
    starter: "SELECT s.full_name\nFROM students AS s\nWHERE EXISTS (/* correlated query */);",
    answer: "SELECT s.full_name\nFROM students AS s\nWHERE NOT EXISTS (\n  SELECT 1 FROM enrollments AS e\n  WHERE e.student_id = s.student_id\n);",
    expectedPatterns: [
      { id: "not-exists", label: "Use NOT EXISTS", pattern: "\\bnot\\s+exists\\b" },
      { id: "correlated", label: "Correlate on student_id", pattern: "e\\.student_id\\s*=\\s*s\\.student_id|s\\.student_id\\s*=\\s*e\\.student_id" },
      { id: "subquery", label: "Include a subquery SELECT", pattern: "\\(\\s*select\\b" },
    ],
    rubric: ["Uses a correlated subquery.", "Uses NOT EXISTS for students with no enrollment.", "Avoids comparing NULL with equals."],
  },
  {
    id: "constraints",
    title: "DDL and constraints",
    topic: "Constraints & Indexes",
    objective: "Encode business rules in the schema rather than only in application code.",
    schema: "mentors(mentor_id, email, full_name, hourly_rate, active)",
    tasks: ["Require a unique email.", "Reject nonpositive rates.", "Default active to true.", "Add an index for name lookup."],
    starter: "CREATE TABLE mentors (\n  mentor_id INTEGER PRIMARY KEY\n);",
    answer: "CREATE TABLE mentors (\n  mentor_id INTEGER PRIMARY KEY,\n  email TEXT NOT NULL UNIQUE,\n  full_name TEXT NOT NULL,\n  hourly_rate NUMERIC NOT NULL CHECK (hourly_rate > 0),\n  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))\n);",
    expectedPatterns: [
      { id: "create", label: "Create mentors table", pattern: "\\bcreate\\s+table\\s+mentors\\b" },
      { id: "unique", label: "Require unique email", pattern: "email[\\s\\S]*unique" },
      { id: "check-rate", label: "Check positive hourly rate", pattern: "check\\s*\\([\\s\\S]*hourly_rate\\s*>\\s*0[\\s\\S]*\\)" },
      { id: "default", label: "Default active flag", pattern: "active[\\s\\S]*default\\s+1" },
    ],
    rubric: ["Moves business rules into constraints.", "Marks required columns NOT NULL.", "Uses CHECK for numeric and flag rules."],
  },
  {
    id: "transactions",
    title: "Safe DML and transactions",
    topic: "Transactions",
    objective: "Preview changes, group one business operation, and recover from mistakes.",
    schema: "payments(payment_id, student_id, payment_type, amount, reference_number)",
    tasks: ["Preview the target row.", "Update inside a transaction.", "Use a savepoint.", "Roll back the experiment."],
    starter: "BEGIN;\nUPDATE payments\nSET amount = amount + 500\nWHERE payment_id = 1;\n/* finish safely */",
    answer: "BEGIN;\nSAVEPOINT before_change;\nUPDATE payments\nSET amount = amount + 500\nWHERE payment_id = 1;\nROLLBACK TO before_change;\nCOMMIT;",
    expectedPatterns: [
      { id: "begin", label: "Begin transaction", pattern: "\\bbegin\\b" },
      { id: "savepoint", label: "Use savepoint", pattern: "\\bsavepoint\\b" },
      { id: "update", label: "Update payment amount", pattern: "\\bupdate\\s+payments\\b[\\s\\S]*\\bset\\s+amount\\b" },
      { id: "rollback", label: "Roll back to savepoint", pattern: "\\brollback\\s+to\\b" },
      { id: "commit", label: "Commit transaction", pattern: "\\bcommit\\b" },
    ],
    rubric: ["Wraps the change in a transaction.", "Creates a recovery point.", "Finishes with an explicit transaction decision."],
  },
  {
    id: "triggers",
    title: "Audit trigger",
    topic: "Triggers & Procedures",
    objective: "Record payment amount changes automatically while understanding OLD and NEW values.",
    schema: "payments(payment_id, amount)\naudit_logs(audit_id, table_name, record_id, old_value, new_value)",
    tasks: ["Create an AFTER UPDATE trigger.", "Write OLD and NEW amounts.", "Explain why hidden trigger side effects need documentation."],
    starter: "CREATE TRIGGER payments_after_update\nAFTER UPDATE OF amount ON payments\nFOR EACH ROW\nBEGIN\n  /* insert audit row */\nEND;",
    answer: "CREATE TRIGGER payments_after_update\nAFTER UPDATE OF amount ON payments\nFOR EACH ROW\nBEGIN\n  INSERT INTO audit_logs(table_name, record_id, old_value, new_value)\n  VALUES ('payments', OLD.payment_id, OLD.amount, NEW.amount);\nEND;",
    expectedPatterns: [
      { id: "trigger", label: "Create trigger", pattern: "\\bcreate\\s+trigger\\b" },
      { id: "after-update", label: "Run after amount update", pattern: "\\bafter\\s+update\\s+of\\s+amount\\s+on\\s+payments\\b" },
      { id: "insert-audit", label: "Insert audit row", pattern: "\\binsert\\s+into\\s+audit_logs\\b" },
      { id: "old-new", label: "Use OLD and NEW values", pattern: "\\bold\\.amount\\b[\\s\\S]*\\bnew\\.amount\\b|\\bnew\\.amount\\b[\\s\\S]*\\bold\\.amount\\b" },
    ],
    rubric: ["Defines the trigger timing and event.", "Writes to the audit table.", "Uses OLD and NEW values deliberately."],
  },
];
