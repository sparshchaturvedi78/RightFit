-- V16__Create_revoked_tokens_table.sql
-- Create table for storing revoked access tokens

CREATE TABLE revoked_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    revoked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_token_hash ON revoked_tokens(token_hash);
CREATE INDEX idx_user_id ON revoked_tokens(user_id);
CREATE INDEX idx_revoked_at ON revoked_tokens(revoked_at);
CREATE INDEX idx_expires_at ON revoked_tokens(expires_at);
