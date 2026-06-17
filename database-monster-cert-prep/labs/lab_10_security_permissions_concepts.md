# Lab 10 — Security and Permissions

## Objective

Choose least-privilege access and replace injectable code with parameterized access.

## Scenario

The reporting application only reads student names, departments, and enrollment counts. It currently connects as a database administrator.

## Tasks

1. Define the minimum operations required.
2. Explain why a reporting role is safer than a personal administrator account.
3. Repair: `sql = "SELECT * FROM students WHERE email = '" + email + "'"`.
4. Decide whether the app should read birth dates and payment details.
5. Design a backup verification checklist.

## Answer key

- Grant `SELECT` only on a restricted view containing required columns; no DDL or writes.
- Use a dedicated service identity assigned to a reporting role.
- SQLite/Python: `cursor.execute("SELECT * FROM students WHERE email = ?", (email,))`.
- Exclude unrelated personal/financial data.
- Encrypt backups, restrict access, record retention, restore into an isolated environment, validate row/object counts, and document RPO/RTO results.

## Common mistakes

Escaping strings by hand, granting broad rights "temporarily," treating a hidden UI field as access control, and never testing restore.

## Challenge

Explain why a stored procedure can reduce exposed operations but does not make unsafe dynamic SQL inside it secure.
