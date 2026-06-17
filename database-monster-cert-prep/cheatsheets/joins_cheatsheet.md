# Joins Cheatsheet

- INNER: matches only.
- LEFT: all left + matching right.
- RIGHT: all right + matching left.
- FULL: all from both.
- CROSS: every combination.
- SELF: same table with two aliases.

Outer-join trap: a right-table filter in `WHERE` removes NULL-extended rows. Put match-specific filtering in `ON`.

Unexpected duplicates: inspect cardinality, missing/incomplete `ON`, and parallel one-to-many paths before considering `DISTINCT`.
