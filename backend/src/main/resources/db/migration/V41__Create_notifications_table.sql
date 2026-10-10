-- V41__Create_notifications_table.sql
-- Manager Phase 5/13: in-app notifications (BRD 33).
-- The V10 notifications table exists but was never wired to code (0 rows). It is adapted in place:
-- entity_id (BIGINT) becomes entity_ref (VARCHAR) so business IDs such as INV-1001 / REQ-1001 can be referenced.

ALTER TABLE notifications RENAME COLUMN entity_id TO entity_ref;
ALTER TABLE notifications ALTER COLUMN entity_ref TYPE VARCHAR(100) USING entity_ref::VARCHAR;
UPDATE notifications SET is_read = FALSE WHERE is_read IS NULL;
ALTER TABLE notifications ALTER COLUMN is_read SET NOT NULL;
ALTER TABLE notifications ALTER COLUMN is_read SET DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
    ON notifications(recipient_employee_id, is_read, created_at DESC);
