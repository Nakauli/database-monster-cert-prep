# Procedures and Triggers Cheatsheet

Procedure: explicitly called, parameters, multiple statements/result sets.
Function: returns a value/table; often usable in expressions.
Trigger: automatic response to INSERT/UPDATE/DELETE.

SQLite: triggers yes, stored procedures no.
MySQL: row triggers with `OLD`/`NEW`.
SQL Server: statement triggers using multi-row `inserted`/`deleted`.

Prefer constraints for simple integrity. Keep triggers short, set-based where required, documented, and tested.
