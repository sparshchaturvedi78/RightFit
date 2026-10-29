-- V65__Training_decision_comment.sql
-- The RMG's reason for approving or declining an associate's training request is kept on the assignment,
-- so the associate can read it after the notification has been dismissed. Capped at 1000 characters.

ALTER TABLE training_assignments ADD COLUMN IF NOT EXISTS decision_comment VARCHAR(1000);
