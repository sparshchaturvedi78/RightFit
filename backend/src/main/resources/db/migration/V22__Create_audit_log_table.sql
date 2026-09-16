-- V22__Create_audit_log_table.sql
-- Create AuditLog table for system-wide audit trail

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    before_state TEXT,
    after_state TEXT,
    context TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add user_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='audit_logs' AND column_name='user_id'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_user_id') THEN
        CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_entity_type') THEN
        CREATE INDEX idx_audit_entity_type ON audit_logs(entity_type);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_entity_id') THEN
        CREATE INDEX idx_audit_entity_id ON audit_logs(entity_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_action') THEN
        CREATE INDEX idx_audit_action ON audit_logs(action);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_timestamp') THEN
        CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_audit_entity_type_entity_id') THEN
        CREATE INDEX idx_audit_entity_type_entity_id ON audit_logs(entity_type, entity_id);
    END IF;
END $$;
