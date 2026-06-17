# Common Errors Cheatsheet

- `= NULL` → `IS NULL`
- Aggregate in `WHERE` → use `HAVING`
- Lost left rows → move right-table condition from `WHERE` to `ON`
- Duplicate key → inspect PK/UNIQUE value
- FK failure → verify parent exists / children before parent delete
- Too many joined rows → inspect one-to-many relationships and `ON`
- Unsafe change → preview `WHERE` with `SELECT`, then transact
- `NOT IN` with NULL → use `NOT EXISTS`
- Injection risk → parameterize values
