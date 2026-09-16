-- V18__Add_reset_token_to_otp_tokens.sql
-- Add a single-use reset token to otp_tokens so forgot-password step 3
-- cannot be called without a token issued by a successful step 2 OTP verification.

ALTER TABLE otp_tokens ADD COLUMN reset_token VARCHAR(64);
ALTER TABLE otp_tokens ADD COLUMN reset_token_expires_at TIMESTAMP;
ALTER TABLE otp_tokens ADD COLUMN reset_token_used BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_otp_tokens_reset_token ON otp_tokens(reset_token);
