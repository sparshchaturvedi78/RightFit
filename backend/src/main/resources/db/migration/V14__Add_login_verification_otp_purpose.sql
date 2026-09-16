-- V14__Add_login_verification_and_forgot_password_otp_purposes.sql
-- Add LOGIN_VERIFICATION and FORGOT_PASSWORD to the OTP purposes constraint

ALTER TABLE otp_tokens DROP CONSTRAINT chk_otp_purpose;
ALTER TABLE otp_tokens ADD CONSTRAINT chk_otp_purpose CHECK (purpose IN ('PASSWORD_RESET', 'EMAIL_VERIFICATION', 'ACCOUNT_RECOVERY', 'LOGIN_VERIFICATION', 'FORGOT_PASSWORD'));
