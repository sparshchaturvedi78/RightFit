-- V15__Add_forgot_password_otp_purpose.sql
-- Add FORGOT_PASSWORD to the OTP purposes constraint

ALTER TABLE otp_tokens DROP CONSTRAINT chk_otp_purpose;
ALTER TABLE otp_tokens ADD CONSTRAINT chk_otp_purpose CHECK (purpose IN ('PASSWORD_RESET', 'EMAIL_VERIFICATION', 'ACCOUNT_RECOVERY', 'LOGIN_VERIFICATION', 'FORGOT_PASSWORD'));
