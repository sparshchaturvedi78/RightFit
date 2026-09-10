-- V9__Create_rejection_and_training.sql
-- Rejection Reasons, Rejections, Training Programs, and Training Assignments

-- Create REJECTION_REASONS table (Master)
CREATE TABLE rejection_reasons (
    id BIGSERIAL PRIMARY KEY,
    reason_name VARCHAR(100) NOT NULL,
    reason_category VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert common rejection reasons
INSERT INTO rejection_reasons (reason_name, reason_category, description) VALUES
    ('SKILL_GAP', 'TECHNICAL', 'Skills do not match project requirements'),
    ('EXPERIENCE_GAP', 'TECHNICAL', 'Insufficient experience level for the role'),
    ('DOMAIN_MISMATCH', 'TECHNICAL', 'Domain expertise does not match requirements'),
    ('LOCATION_MISMATCH', 'LOCATION', 'Location preference does not match project requirements'),
    ('WORK_MODE_MISMATCH', 'PREFERENCE', 'Work mode does not match employee preference'),
    ('COMMUNICATION', 'BEHAVIORAL', 'Communication skills not suitable for role'),
    ('PROJECT_FIT', 'STRATEGIC', 'Not a good fit for project requirements'),
    ('OTHER', 'MISCELLANEOUS', 'Other reason');

-- Create REJECTIONS table
-- Tracks candidate rejections with reason and history
CREATE TABLE rejections (
    id BIGSERIAL PRIMARY KEY,
    candidate_application_id BIGINT NOT NULL REFERENCES candidate_applications(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    requirement_id BIGINT NOT NULL REFERENCES project_requirements(id) ON DELETE CASCADE,
    rejection_reason_id BIGINT NOT NULL REFERENCES rejection_reasons(id) ON DELETE RESTRICT,
    rejected_by BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    rejection_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rejection_comment TEXT,
    interview_feedback_id BIGINT REFERENCES interview_feedback(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create TRAINING_PROGRAMS table (Master)
CREATE TABLE training_programs (
    id BIGSERIAL PRIMARY KEY,
    program_id VARCHAR(50) NOT NULL UNIQUE,
    program_name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_days INT,
    training_type VARCHAR(50),
    provider VARCHAR(100),
    cost DECIMAL(10, 2),
    required_certifications TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create TRAINING_ASSIGNMENTS table
CREATE TABLE training_assignments (
    id BIGSERIAL PRIMARY KEY,
    assignment_id VARCHAR(50) NOT NULL UNIQUE,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    training_program_id BIGINT NOT NULL REFERENCES training_programs(id) ON DELETE RESTRICT,
    rejection_id BIGINT REFERENCES rejections(id) ON DELETE SET NULL,
    assignment_status VARCHAR(20) NOT NULL DEFAULT 'ASSIGNED',
    start_date DATE,
    expected_end_date DATE,
    actual_end_date DATE,
    completion_status VARCHAR(20),
    score INT,
    certificate_id VARCHAR(100),
    assigned_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_assign_status CHECK (assignment_status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DEFERRED')),
    CONSTRAINT chk_completion_status CHECK (completion_status IN ('PASSED', 'FAILED', 'IN_PROGRESS', 'NOT_STARTED', NULL)),
    CONSTRAINT chk_score CHECK (score IS NULL OR score BETWEEN 0 AND 100)
);
