# 10 — Stored Procedures, Functions, and Triggers

## Procedures and functions

A stored procedure is a named server-side program that may accept input/output parameters, run multiple statements, manage a business operation, and return result sets. A function normally returns a value/table and is usable inside expressions, subject to DBMS restrictions.

SQLite does not support server-side stored procedures. Put reusable operations in parameterized application functions or use views/triggers where appropriate.

### MySQL procedure

```sql
DELIMITER //
CREATE PROCEDURE GetStudentsByDepartment(IN p_department_id INT)
BEGIN
  SELECT student_id, full_name
  FROM students
  WHERE department_id = p_department_id;
END//
DELIMITER ;

CALL GetStudentsByDepartment(1);
```

### SQL Server procedure

```sql
CREATE PROCEDURE dbo.GetStudentsByDepartment
  @DepartmentId INT
AS
BEGIN
  SET NOCOUNT ON;
  SELECT student_id, full_name
  FROM dbo.students
  WHERE department_id = @DepartmentId;
END;

EXEC dbo.GetStudentsByDepartment @DepartmentId = 1;
```

## Triggers

A trigger runs automatically in response to events. Common uses: audit trails, derived-value enforcement, and rules that cannot be expressed with a constraint. Risks: hidden side effects, recursion, multi-row mistakes, performance cost, and difficult debugging.

SQLite uses `OLD.column` and `NEW.column` per row. MySQL uses similar row aliases. SQL Server triggers are statement-level and expose `inserted`/`deleted` tables, which may contain many rows.

### SQLite audit trigger

```sql
CREATE TRIGGER payments_after_update
AFTER UPDATE OF amount ON payments
FOR EACH ROW
BEGIN
  INSERT INTO audit_logs(table_name, record_id, action, old_value, new_value)
  VALUES ('payments', OLD.payment_id, 'UPDATE',
          CAST(OLD.amount AS TEXT), CAST(NEW.amount AS TEXT));
END;
```

## When to use—or avoid

Use a constraint for simple integrity first. Use a procedure for an explicit reusable operation. Use a trigger when every write path must automatically enforce/log an event. Avoid triggers for complex workflows that users need to see and control.

## Common traps

- A trigger is not called manually.
- SQL Server triggers must handle multiple affected rows.
- A procedure cannot be used exactly like a scalar function.
- Parameterized procedures help security, but dynamic SQL inside them can still be injectable.
