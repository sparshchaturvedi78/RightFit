-- V13__Create_auth_support_tables.sql
-- Authentication Support Tables for OTP, Failed Logins, and Refresh Tokens

-- ============================================================================
-- OTP TOKENS TABLE
-- ============================================================================
CREATE TABLE otp_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_code VARCHAR(6) NOT NULL,
    email VARCHAR(255) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_otp_purpose CHECK (purpose IN ('PASSWORD_RESET', 'EMAIL_VERIFICATION', 'ACCOUNT_RECOVERY', 'LOGIN_VERIFICATION'))
);

-- Create indexes for OTP lookup
CREATE INDEX idx_otp_user_id ON otp_tokens(user_id);
CREATE INDEX idx_otp_code ON otp_tokens(otp_code);
CREATE INDEX idx_otp_expires_at ON otp_tokens(expires_at);
CREATE INDEX idx_otp_is_used ON otp_tokens(is_used);

-- ============================================================================
-- FAILED LOGIN ATTEMPTS TABLE
-- ============================================================================
CREATE TABLE failed_login_attempts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    attempt_count INT DEFAULT 1,
    last_attempt_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    locked_until TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_attempt_count CHECK (attempt_count >= 0)
);

-- Create indexes for failed login lookup
CREATE INDEX idx_failed_login_user_id ON failed_login_attempts(user_id);
CREATE INDEX idx_failed_login_email ON failed_login_attempts(email);
CREATE INDEX idx_failed_login_locked_until ON failed_login_attempts(locked_until);

-- ============================================================================
-- REFRESH TOKENS TABLE
-- ============================================================================
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_value VARCHAR(500) NOT NULL UNIQUE,
    is_revoked BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_token_length CHECK (length(token_value) > 0)
);

-- Create indexes for refresh token lookup
CREATE INDEX idx_refresh_token_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_token_value ON refresh_tokens(token_value);
CREATE INDEX idx_refresh_token_revoked ON refresh_tokens(is_revoked);
CREATE INDEX idx_refresh_token_expires_at ON refresh_tokens(expires_at);

-- ============================================================================
-- LOGIN AUDIT TABLE
-- ============================================================================
CREATE TABLE login_audit (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255),
    login_status VARCHAR(20) NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    device_info VARCHAR(255),
    login_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_login_status CHECK (login_status IN ('SUCCESS', 'FAILED', 'LOCKED', 'INVALID_CREDENTIALS'))
);

-- Create indexes for login audit
CREATE INDEX idx_login_audit_user_id ON login_audit(user_id);
CREATE INDEX idx_login_audit_email ON login_audit(email);
CREATE INDEX idx_login_audit_status ON login_audit(login_status);
CREATE INDEX idx_login_audit_timestamp ON login_audit(login_timestamp DESC);
