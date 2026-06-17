"""Original certification-style question bank generation and loading."""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
BANK_PATH = ROOT / "data" / "question_bank.json"

TOPICS = {
    "core": ("Core Concepts", "notes/01_core_database_concepts.md", "labs/lab_01_select_basics.sql"),
    "design": ("Database Design and ERD", "notes/02_database_design_and_erd.md", "labs/lab_06_ddl_constraints.sql"),
    "normalization": ("Normalization", "notes/03_normalization.md", "cheatsheets/normalization_cheatsheet.md"),
    "sql": ("SQL Fundamentals", "notes/04_sql_select_filter_sort.md", "labs/lab_02_filtering_sorting.sql"),
    "joins": ("Joins and Relationships", "notes/05_joins.md", "labs/lab_03_joins.sql"),
    "aggregation": ("Aggregation and Grouping", "notes/06_grouping_aggregation.md", "labs/lab_04_grouping.sql"),
    "advanced": ("Subqueries, Views, and Set Operations", "notes/07_subqueries_views.md", "labs/lab_05_subqueries.sql"),
    "ddl": ("DDL, Constraints, and Indexes", "notes/08_ddl_constraints_indexes.md", "labs/lab_06_ddl_constraints.sql"),
    "dml": ("DML and Transactions", "notes/09_dml_transactions.md", "labs/lab_07_dml_transactions.sql"),
    "programming": ("Procedures, Functions, and Triggers", "notes/10_stored_procedures_functions_triggers.md", "labs/lab_08_triggers_audit_log.sql"),
    "security": ("Security, Administration, and Backup", "notes/11_security_admin_backup.md", "labs/lab_10_security_permissions_concepts.md"),
    "troubleshooting": ("Troubleshooting", "notes/12_troubleshooting.md", "cheatsheets/common_errors_cheatsheet.md"),
}

TABLES = [
    ("students", "student_id", "email"),
    ("courses", "course_id", "course_code"),
    ("companies", "company_id", "company_name"),
    ("payments", "payment_id", "reference_number"),
    ("departments", "department_id", "department_name"),
    ("alumni", "alumni_id", "student_id"),
    ("employees", "employee_id", "work_email"),
    ("products", "product_id", "sku"),
    ("orders", "order_id", "order_number"),
    ("members", "member_id", "member_email"),
]
PARENTS = [
    ("departments", "students", "department_id"),
    ("customers", "orders", "customer_id"),
    ("companies", "applications", "company_id"),
    ("courses", "enrollments", "course_id"),
    ("projects", "tasks", "project_id"),
    ("authors", "books", "author_id"),
    ("teams", "players", "team_id"),
    ("categories", "products", "category_id"),
    ("branches", "employees", "branch_id"),
    ("events", "registrations", "event_id"),
]
NAMES = ["Maya", "Luis", "Ana", "Noel", "Bea", "Carlo", "Iris", "Paolo", "Sam", "Rina"]


def _difficulty(index: int, hard_bias: bool = False) -> str:
    if hard_bias and index in (7, 9):
        return "final boss"
    return ("easy", "medium", "medium", "hard", "easy", "hard", "medium", "final boss", "hard", "final boss")[index]


def _make(
    topic_key: str,
    difficulty: str,
    qtype: str,
    question: str,
    choices: list[str],
    correct: int | list[int],
    explanation: str,
    concept: str,
    wrong_reasons: dict[int, str] | None = None,
) -> dict[str, Any]:
    correct_indexes = [correct] if isinstance(correct, int) else correct
    answer_values = [choices[index] for index in correct_indexes]
    correct_answer: str | list[str] = answer_values[0] if len(answer_values) == 1 else answer_values
    default_reason = f"This does not satisfy the rule for {concept.lower()}."
    why_wrong = {
        choice: (wrong_reasons or {}).get(index, default_reason)
        for index, choice in enumerate(choices)
        if index not in correct_indexes
    }
    topic, note, lab = TOPICS[topic_key]
    return {
        "id": "",
        "topic": topic,
        "difficulty": difficulty,
        "type": qtype,
        "question": question,
        "choices": choices,
        "correct_answer": correct_answer,
        "explanation": explanation,
        "why_wrong_answers": why_wrong,
        "related_concept": concept,
        "recommended_review": [note, lab],
    }


def _core_questions() -> Iterable[dict[str, Any]]:
    for i, (table, pk, natural) in enumerate(TABLES):
        yield _make(
            "core", _difficulty(i), "scenario",
            f"The {table} table has {pk}, {natural}, and a description. {pk} is system-generated; "
            f"{natural} is required and unique. Which statement is most accurate?",
            [
                f"Only {pk} can ever be a candidate key.",
                f"Both {pk} and {natural} are candidate keys; {pk} may be the chosen surrogate primary key.",
                f"{natural} must be a foreign key.",
                "The table has no candidate key until an index is added.",
            ],
            1,
            f"Both unique minimal identifiers can be candidate keys. Choosing {pk} makes it a surrogate primary key; "
            f"{natural} remains an alternate candidate key.",
            "candidate and surrogate keys",
            {0: "A required unique natural identifier can also be a candidate key.", 2: "Uniqueness does not make a column a foreign key.", 3: "Keys are logical constraints; an index is an access structure."},
        )
    null_values = [None, 0, "", None, 25, None, 7, "", None, 10]
    for i, value in enumerate(null_values):
        shown = "NULL" if value is None else repr(value)
        answer = value is None
        yield _make(
            "core", _difficulty(i), "true_false",
            f"A row has `optional_value = {shown}`. The predicate `optional_value IS NULL` evaluates TRUE for this row.",
            ["True", "False"],
            0 if answer else 1,
            "`IS NULL` is true only for the NULL marker. Zero and empty text are values, not NULL.",
            "NULL semantics",
            {1 if answer else 0: "This confuses NULL with a stored value or uses the wrong truth result."},
        )
    for i, (parent, child, fk) in enumerate(PARENTS):
        yield _make(
            "core", _difficulty(i), "multiple_choice",
            f"One {parent[:-1]} may have many {child}, and each {child[:-1]} belongs to one {parent[:-1]}. "
            f"Where should `{fk}` normally be stored?",
            [f"In `{parent}` only", f"In `{child}` as a foreign key", "In both tables as primary keys", "In a comma-separated relationship column"],
            1,
            f"The foreign key belongs on the many/child side, so `{child}.{fk}` references `{parent}`.",
            "one-to-many relationships",
            {0: "The one side does not need one column per child.", 2: "A foreign key is not automatically the primary key on both sides.", 3: "Comma-separated relationships break relational design."},
        )


def _design_questions() -> Iterable[dict[str, Any]]:
    pairs = [
        ("students", "clubs", "club_memberships"),
        ("doctors", "patients", "appointments"),
        ("authors", "books", "author_books"),
        ("employees", "projects", "employee_projects"),
        ("products", "orders", "order_items"),
        ("speakers", "events", "event_speakers"),
        ("users", "roles", "user_roles"),
        ("courses", "prerequisites", "course_prerequisites"),
        ("actors", "films", "cast_members"),
        ("mentors", "learners", "mentor_assignments"),
    ]
    for i, (left, right, junction) in enumerate(pairs):
        yield _make(
            "design", _difficulty(i), "scenario",
            f"A {left[:-1]} can relate to many {right}, and a {right[:-1]} can relate to many {left}. "
            "Which design best represents this requirement?",
            [
                f"Add a comma-separated `{right}_list` column to `{left}`.",
                f"Create `{junction}` with foreign keys to both parent tables and enforce unique pairs.",
                f"Put one nullable foreign key in each parent table.",
                "Merge both entities into one wide table.",
            ],
            1,
            f"A many-to-many relationship is resolved by the junction table `{junction}`. Relationship-specific facts also belong there.",
            "junction tables",
            {0: "A list in one cell is not relational and is difficult to constrain.", 2: "Two single foreign keys do not represent arbitrary many-to-many membership.", 3: "The entities have separate subjects and lifecycles."},
        )
    for i, (parent, child, fk) in enumerate(PARENTS):
        optional = i % 2 == 0
        min_text = "zero or one" if optional else "exactly one"
        correct = 0 if optional else 1
        yield _make(
            "design", _difficulty(i), "multiple_choice",
            f"Business rule: each `{child}` row is related to {min_text} `{parent}` row through `{fk}`. "
            "Which child-column rule best models the minimum cardinality?",
            [f"`{fk}` may be NULL", f"`{fk}` must be NOT NULL", f"`{fk}` must be UNIQUE", f"`{fk}` must contain multiple IDs"],
            correct,
            "Optional participation permits a NULL foreign key; mandatory participation requires NOT NULL. "
            "Uniqueness controls maximum multiplicity, not minimum participation.",
            "cardinality and optionality",
            {2: "UNIQUE would restrict repeated parent references and may incorrectly create one-to-one behavior.", 3: "A foreign key cell stores one referenced value."},
        )
    for i, (table, pk, natural) in enumerate(TABLES):
        yield _make(
            "design", _difficulty(i, True), "multi_select",
            f"Select TWO strong design choices for `{table}` when `{pk}` is a surrogate key and `{natural}` is a meaningful identifier.",
            [
                f"Make `{pk}` the primary key.",
                f"Add a UNIQUE constraint to `{natural}` when the business rule guarantees uniqueness.",
                f"Store all related IDs in one text column.",
                "Duplicate descriptive facts into every referencing table.",
            ],
            [0, 1],
            "A stable surrogate PK plus a uniqueness rule for the natural identifier is a common strong design. "
            "Repeating lists and duplicated facts create anomalies.",
            "good table design",
        )


def _normalization_questions() -> Iterable[dict[str, Any]]:
    repeating = [
        ("customer", "phone1, phone2, phone3", "customer_phones"),
        ("student", "course1, course2, course3", "enrollments"),
        ("order", "item1, item2, item3", "order_items"),
        ("employee", "skill1, skill2, skill3", "employee_skills"),
        ("event", "speaker1, speaker2, speaker3", "event_speakers"),
        ("company", "office1, office2, office3", "company_offices"),
        ("patient", "allergies as comma-separated text", "patient_allergies"),
        ("recipe", "ingredients as semicolon-separated text", "recipe_ingredients"),
        ("project", "member_ids in one JSON/text field", "project_members"),
        ("course", "prereq1, prereq2, prereq3", "course_prerequisites"),
    ]
    for i, (entity, columns, fix) in enumerate(repeating):
        yield _make(
            "normalization", _difficulty(i), "scenario",
            f"A `{entity}` table stores `{columns}`. What is the first normalization concern and best repair?",
            [
                f"1NF/repeating values; create `{fix}` with one related value per row.",
                "2NF; add another calculated column.",
                "3NF; copy the values to every related table.",
                "No issue because the DBMS accepts text and numbered columns.",
            ],
            0,
            "Repeating groups or multi-valued cells violate the relational 1NF design goal. Move repeated values to rows in a related table.",
            "first normal form",
        )
    dependencies = [
        ("student_id, course_id", "student_name", "student_id", "2NF partial dependency"),
        ("order_id, product_id", "product_name", "product_id", "2NF partial dependency"),
        ("employee_id", "department_name", "department_id", "3NF transitive dependency"),
        ("book_id", "publisher_city", "publisher_id", "3NF transitive dependency"),
        ("patient_id, doctor_id", "doctor_specialty", "doctor_id", "2NF partial dependency"),
        ("invoice_id, item_id", "invoice_date", "invoice_id", "2NF partial dependency"),
        ("student_id", "department_office", "department_id", "3NF transitive dependency"),
        ("asset_id", "category_description", "category_id", "3NF transitive dependency"),
        ("shipment_id, product_id", "shipment_date", "shipment_id", "2NF partial dependency"),
        ("member_id", "branch_phone", "branch_id", "3NF transitive dependency"),
    ]
    for i, (key, attribute, determinant, violation) in enumerate(dependencies):
        yield _make(
            "normalization", _difficulty(i, True), "multiple_choice",
            f"A relation has candidate key `({key})`. The attribute `{attribute}` depends on `{determinant}`. "
            "Which diagnosis is most accurate?",
            [violation, "1NF atomicity violation only", "BCNF is satisfied because every table has a key", "Denormalization is mandatory"],
            0,
            f"`{attribute}` depends on `{determinant}`, so the stated {violation.lower()} should be removed by storing the fact with its determinant.",
            violation,
        )
    anomalies = [
        ("department name", "employees"),
        ("course title", "enrollments"),
        ("supplier address", "products"),
        ("company industry", "applications"),
        ("branch phone", "members"),
        ("teacher office", "class registrations"),
        ("category label", "inventory"),
        ("customer city", "orders"),
        ("publisher name", "books"),
        ("project title", "time entries"),
    ]
    for i, (fact, rows) in enumerate(anomalies):
        yield _make(
            "normalization", _difficulty(i), "scenario",
            f"The same {fact} is copied into many `{rows}` rows. Changing it requires many updates, and one row is missed. "
            "What problem occurred?",
            ["Update anomaly", "Insertion anomaly", "Deletion anomaly", "A primary-key collision"],
            0,
            "A fact stored redundantly must be updated in several places; inconsistent copies are an update anomaly.",
            "normalization anomalies",
            {1: "Insertion anomalies prevent adding one fact without an unrelated fact.", 2: "Deletion anomalies accidentally remove a fact when deleting another.", 3: "No duplicate identifier is described."},
        )


def _sql_questions() -> Iterable[dict[str, Any]]:
    patterns = [
        ("'Ma%'", "begins with `Ma`"),
        ("'%son'", "ends with `son`"),
        ("'%data%'", "contains `data`"),
        ("'_ean'", "has any one character followed by `ean`"),
        ("'A__'", "is three characters and begins with `A`"),
        ("'%2026'", "ends with `2026`"),
        ("'DB_%'", "begins with `DB`, then at least one character"),
        ("'%@example.com'", "ends with `@example.com`"),
        ("'P_Y%'", "starts with P, any one character, then Y"),
        ("'____'", "has exactly four characters"),
    ]
    for i, (pattern, meaning) in enumerate(patterns):
        yield _make(
            "sql", _difficulty(i), "multiple_choice",
            f"What does `WHERE value LIKE {pattern}` request under ordinary SQL wildcard rules?",
            [meaning, "Only a literal match including percent/underscore characters", "All NULL values", "Values outside the pattern"],
            0,
            "`%` matches any sequence and `_` matches one character. The surrounding literals determine position.",
            "LIKE wildcards",
        )
    ranges = [(10, 20, 10), (10, 20, 20), (50, 80, 49), (1, 5, 3), (100, 200, 250), (0, 0, 0), (-5, 5, -5), (75, 100, 74), (2020, 2026, 2026), (3, 7, 8)]
    for i, (low, high, value) in enumerate(ranges):
        included = low <= value <= high
        yield _make(
            "sql", _difficulty(i), "true_false",
            f"For a non-NULL numeric value {value}, `value BETWEEN {low} AND {high}` evaluates TRUE.",
            ["True", "False"],
            0 if included else 1,
            "`BETWEEN` includes both endpoints and is equivalent to `value >= low AND value <= high` for ordinary non-NULL values.",
            "BETWEEN and filtering",
        )
    for i, (table, pk, natural) in enumerate(TABLES):
        limit = (i % 5) + 1
        yield _make(
            "sql", _difficulty(i, True), "scenario",
            f"In SQLite, which query reliably returns the {limit} `{table}` rows with the largest `{pk}` values?",
            [
                f"SELECT * FROM {table} LIMIT {limit} ORDER BY {pk} DESC;",
                f"SELECT * FROM {table} ORDER BY {pk} DESC LIMIT {limit};",
                f"SELECT TOP {limit} * FROM {table} ORDER BY {pk};",
                f"SELECT DISTINCT {limit} FROM {table};",
            ],
            1,
            "SQLite places `ORDER BY` before `LIMIT`. Sorting is required to define which rows are the largest.",
            "sorting and limiting",
            {0: "Clause order is invalid.", 2: "TOP is SQL Server syntax, and ascending order would select the smallest values.", 3: "DISTINCT does not implement row limiting."},
        )


def _join_questions() -> Iterable[dict[str, Any]]:
    for i, (parent, child, fk) in enumerate(PARENTS):
        need_unmatched = i % 2 == 0
        correct = 1 if need_unmatched else 0
        requirement = f"all `{parent}` rows, even those with no `{child}`" if need_unmatched else f"only `{parent}` rows that have matching `{child}`"
        yield _make(
            "joins", _difficulty(i), "multiple_choice",
            f"A report requires {requirement}. `{parent}` is written first in FROM. Which join should be used?",
            ["INNER JOIN", "LEFT JOIN", "CROSS JOIN", "SELF JOIN"],
            correct,
            "INNER JOIN keeps matches only. LEFT JOIN preserves every row from the left table and fills unmatched right columns with NULL.",
            "choosing a join",
        )
    counts = [(2, 3), (4, 5), (1, 9), (6, 2), (3, 3), (8, 4), (5, 7), (10, 2), (7, 6), (9, 9)]
    for i, (left, right) in enumerate(counts):
        product = left * right
        choices = [str(product), str(left + right), str(max(left, right)), str(abs(left - right))]
        # Preserve unique choices for edge cases.
        if len(set(choices)) < 4:
            choices = [str(product), str(product + 1), str(product - 1), str(left + right + 2)]
        yield _make(
            "joins", _difficulty(i), "sql_output",
            f"Table A has {left} rows and table B has {right} rows. How many rows does `A CROSS JOIN B` return?",
            choices,
            0,
            f"A cross join returns every pair: {left} × {right} = {product}.",
            "cross join row counts",
        )
    for i, (parent, child, fk) in enumerate(PARENTS):
        status = ("active", "pending", "paid", "open", "current")[i % 5]
        yield _make(
            "joins", _difficulty(i, True), "scenario",
            f"The query uses `{parent} p LEFT JOIN {child} c ON c.{fk}=p.{fk}` but then adds "
            f"`WHERE c.status='{status}'`. Required `{parent}` rows with no child disappear. Best repair?",
            [
                f"Move `c.status='{status}'` into the ON clause.",
                "Replace LEFT JOIN with CROSS JOIN.",
                "Add DISTINCT and keep the WHERE clause.",
                "Remove the key comparison from ON.",
            ],
            0,
            "A WHERE predicate on the nullable right side rejects NULL-extended rows. Put match qualification in ON to preserve unmatched left rows.",
            "outer join filtering",
        )


def _aggregation_questions() -> Iterable[dict[str, Any]]:
    sets = [
        [10, None, 20], [None, None, 5], [1, 2, 3, None], [7, 7, None], [0, None, 0],
        [100, 50, 25], [None, 8], [4, None, 6, None], [9], [3, 3, 3, None],
    ]
    for i, values in enumerate(sets):
        count_star = len(values)
        count_col = sum(value is not None for value in values)
        yield _make(
            "aggregation", _difficulty(i), "sql_output",
            f"A group contains `{values}` in column `amount`. What are `COUNT(*)` and `COUNT(amount)`?",
            [
                f"{count_star} and {count_col}",
                f"{count_col} and {count_star}",
                f"{count_star} and {count_star}",
                "Both return NULL because the group contains NULL.",
            ],
            0,
            f"`COUNT(*)` counts all {count_star} rows; `COUNT(amount)` counts the {count_col} non-NULL values.",
            "aggregate functions and NULL",
        )
    for i, (parent, child, fk) in enumerate(PARENTS):
        threshold = (i % 4) + 2
        yield _make(
            "aggregation", _difficulty(i), "multiple_choice",
            f"Which clause filters grouped `{parent}` results to only groups with at least {threshold} matching `{child}` rows?",
            [
                f"WHERE COUNT(*) >= {threshold}",
                f"HAVING COUNT(*) >= {threshold}",
                f"ORDER BY COUNT(*) >= {threshold}",
                f"GROUP BY COUNT(*) >= {threshold}",
            ],
            1,
            "HAVING filters after groups and aggregate values have been formed. WHERE filters source rows before grouping.",
            "HAVING versus WHERE",
        )
    for i, (table, pk, natural) in enumerate(TABLES):
        yield _make(
            "aggregation", _difficulty(i, True), "scenario",
            f"A query groups `{table}` rows by `category_id` but also selects `{natural}` without aggregating or grouping it. "
            "Why is this unsafe or invalid in strict SQL?",
            [
                f"A group can contain several `{natural}` values, so no single value is defined.",
                "GROUP BY requires every column in the table to be indexed.",
                "Aggregate queries cannot select text.",
                "The primary key must always be removed before grouping.",
            ],
            0,
            "A selected nonaggregate expression must be grouped or functionally determined by the grouping key; otherwise one group has no defined single value.",
            "grouping correctness",
        )


def _advanced_questions() -> Iterable[dict[str, Any]]:
    for i, (table, pk, natural) in enumerate(TABLES):
        multi = i % 2 == 0
        operator = "IN" if multi else "="
        wording = "several rows" if multi else "exactly one value"
        yield _make(
            "advanced", _difficulty(i), "multiple_choice",
            f"A subquery used to compare `{table}.{pk}` is expected to return {wording}. Which operator is the safer intended choice?",
            ["IN", "=", "UNION ALL", "ORDER BY"],
            0 if operator == "IN" else 1,
            "`IN` compares with a set of values; `=` expects a scalar value. Match the operator to the subquery's cardinality.",
            "scalar and multi-row subqueries",
        )
    scenarios = [
        ("students", "enrollments"), ("customers", "orders"), ("companies", "applications"),
        ("courses", "registrations"), ("projects", "tasks"), ("authors", "books"),
        ("teams", "players"), ("categories", "products"), ("branches", "employees"), ("events", "tickets"),
    ]
    for i, (outer, inner) in enumerate(scenarios):
        yield _make(
            "advanced", _difficulty(i, True), "scenario",
            f"Find `{outer}` with no matching `{inner}`. The inner foreign-key column may contain NULL. Which pattern is most robust?",
            [
                f"WHERE NOT EXISTS (SELECT 1 FROM {inner} i WHERE i.owner_id = o.id)",
                f"WHERE o.id NOT IN (SELECT owner_id FROM {inner})",
                f"WHERE o.id = NULL",
                f"UNION ALL SELECT * FROM {inner}",
            ],
            0,
            "`NOT EXISTS` tests each outer row for an absent match and avoids the UNKNOWN result that NULL can introduce into `NOT IN`.",
            "NOT EXISTS and NULL",
        )
    for i, (table, pk, natural) in enumerate(TABLES):
        keep_duplicates = i % 2 == 0
        correct = 1 if keep_duplicates else 0
        requirement = "retain duplicate rows" if keep_duplicates else "remove duplicate result rows"
        yield _make(
            "advanced", _difficulty(i), "multiple_choice",
            f"Two compatible SELECT results must be stacked vertically and {requirement}. Which operator fits?",
            ["UNION", "UNION ALL", "INNER JOIN", "CROSS JOIN"],
            correct,
            "`UNION` removes duplicates; `UNION ALL` preserves them and avoids duplicate-elimination work.",
            "set operations",
        )


def _ddl_questions() -> Iterable[dict[str, Any]]:
    constraints = [
        ("email must be present", "NOT NULL"),
        ("course code cannot repeat", "UNIQUE"),
        ("grade must be 0 through 100", "CHECK"),
        ("new rows should start as active when omitted", "DEFAULT"),
        ("child must reference an existing parent", "FOREIGN KEY"),
        ("each row needs its chosen identifier", "PRIMARY KEY"),
        ("quantity cannot be negative", "CHECK"),
        ("reference number cannot repeat", "UNIQUE"),
        ("department is mandatory", "NOT NULL"),
        ("created_at should receive current time when omitted", "DEFAULT"),
    ]
    options = ["NOT NULL", "UNIQUE", "CHECK", "DEFAULT", "FOREIGN KEY", "PRIMARY KEY"]
    for i, (rule, answer) in enumerate(constraints):
        rotated = options[i % len(options):] + options[:i % len(options)]
        choices = [answer] + [item for item in rotated if item != answer][:3]
        yield _make(
            "ddl", _difficulty(i), "multiple_choice",
            f"Which constraint most directly enforces this rule: {rule}?",
            choices,
            0,
            f"`{answer}` is the constraint designed most directly for this requirement.",
            "constraints",
        )
    index_cases = [
        ("frequent equality lookup on a selective email", True),
        ("a tiny lookup table read in full", False),
        ("frequent join on an unindexed foreign key", True),
        ("a low-selectivity status column updated constantly", False),
        ("frequent range search by paid_on", True),
        ("a column never used in filters, joins, or sorting", False),
        ("a composite filter starting with department_id", True),
        ("adding every possible index to a write-heavy table", False),
        ("frequent lookup by unique reference number", True),
        ("a report returning nearly every row", False),
    ]
    for i, (case, helpful) in enumerate(index_cases):
        yield _make(
            "ddl", _difficulty(i), "true_false",
            f"Adding a carefully chosen index is likely to provide a net benefit for {case}.",
            ["True", "False"],
            0 if helpful else 1,
            "Indexes help selective access and joins but consume space and add work to INSERT/UPDATE/DELETE. Measure against workload.",
            "index tradeoffs",
        )
    for i, (table, pk, natural) in enumerate(TABLES):
        yield _make(
            "ddl", _difficulty(i, True), "scenario",
            f"You must remove all rows from `{table}` but preserve its definition. Which statement is universally safest among these for SQLite?",
            [f"DELETE FROM {table};", f"DROP TABLE {table};", f"TRUNCATE TABLE {table};", f"ALTER TABLE {table} DELETE ALL;"],
            0,
            "SQLite supports DELETE without WHERE to remove all rows. DROP removes the object; SQLite has no TRUNCATE statement.",
            "DROP versus DELETE versus TRUNCATE",
        )


def _dml_questions() -> Iterable[dict[str, Any]]:
    for i, (table, pk, natural) in enumerate(TABLES):
        value = i + 1
        yield _make(
            "dml", _difficulty(i), "scenario",
            f"Before running `UPDATE {table} SET status='inactive' WHERE {pk}={value}`, what is the best safety check?",
            [
                f"Run `SELECT * FROM {table} WHERE {pk}={value}` and verify the target row, preferably inside a transaction.",
                "Remove the WHERE clause so the command is simpler.",
                "Create a cross join to make sure the row exists.",
                "Commit before running the UPDATE.",
            ],
            0,
            "Preview the exact predicate and use a transaction when appropriate. This catches targeting mistakes before data changes become permanent.",
            "safe UPDATE and DELETE",
        )
    transaction_events = [
        ("UPDATE succeeds, then ROLLBACK", "the update is undone"),
        ("UPDATE succeeds, then COMMIT", "the update becomes durable"),
        ("two inserts, second fails, application ROLLBACK", "both uncommitted inserts are undone"),
        ("SAVEPOINT s, update, ROLLBACK TO s", "changes after the savepoint are undone"),
        ("COMMIT, then ROLLBACK", "the committed work is not undone"),
        ("BEGIN, delete, connection closes without commit in ordinary handling", "uncommitted work should not be treated as durable"),
        ("INSERT parent and child in one transaction, then COMMIT", "both changes become one committed unit"),
        ("UPDATE all rows without WHERE, then ROLLBACK before commit", "the accidental uncommitted change can be undone"),
        ("RELEASE a savepoint and later COMMIT outer transaction", "the transaction becomes durable at commit"),
        ("constraint failure inside a multi-step operation followed by ROLLBACK", "the operation can return to its prior state"),
    ]
    for i, (event, result) in enumerate(transaction_events):
        yield _make(
            "dml", _difficulty(i, True), "multiple_choice",
            f"Transaction scenario: {event}. What is the expected principle?",
            [result, "ROLLBACK always commits the change", "COMMIT is only a query preview", "Transactions affect table definitions only"],
            0,
            f"The key transaction principle is that {result}. Exact error-continuation behavior can vary, but COMMIT makes work durable and ROLLBACK reverses uncommitted work.",
            "transactions and savepoints",
        )
    for i, (parent, child, fk) in enumerate(PARENTS):
        cascade = i % 2 == 0
        action = "ON DELETE CASCADE" if cascade else "the default restrictive behavior"
        result = "matching child rows are deleted automatically" if cascade else "the parent delete is rejected while children reference it"
        yield _make(
            "dml", _difficulty(i), "scenario",
            f"`{child}.{fk}` references `{parent}` using {action}. A referenced parent is deleted. What should happen?",
            [result, "the foreign key silently becomes any random value", "all unrelated tables are dropped", "the primary key is converted to text"],
            0,
            f"With {action}, {result}. Referential actions must be chosen from the business meaning.",
            "referential actions",
        )


def _programming_questions() -> Iterable[dict[str, Any]]:
    platforms = [
        ("SQLite", "stored procedures are not supported; use application functions for explicit reusable operations"),
        ("MySQL", "a procedure can be invoked with CALL"),
        ("SQL Server", "a procedure can be invoked with EXEC/EXECUTE"),
        ("SQLite", "row triggers can reference OLD and NEW"),
        ("MySQL", "row triggers can reference OLD and NEW"),
        ("SQL Server", "DML triggers should process the inserted/deleted sets"),
        ("SQLite", "CREATE TRIGGER is supported"),
        ("MySQL", "DELIMITER is a client aid often used while defining multi-statement routines"),
        ("SQL Server", "SET NOCOUNT ON can suppress row-count messages in a procedure"),
        ("SQLite", "views and triggers do not create a full stored-procedure language"),
    ]
    for i, (platform, truth) in enumerate(platforms):
        yield _make(
            "programming", _difficulty(i), "multiple_choice",
            f"Which statement about {platform} is accurate in the context of procedures/triggers?",
            [
                truth,
                "Every trigger must be called manually by the application.",
                "A procedure and a scalar function are always interchangeable.",
                "Triggers cannot cause performance or debugging problems.",
            ],
            0,
            f"For {platform}, {truth}. Syntax and execution models differ across database products.",
            "cross-platform database programming",
        )
    for i, (table, pk, natural) in enumerate(TABLES):
        event = ("INSERT", "UPDATE", "DELETE")[i % 3]
        available = {
            "INSERT": "NEW values are available; there is no OLD row",
            "UPDATE": "both OLD and NEW values are available",
            "DELETE": "OLD values are available; there is no NEW row",
        }[event]
        yield _make(
            "programming", _difficulty(i, True), "scenario",
            f"In a SQLite row trigger for `{event}` on `{table}`, which transition-row statement is correct?",
            [available, "Only an inserted table containing every affected row is available", "OLD and NEW are table names that must be created first", "No row values can be referenced"],
            0,
            f"For a SQLite {event} row trigger, {available}. SQL Server instead provides inserted/deleted sets at statement level.",
            "trigger OLD and NEW values",
        )
    for i, (table, pk, natural) in enumerate(TABLES):
        requirement = ("automatically log every change", "explicitly run a multi-step registration", "calculate and return one reusable value")[i % 3]
        answer = ("Trigger", "Stored procedure", "Function")[i % 3]
        yield _make(
            "programming", _difficulty(i), "multiple_choice",
            f"Choose the best database-programming object to {requirement}.",
            [answer, "Index", "Foreign key", "Backup"],
            0,
            f"A {answer.lower()} most directly fits this behavior. Constraints and indexes solve different integrity/performance problems.",
            "procedures versus functions versus triggers",
        )


def _security_questions() -> Iterable[dict[str, Any]]:
    roles = [
        ("report viewer", "SELECT on a restricted reporting view"),
        ("payment entry clerk", "INSERT on payments plus only required lookups"),
        ("schema migration service", "temporary DDL rights during deployment"),
        ("student portal", "execute/read access limited to its own data path"),
        ("backup operator", "backup rights without unrelated data-change rights"),
        ("auditor", "read-only access to audit records"),
        ("job-fair kiosk", "insert registration and read public company fields"),
        ("analytics service", "read access to de-identified views"),
        ("support agent", "narrow update rights for approved support fields"),
        ("application runtime", "only permissions required by normal runtime operations"),
    ]
    for i, (role, permission) in enumerate(roles):
        yield _make(
            "security", _difficulty(i), "scenario",
            f"Under least privilege, what is the best starting permission set for a {role}?",
            [permission, "Full database administrator rights", "Ownership of every schema", "Permission to disable all constraints"],
            0,
            "Least privilege grants only the operations and data needed for the role, reducing accidental and malicious damage.",
            "least privilege and roles",
        )
    for i, (table, pk, natural) in enumerate(TABLES):
        marker = "?" if i % 2 == 0 else ":value"
        yield _make(
            "security", _difficulty(i, True), "multiple_choice",
            f"Which Python/SQL approach safely supplies an untrusted value when querying `{table}.{natural}`?",
            [
                f"Execute `SELECT * FROM {table} WHERE {natural} = {marker}` and pass the value separately through the driver.",
                f"Concatenate the value between quotes in the SQL string.",
                "Remove quotes and trust client-side validation.",
                "Give the application administrator rights so the query cannot fail.",
            ],
            0,
            "Driver parameterization keeps data separate from SQL syntax. Validation is useful but does not replace parameterization.",
            "SQL injection prevention",
        )
    admin_cases = [
        ("A user proves identity with a password or key", "Authentication"),
        ("A role is allowed to SELECT but not UPDATE", "Authorization"),
        ("A restore test measures how quickly service returns", "Recovery time objective"),
        ("The maximum acceptable amount of lost data is defined", "Recovery point objective"),
        ("A backup file is encrypted and stored off-site", "Backup defense in depth"),
        ("Password values are processed with Argon2/bcrypt/scrypt", "Password hashing"),
        ("A successful backup log is followed by an actual restore", "Restore verification"),
        ("Traffic to the database uses TLS", "Encryption in transit"),
        ("Old accounts are removed promptly", "Account lifecycle control"),
        ("Changes to sensitive records are recorded", "Auditing"),
    ]
    for i, (scenario, answer) in enumerate(admin_cases):
        yield _make(
            "security", _difficulty(i), "multiple_choice",
            f"Which concept best matches this scenario: {scenario}?",
            [answer, "Cross join", "Denormalization", "Surrogate key"],
            0,
            f"The scenario describes {answer.lower()}, a security/administration concept rather than query structure.",
            "security and backup concepts",
        )


def _troubleshooting_questions() -> Iterable[dict[str, Any]]:
    errors = [
        ("UNIQUE constraint failed: students.email", "A duplicate email violates a UNIQUE rule"),
        ("FOREIGN KEY constraint failed on an enrollment insert", "The referenced student/course may not exist"),
        ("NOT NULL constraint failed: courses.course_title", "A required title was omitted or NULL"),
        ("CHECK constraint failed: grade BETWEEN 0 AND 100", "The grade is outside the allowed domain"),
        ("near 'FORM': syntax error", "FROM may be misspelled or clause syntax is broken"),
        ("no such column: student_name", "The column name/alias does not exist in scope"),
        ("ambiguous column name: id", "Qualify the column with a table alias"),
        ("sub-select returns more than 1 row", "A scalar comparison received a multi-row result"),
        ("database is locked", "Another connection/transaction may hold a conflicting lock"),
        ("datatype mismatch", "A supplied value is incompatible with the required type/context"),
    ]
    for i, (message, diagnosis) in enumerate(errors):
        yield _make(
            "troubleshooting", _difficulty(i), "scenario",
            f"Error: `{message}`. What is the best first diagnosis?",
            [diagnosis, "Add DISTINCT to every query", "Disable all integrity constraints", "Convert the query to a cross join"],
            0,
            f"The error points directly to this class of problem: {diagnosis}. Inspect the named object and smallest failing statement.",
            "SQL error diagnosis",
        )
    wrong_results = [
        ("A LEFT JOIN loses unmatched left rows", "A right-table condition was placed in WHERE"),
        ("A join returns far more rows than expected", "The ON condition is missing/incomplete or cardinality is one-to-many"),
        ("`column = NULL` returns no matches", "NULL must be tested with IS NULL"),
        ("An aggregate query has too many tiny groups", "GROUP BY includes unnecessary columns"),
        ("A report omits empty categories", "An inner join/counting strategy removed categories with no children"),
        ("`NOT IN` unexpectedly returns no rows", "The subquery may contain NULL"),
        ("LIMIT returns different rows between runs", "There is no ORDER BY defining the subset"),
        ("AVG seems based on fewer rows", "AVG ignores NULL values"),
        ("An UPDATE changes every record", "The WHERE clause was omitted or always true"),
        ("Duplicate-looking names appear after a join", "Multiple legitimate child rows exist for each parent"),
    ]
    for i, (symptom, cause) in enumerate(wrong_results):
        yield _make(
            "troubleshooting", _difficulty(i, True), "multiple_choice",
            f"Symptom: {symptom}. What is the most likely cause?",
            [cause, "The database needs a new primary key on every selected column", "COMMIT automatically duplicated the rows", "ORDER BY changed stored data"],
            0,
            f"The symptom is commonly explained by this cause: {cause}. Verify with intermediate row counts and a reduced query.",
            "wrong-result debugging",
        )
    for i, (table, pk, natural) in enumerate(TABLES):
        yield _make(
            "troubleshooting", _difficulty(i), "multi_select",
            f"A complex query on `{table}` returns the wrong number of rows. Select TWO useful first debugging actions.",
            [
                "Run each base query and add joins one at a time while checking key columns and row counts.",
                "Inspect the schema, constraints, and a small sample of the actual data.",
                "Immediately add DISTINCT without finding the source.",
                "Disable foreign keys and rerun all updates.",
            ],
            [0, 1],
            "Reduce the query, inspect schema/data, and check cardinality at each step. Do not mask the issue or weaken integrity.",
            "systematic SQL debugging",
        )


GENERATORS = [
    _core_questions,
    _design_questions,
    _normalization_questions,
    _sql_questions,
    _join_questions,
    _aggregation_questions,
    _advanced_questions,
    _ddl_questions,
    _dml_questions,
    _programming_questions,
    _security_questions,
    _troubleshooting_questions,
]


def generate_question_bank() -> list[dict[str, Any]]:
    questions: list[dict[str, Any]] = []
    for generator in GENERATORS:
        questions.extend(generator())
    for number, question in enumerate(questions, start=1):
        question["id"] = f"Q{number:04d}"
    validate_question_bank(questions)
    return questions


def validate_question_bank(questions: list[dict[str, Any]]) -> None:
    required = {
        "id", "topic", "difficulty", "type", "question", "choices",
        "correct_answer", "explanation", "why_wrong_answers",
        "related_concept", "recommended_review",
    }
    ids: set[str] = set()
    for index, question in enumerate(questions, start=1):
        missing = required - question.keys()
        if missing:
            raise ValueError(f"Question {index} is missing fields: {sorted(missing)}")
        if question["id"] in ids:
            raise ValueError(f"Duplicate question ID: {question['id']}")
        ids.add(question["id"])
        choices = question["choices"]
        answers = question["correct_answer"]
        answer_list = answers if isinstance(answers, list) else [answers]
        if not choices or any(answer not in choices for answer in answer_list):
            raise ValueError(f"Invalid correct answer for {question['id']}")
        if not question["explanation"].strip():
            raise ValueError(f"Missing explanation for {question['id']}")


def save_question_bank(path: Path = BANK_PATH) -> list[dict[str, Any]]:
    questions = generate_question_bank()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(questions, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return questions


def load_question_bank(path: Path = BANK_PATH) -> list[dict[str, Any]]:
    if not path.exists():
        return save_question_bank(path)
    questions = json.loads(path.read_text(encoding="utf-8"))
    validate_question_bank(questions)
    return questions


def select_questions(
    count: int,
    difficulties: list[str] | None = None,
    topics: list[str] | None = None,
    seed: int | None = None,
) -> list[dict[str, Any]]:
    questions = load_question_bank()
    if difficulties:
        questions = [q for q in questions if q["difficulty"] in difficulties]
    if topics:
        questions = [q for q in questions if q["topic"] in topics]
    if count > len(questions):
        raise ValueError(f"Requested {count} questions but only {len(questions)} match.")
    rng = random.Random(seed)
    return rng.sample(questions, count)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build or validate the original question bank.")
    parser.add_argument("--build", action="store_true", help="Regenerate data/question_bank.json")
    args = parser.parse_args()
    questions = save_question_bank() if args.build else load_question_bank()
    counts: dict[str, int] = {}
    for question in questions:
        counts[question["topic"]] = counts.get(question["topic"], 0) + 1
    print(f"Question bank valid: {len(questions)} questions")
    for topic, count in sorted(counts.items()):
        print(f"  {topic}: {count}")


if __name__ == "__main__":
    main()
