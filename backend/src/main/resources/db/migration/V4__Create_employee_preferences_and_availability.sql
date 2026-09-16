-- V4__Create_employee_preferences_and_availability.sql
-- Employee Preferences and Availability Management

-- Create EMPLOYEE_PREFERENCES table
CREATE TABLE employee_preferences (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
    preferred_technology VARCHAR(255),
    preferred_domain VARCHAR(100),
    preferred_location VARCHAR(100),
    preferred_work_mode VARCHAR(50),
    preferred_project_type VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create EMPLOYEE_AVAILABILITY table
-- Handles employee availability status and RMG verification workflow
CREATE TABLE employee_availability (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    availability_status VARCHAR(20) NOT NULL,
    available_from DATE,
    reason TEXT,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'NOT_REQUIRED',
    verified_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    verified_at TIMESTAMP,
    verification_comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_availability_status CHECK (availability_status IN ('AVAILABLE', 'UNAVAILABLE', 'ON_HOLD')),
    CONSTRAINT chk_verification_status CHECK (verification_status IN ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED'))
);
