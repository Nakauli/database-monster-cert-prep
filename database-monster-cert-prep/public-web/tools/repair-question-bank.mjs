import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const bankPath = path.resolve(currentDirectory, "../../data/question_bank.json");
const questions = JSON.parse(await fs.readFile(bankPath, "utf8"));

let byId = new Map(questions.map((question) => [question.id, question]));

function getQuestion(id) {
  const question = byId.get(id);

  if (!question) {
    throw new Error(`Question ${id} was not found.`);
  }

  return question;
}

function patchQuestion(id, patch) {
  Object.assign(getQuestion(id), patch);
}

function replaceStrings(value, replacements) {
  if (typeof value === "string") {
    return replacements.reduce(
      (result, [search, replacement]) => result.replaceAll(search, replacement),
      value,
    );
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceStrings(item, replacements));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        replaceStrings(key, replacements),
        replaceStrings(item, replacements),
      ]),
    );
  }

  return value;
}

const globalReplacements = [
  ["One companie may", "One company may"],
  ["one companie.", "one company."],
  ["One categorie may", "One category may"],
  ["one categorie.", "one category."],
  ["One branche may", "One branch may"],
  ["one branche.", "one branch."],
  ["A author can", "An author can"],
  ["A employee can", "An employee can"],
  ["a order can", "an order can"],
  ["a event can", "an event can"],
  ["A actor can", "An actor can"],
  ["A `order` table", "An `order` table"],
  ["A `employee` table", "An `employee` table"],
  ["A `event` table", "An `event` table"],
  ["for a auditor?", "for an auditor?"],
  ["for a analytics service?", "for an analytics service?"],
  ["for a application runtime?", "for an application runtime?"],
  ["1 rows", "1 row"],
  ["None", "NULL"],
  ["all 1 row", "the only row"],
  ["the 1 non-NULL values", "the one non-NULL value"],
  ["2nf", "2NF"],
  ["3nf", "3NF"],
];

for (let index = 0; index < questions.length; index += 1) {
  questions[index] = replaceStrings(questions[index], globalReplacements);
}
byId = new Map(questions.map((question) => [question.id, question]));

// Make the NULL-semantics questions test distinct concepts.
patchQuestion("Q0014", {
  question:
    "A row has `optional_value = NULL`. The predicate `optional_value = NULL` evaluates TRUE for this row.",
  correct_answer: "False",
  explanation:
    "Comparing NULL with `=` produces UNKNOWN, not TRUE. Use `IS NULL` to test for the NULL marker.",
  why_wrong_answers: {
    True: "SQL uses three-valued logic, so `NULL = NULL` is UNKNOWN rather than TRUE.",
  },
});

patchQuestion("Q0016", {
  question:
    "A row has `optional_value = NULL`. The predicate `COALESCE(optional_value, 0) = 0` evaluates TRUE for this row.",
  correct_answer: "True",
  explanation:
    "`COALESCE(optional_value, 0)` substitutes 0 for NULL, so the comparison becomes `0 = 0`.",
  why_wrong_answers: {
    False: "`COALESCE` replaces the NULL marker before the equality comparison is evaluated.",
  },
});

patchQuestion("Q0018", {
  question:
    "A row has `optional_value = ''`. The predicate `optional_value IS NOT NULL` evaluates TRUE for this row.",
  correct_answer: "True",
  explanation:
    "An empty string is still a stored value, so `IS NOT NULL` evaluates TRUE.",
  why_wrong_answers: {
    False: "An empty string and the NULL marker are different values in standard SQL.",
  },
});

patchQuestion("Q0019", {
  question:
    "A row has `optional_value = NULL`. The predicate `optional_value IS NOT NULL` evaluates TRUE for this row.",
  correct_answer: "False",
  explanation:
    "`IS NOT NULL` is false when the expression contains the NULL marker.",
  why_wrong_answers: {
    True: "`IS NOT NULL` succeeds only for stored non-NULL values.",
  },
});

// Use domain-appropriate statuses in the outer-join filtering examples.
const joinStatuses = {
  Q0143: ["paid", "pending"],
  Q0144: ["open", "active"],
  Q0145: ["current", "open"],
  Q0146: ["active", "published"],
  Q0147: ["pending", "active"],
  Q0148: ["paid", "active"],
  Q0149: ["open", "active"],
  Q0150: ["current", "confirmed"],
};

for (const [id, replacements] of Object.entries(joinStatuses)) {
  const [oldStatus, newStatus] = replacements;
  Object.assign(
    getQuestion(id),
    replaceStrings(getQuestion(id), [
      [`status='${oldStatus}'`, `status='${newStatus}'`],
    ]),
  );
}

// Repair duplicate COUNT choices and make each distractor mathematically distinct.
patchQuestion("Q0156", {
  choices: [
    "3 and 3",
    "3 and 2",
    "2 and 3",
    "Both return NULL because the group contains NULL.",
  ],
  why_wrong_answers: {
    "3 and 2": "There are no NULL values, so `COUNT(amount)` also counts all three rows.",
    "2 and 3": "`COUNT(*)` cannot be smaller than `COUNT(amount)` for the same group.",
    "Both return NULL because the group contains NULL.":
      "COUNT returns a number, and this group does not contain NULL.",
  },
});

patchQuestion("Q0159", {
  choices: [
    "1 and 1",
    "1 and 0",
    "0 and 1",
    "Both return NULL because the group contains NULL.",
  ],
  explanation:
    "`COUNT(*)` counts the only row; `COUNT(amount)` counts the one non-NULL value.",
  why_wrong_answers: {
    "1 and 0": "The amount is 9 rather than NULL, so `COUNT(amount)` returns 1.",
    "0 and 1": "`COUNT(*)` counts the row and therefore cannot return 0.",
    "Both return NULL because the group contains NULL.":
      "COUNT returns a number, and this group does not contain NULL.",
  },
});

patchQuestion("Q0111", {
  question:
    "In SQLite, which query reliably returns the single `students` row with the largest `student_id` value?",
});

patchQuestion("Q0116", {
  question:
    "In SQLite, which query reliably returns the single `alumni` row with the largest `alumni_id` value?",
});

// COUNT a nullable child key after LEFT JOIN so empty parent groups are not counted as one match.
const havingQuestions = {
  Q0161: ["departments", "students", "student_id", 2],
  Q0162: ["customers", "orders", "order_id", 3],
  Q0163: ["companies", "applications", "application_id", 4],
  Q0164: ["courses", "enrollments", "enrollment_id", 5],
  Q0165: ["projects", "tasks", "task_id", 2],
  Q0166: ["authors", "books", "book_id", 3],
  Q0167: ["teams", "players", "player_id", 4],
  Q0168: ["categories", "products", "product_id", 5],
  Q0169: ["branches", "employees", "employee_id", 2],
  Q0170: ["events", "registrations", "registration_id", 3],
};

for (const [id, [parent, child, childKey, minimum]] of Object.entries(havingQuestions)) {
  const aggregate = `COUNT(c.${childKey})`;
  const correct = `HAVING ${aggregate} >= ${minimum}`;
  const whereChoice = `WHERE ${aggregate} >= ${minimum}`;
  const orderChoice = `ORDER BY ${aggregate} >= ${minimum}`;
  const groupChoice = `GROUP BY ${aggregate} >= ${minimum}`;

  patchQuestion(id, {
    question: `After \`${parent} AS p LEFT JOIN ${child} AS c\`, which clause keeps only parent groups with at least ${minimum} matching child rows?`,
    choices: [whereChoice, correct, orderChoice, groupChoice],
    correct_answer: correct,
    explanation:
      `HAVING filters after grouping. Counting \`c.${childKey}\` ignores the NULL-extended row produced for a parent with no child match.`,
    why_wrong_answers: {
      [whereChoice]: "WHERE is evaluated before aggregate groups are formed.",
      [orderChoice]: "ORDER BY sorts results; it does not filter aggregate groups.",
      [groupChoice]: "GROUP BY defines grouping keys; it does not apply an aggregate filter.",
    },
  });
}

// Group by columns that plausibly belong to each table.
const groupingColumns = {
  Q0171: "department_id",
  Q0172: "department_id",
  Q0173: "industry_id",
  Q0174: "student_id",
  Q0175: "campus_id",
  Q0176: "graduation_year",
  Q0177: "department_id",
  Q0178: "category_id",
  Q0179: "customer_id",
  Q0180: "branch_id",
};

for (const [id, groupColumn] of Object.entries(groupingColumns)) {
  getQuestion(id).question = getQuestion(id).question.replace(
    "by `category_id`",
    `by \`${groupColumn}\``,
  );
}

// Replace placeholder owner keys with concrete parent/child relationships.
const antiJoinEntities = {
  Q0191: ["students", "enrollments", "student_id"],
  Q0192: ["customers", "orders", "customer_id"],
  Q0193: ["companies", "applications", "company_id"],
  Q0194: ["courses", "registrations", "course_id"],
  Q0195: ["projects", "tasks", "project_id"],
  Q0196: ["authors", "books", "author_id"],
  Q0197: ["teams", "players", "team_id"],
  Q0198: ["categories", "products", "category_id"],
  Q0199: ["branches", "employees", "branch_id"],
  Q0200: ["events", "tickets", "event_id"],
};

for (const [id, [parent, child, key]] of Object.entries(antiJoinEntities)) {
  const correct = `WHERE NOT EXISTS (SELECT 1 FROM ${child} AS c WHERE c.${key} = p.${key})`;
  const notIn = `WHERE p.${key} NOT IN (SELECT ${key} FROM ${child})`;
  const nullComparison = `WHERE p.${key} = NULL`;
  const union = `UNION ALL SELECT * FROM ${child}`;

  patchQuestion(id, {
    question: `A query uses \`${parent} AS p\` and must find rows with no matching \`${child}\`. The child \`${key}\` may contain NULL. Which predicate is most robust?`,
    choices: [correct, notIn, nullComparison, union],
    correct_answer: correct,
    explanation:
      "`NOT EXISTS` tests each parent row for an absent match and avoids the UNKNOWN result that NULL can introduce into `NOT IN`.",
    why_wrong_answers: {
      [notIn]:
        "A NULL returned by the subquery can make `NOT IN` evaluate UNKNOWN for every parent row.",
      [nullComparison]: "Use `IS NULL` for NULL checks; equality with NULL is UNKNOWN.",
      [union]: "UNION ALL combines result sets and does not test whether a child row exists.",
    },
  });
}

// Preserve the UNION/UNION ALL concepts while making every scenario distinct.
const setOperationPrompts = {
  Q0201:
    "Current and archived student-email queries must be stacked while retaining repeated addresses. Which operator fits?",
  Q0202:
    "Two regional course-code queries must be stacked with duplicate codes removed. Which operator fits?",
  Q0203:
    "Online and walk-in payment queries must be stacked while retaining identical payment rows. Which operator fits?",
  Q0204:
    "Two alumni-contact queries must be stacked with duplicate contacts removed. Which operator fits?",
  Q0205:
    "Morning and evening attendance queries must be stacked while retaining repeated entries. Which operator fits?",
  Q0206:
    "Two supplier-name queries must be stacked with duplicate names removed. Which operator fits?",
  Q0207:
    "Successful and failed import-log queries must be stacked while retaining repeated messages. Which operator fits?",
  Q0208:
    "Two event-category queries must be stacked with duplicate categories removed. Which operator fits?",
  Q0209:
    "Domestic and international order queries must be stacked while retaining repeated order values. Which operator fits?",
  Q0210:
    "Two membership-tag queries must be stacked with duplicate tags removed. Which operator fits?",
};

for (const [id, question] of Object.entries(setOperationPrompts)) {
  getQuestion(id).question = question;
}

// State the exact cross-platform feature being tested instead of repeating a vague prompt.
const programmingPrompts = {
  Q0271: "Which statement accurately describes stored-procedure support in SQLite?",
  Q0272: "How is a stored procedure normally invoked in MySQL?",
  Q0273: "How is a stored procedure normally invoked in SQL Server?",
  Q0274: "How does a SQLite row trigger refer to values from the affected row?",
  Q0275: "How does a MySQL row trigger refer to values from the affected row?",
  Q0276: "How do SQL Server DML triggers receive the affected rows?",
  Q0277: "Which statement accurately describes trigger support in SQLite?",
  Q0278: "Why is `DELIMITER` commonly used while defining MySQL stored programs?",
  Q0279: "Why is `SET NOCOUNT ON` commonly used in a SQL Server procedure?",
  Q0280: "What is a practical consequence of SQLite not supporting stored procedures?",
};

for (const [id, question] of Object.entries(programmingPrompts)) {
  getQuestion(id).question = question;
}

const objectSelectionPrompts = {
  Q0291: "Which database-programming object best records every update to student grades automatically?",
  Q0292: "Which database-programming object best runs an explicit multi-step course-registration workflow?",
  Q0293: "Which database-programming object best returns a reusable calculated tuition value inside a query?",
  Q0294: "Which database-programming object best records every change to employee salaries automatically?",
  Q0295: "Which database-programming object best runs an explicit month-end billing workflow?",
  Q0296: "Which database-programming object best returns a reusable tax calculation inside a query?",
  Q0297: "Which database-programming object best records every deletion from an orders table automatically?",
  Q0298: "Which database-programming object best runs an explicit multi-step account-closing workflow?",
  Q0299: "Which database-programming object best returns a reusable age calculation inside a query?",
  Q0300: "Which database-programming object best records every change to product prices automatically?",
};

for (const [id, question] of Object.entries(objectSelectionPrompts)) {
  getQuestion(id).question = question;
}

patchQuestion("Q0338", {
  question:
    "MySQL error: `Subquery returns more than 1 row`. What is the best first diagnosis?",
  explanation:
    "A scalar comparison or expression expected one value, but its subquery produced multiple rows. Inspect the subquery and the comparison that consumes it.",
});

await fs.writeFile(bankPath, `${JSON.stringify(questions, null, 2)}\n`);

console.log(`Repaired ${questions.length} questions in ${bankPath}`);
