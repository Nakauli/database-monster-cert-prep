-- LAB 08: SQLITE TRIGGER AUDIT LOG
-- Objective: automatically audit payment amount changes.

DROP TRIGGER IF EXISTS payments_after_amount_update;
CREATE TRIGGER payments_after_amount_update
AFTER UPDATE OF amount ON payments
FOR EACH ROW
WHEN OLD.amount <> NEW.amount
BEGIN
  INSERT INTO audit_logs(table_name, record_id, action, old_value, new_value)
  VALUES ('payments', OLD.payment_id, 'UPDATE_AMOUNT',
          CAST(OLD.amount AS TEXT), CAST(NEW.amount AS TEXT));
END;

UPDATE payments SET amount = amount + 250 WHERE payment_id = 1;
SELECT * FROM audit_logs ORDER BY audit_id DESC LIMIT 1;

-- Expected: one audit row for payment 1 with old and new amount.
-- Tasks: update a non-amount column; confirm no audit row. Update two payments; count rows.
-- Challenge: add an AFTER DELETE trigger using OLD values.
-- Common mistakes: swapping OLD/NEW; trigger recursion; forgetting multi-row behavior differs by DBMS.
