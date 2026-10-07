-- V33__Fix_audit_logs_table_schema.sql
-- V22 used "CREATE TABLE IF NOT EXISTS audit_logs", which was a no-op because
-- V10 had already created audit_logs with a different, incompatible schema
-- (action_type/actor_employee_id/old_values/new_values instead of the columns
-- the AuditLog entity actually maps: action/performed_by/old_value/new_value/etc).
-- Nothing depends on V10's original columns, so recreate the table to match
-- the entity exactly.

DROP TABLE IF EXISTS audit_logs;

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    audit_id VARCHAR(64) NOT NULL UNIQUE,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT,
    action VARCHAR(50) NOT NULL,
    performed_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    performed_by_email VARCHAR(255),
    old_value TEXT,
    new_value TEXT,
    change_summary TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
