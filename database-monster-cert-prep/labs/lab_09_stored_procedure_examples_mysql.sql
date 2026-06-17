-- LAB 09: MYSQL PROCEDURE AND TRIGGER EXAMPLES
-- Do not run this file in SQLite.

DELIMITER //
CREATE PROCEDURE RegisterForJobFair(
  IN p_student_id INT,
  IN p_company_id INT
)
BEGIN
  INSERT INTO job_fair_registrations(student_id, company_id)
  VALUES (p_student_id, p_company_id);
END//

CREATE TRIGGER payments_after_update
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
  IF OLD.amount <> NEW.amount THEN
    INSERT INTO audit_logs(table_name, record_id, action, old_value, new_value)
    VALUES ('payments', OLD.payment_id, 'UPDATE_AMOUNT',
            CAST(OLD.amount AS CHAR), CAST(NEW.amount AS CHAR));
  END IF;
END//
DELIMITER ;

CALL RegisterForJobFair(5, 2);

-- SQL Server / T-SQL equivalent procedure:
-- CREATE PROCEDURE dbo.RegisterForJobFair @StudentId INT, @CompanyId INT AS
-- BEGIN
--   SET NOCOUNT ON;
--   INSERT dbo.job_fair_registrations(student_id, company_id)
--   VALUES (@StudentId, @CompanyId);
-- END;
-- EXEC dbo.RegisterForJobFair @StudentId = 5, @CompanyId = 2;

-- SQL Server trigger principle: join the multi-row inserted/deleted tables.
-- INSERT dbo.audit_logs(...)
-- SELECT 'payments', i.payment_id, 'UPDATE_AMOUNT',
--        CONVERT(varchar(50), d.amount), CONVERT(varchar(50), i.amount)
-- FROM inserted i JOIN deleted d ON d.payment_id = i.payment_id
-- WHERE i.amount <> d.amount;

-- Tasks: identify parameters; explain automatic vs explicit execution; explain multi-row risk.
