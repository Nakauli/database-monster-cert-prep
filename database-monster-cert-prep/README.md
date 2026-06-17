# Database Monster Cert Prep

An original, local, exam-focused training system for Certiport-style database preparation. It contains no leaked questions or exam dumps. The goal is mastery under time pressure: learn the rule, type the SQL, expose the trap, and repair every mistake.

## What is included

- 12 topic notes covering concepts, design, SQL, joins, grouping, subqueries, DDL/DML, transactions, procedures, triggers, indexes, security, backup, and troubleshooting
- Emergency 48-hour, 7-day, and 14-day study plans
- A realistic SQLite school/job-fair database with 9 related tables
- 10 guided labs plus database setup SQL
- 360 original questions: 30 in each of 12 topic groups
- Multiple-choice, multi-select, true/false, SQL-output, and scenario questions
- A 50-minute CLI simulator with 35–45 random questions
- A Flask dashboard with one-question navigation, review map, and timer
- Diagnostic, three certification-style, and Final Boss exams
- Automatic scoring, explanations, weak-topic tracking, and a mistake notebook
- Automated tests

## Fast setup in VS Code

Open a terminal in this folder.

### Windows PowerShell

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

If PowerShell blocks activation, use the environment's Python directly:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### macOS/Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Python 3.10+ is recommended. SQLite is included with normal Python installations.

## Start here today

1. Run the diagnostic without notes:

   ```powershell
   python -m app.main exam-file diagnostic_exam
   ```

2. Open `data/progress.json` or run:

   ```powershell
   python -m app.main progress
   ```

3. Study the lowest-scoring topic's linked note.
4. Reset the practice database and complete that topic's lab.
5. Run a 10-question panic quiz.
6. Re-answer every item recorded in `data/mistake_notebook.json`.

Do not begin by rereading everything. Let the diagnostic tell you where the points are hiding.

## CLI exam simulator

Random full exam (randomly chooses 35–45 questions, 50 minutes):

```powershell
python -m app.main exam
```

Fixed-size reproducible exam:

```powershell
python -m app.main exam --count 40 --seed 42
```

Difficulty-focused exam:

```powershell
python -m app.main exam --count 35 --difficulty hard --difficulty "final boss"
```

Quick panic quiz:

```powershell
python -m app.main panic --count 10
```

Prebuilt exams:

```powershell
python -m app.main exam-file certiport_style_exam_01
python -m app.main exam-file certiport_style_exam_02
python -m app.main exam-file certiport_style_exam_03
python -m app.main exam-file final_boss_exam
```

During a CLI exam:

- Enter `A` for a single answer.
- Enter `A,C` for a multi-select answer.
- Use `n`, `p`, or `g 12` to navigate.
- Use `r` for the review map.
- Enter `submit` to finish.

The simulator saves aggregate weakness data to `data/progress.json` and missed questions to `data/mistake_notebook.json`.

## Web dashboard

```powershell
python web/app.py
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000). The dashboard shows attempts, saved mistakes, weak topics, predefined exams, a 50-minute countdown, one-question navigation, and full answer review.

## SQL labs

Recreate the original sample database at any time:

```powershell
python -m app.main reset-db
```

Run a lab and print its query results:

```powershell
python -m app.main run-lab lab_01_select_basics.sql
python -m app.main run-lab lab_03_joins.sql
python -m app.main run-lab lab_08_triggers_audit_log.sql
```

For scratch work, copy `data/sample_school_database.db` and modify the copy in VS Code with a SQLite extension or the `sqlite3` command-line client. Read each lab's objective and tasks before looking at its answer-key section.

`lab_09_stored_procedure_examples_mysql.sql` is reference syntax and intentionally does not run in SQLite. It also explains the matching SQL Server/T-SQL pattern.

## Reset progress

```powershell
python -m app.main reset-progress
```

This clears both `data/progress.json` and `data/mistake_notebook.json`. It does not reset the sample database; use `reset-db` for that.

## Rebuild generated assets

The generated files are already included. These commands are useful if you deliberately edit the generators:

```powershell
python tools/build_curriculum.py
python -m app.question_bank --build
python -m app.exam_engine
```

## How to review mistakes

For each wrong answer, write three short lines in the `reflection` field of the mistake notebook:

1. **Why my choice felt tempting**
2. **The rule that defeats the trap**
3. **A tiny example proving the rule**

Then solve one similar question without notes. A mistake is repaired only when you can explain why every distractor is wrong.

## Score target

Use **85% or higher on two different 50-minute exams** as the readiness target. Also require at least 80% in every topic represented in your progress report. This is a training target, not a claim about the certification provider's official passing score.

If you score:

- Below 70%: return to notes and labs; do not grind full exams.
- 70–79%: repair the lowest three topics, then use panic quizzes.
- 80–84%: pass range, but make it repeatable under time.
- 85%+: take another different timed exam.

## Emergency 48-hour plan

### First 24 hours

1. Diagnostic exam.
2. Notes 01–03 and key/normalization drills.
3. Labs 01–03: SELECT, filtering, joins.
4. Notes 04–06 and Lab 04: grouping.
5. Repair every diagnostic mistake.
6. Checkpoint: at least 80% on a mixed quiz.

### Final 24 hours

1. Notes 07–10 and Labs 05–09.
2. Notes 11–12 and the security lab.
3. One 50-minute certification-style exam.
4. Repair the weakest two topics.
5. Final Boss exam.
6. Stop heavy study, scan cheatsheets, and sleep normally.

If a checkpoint fails: review one worked example, solve three fresh examples, then run a focused 10-question quiz. Do not passively reread the same page.

The full schedule is in `study_plan/emergency_48_hour_plan.md`.

## Tests and quality checks

```powershell
python -m pytest -q
python -m app.question_bank
python -m app.main reset-db
```

The test suite validates scoring, exact multi-select handling, question-bank structure, configured exams, timing, weakness tracking, database creation, lab execution, and Flask page loading.

## Cross-database limitations

- SQLite is used for zero-friction local practice.
- SQLite has triggers but no server-side stored procedures.
- `LIMIT` is used by SQLite/MySQL; SQL Server commonly uses `TOP` or `OFFSET/FETCH`.
- `ALTER TABLE`, `TRUNCATE`, users/roles, procedural syntax, trigger models, and transaction details differ by product.
- SQL Server triggers use multi-row `inserted`/`deleted` tables; SQLite and MySQL commonly teach row-level `OLD`/`NEW`.
- The simulator reproduces topic coverage, pacing, and reasoning style, not the exact proprietary exam interface or questions.

## Project map

```text
app/          CLI, exam engine, scoring, question bank, tracking, lab runner
cheatsheets/  Fast final-review pages
data/         SQLite database, 360-question JSON, progress, mistake notebook
exams/        Diagnostic, three simulations, and Final Boss configurations
labs/         Setup and guided SQL practice
notes/        Full topic notes
study_plan/   48-hour, 7-day, and 14-day plans
tests/        Automated verification
web/          Flask dashboard, templates, CSS, and exam JavaScript
```

Your next action: run the diagnostic now, without notes. The score is not a judgment; it is targeting data.

