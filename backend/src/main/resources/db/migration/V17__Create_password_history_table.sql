-- V17__Create_password_history_table.sql
-- Create table for storing password history to prevent password reuse

CREATE TABLE password_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pwd_hist_user_id ON password_history(user_id);
CREATE INDEX idx_pwd_hist_changed_at ON password_history(changed_at);
