# 11 — Security, Administration, and Backups

## Authentication and authorization

**Authentication** proves identity. **Authorization** decides permitted actions. Use roles to group permissions and apply **least privilege**: grant only what is needed, for only as long as needed.

```sql
GRANT SELECT ON students TO reporting_role;
REVOKE UPDATE ON students FROM reporting_role;
```

SQL Server also supports `DENY`, which explicitly blocks a permission and can override grants. Exact syntax differs by DBMS.

## SQL injection

Never concatenate untrusted values into SQL.

```python
# Correct SQLite parameterization
cursor.execute(
    "SELECT * FROM students WHERE email = ?",
    (email,)
)
```

Parameters represent values, not table names or SQL keywords. Dynamic identifiers require allow-listing.

## Defense in depth

- strong authentication and secret handling,
- least-privilege accounts,
- encryption in transit and at rest,
- patching,
- validation plus DB constraints,
- auditing and monitoring,
- tested backups,
- restricted network access.

## Backup concepts

A backup is useful only if restoration works. Know:

- full, differential, and transaction-log/incremental concepts,
- recovery point objective (acceptable data loss),
- recovery time objective (acceptable downtime),
- off-site/offline copies,
- retention and encryption,
- periodic restore tests.

SQLite backup may be a safe file copy while no write is occurring, the backup API, or `.backup`. Copying a live changing file carelessly can be inconsistent.

## Integrity versus security

Integrity means data remains valid and consistent; security protects confidentiality, integrity, and availability against unauthorized action. Constraints help integrity but do not replace access control.

## Common traps

- Application hiding is not authorization.
- Hash passwords with a dedicated password-hashing algorithm; do not encrypt/store plaintext passwords.
- A successful backup job does not prove restorability.
- Do not grant administrator privileges to solve a narrow permission problem.
