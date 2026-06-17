# Normalization Cheatsheet

- 1NF: atomic cells; no repeating groups.
- 2NF: 1NF + no non-key fact depends on part of a composite key.
- 3NF: 2NF + no non-key fact depends on another non-key fact.
- BCNF: every determinant is a superkey.

Method: identify key → list dependencies → split repeating groups → remove partial dependencies → remove transitive dependencies.
