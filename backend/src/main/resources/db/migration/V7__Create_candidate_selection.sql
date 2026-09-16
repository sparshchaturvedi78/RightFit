-- V7__Create_candidate_selection.sql
-- Candidate Selection Flow (Applications, Invitations, Interviews, Feedback)

-- Create CANDIDATE_APPLICATIONS table
CREATE TABLE candidate_applications (
    id BIGSERIAL PRIMARY KEY,
    application_id VARCHAR(50) NOT NULL UNIQUE,
    requirement_id BIGINT NOT NULL REFERENCES project_requirements(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    application_status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    cover_letter TEXT,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    rejected_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requirement_id, employee_id)
);

-- Create INVITATIONS table
CREATE TABLE invitations (
    id BIGSERIAL PRIMARY KEY,
    invitation_id VARCHAR(50) NOT NULL UNIQUE,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    requirement_id BIGINT NOT NULL REFERENCES project_requirements(id) ON DELETE CASCADE,
    application_id BIGINT REFERENCES candidate_applications(id) ON DELETE CASCADE,
    invitation_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    invited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    invited_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    response_deadline DATE,
    response_received_at TIMESTAMP,
    response_status VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create INTERVIEWS table
CREATE TABLE interviews (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    requirement_id BIGINT NOT NULL REFERENCES project_requirements(id) ON DELETE CASCADE,
    invitation_id BIGINT REFERENCES invitations(id) ON DELETE SET NULL,
    interviewer_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    interview_status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    scheduled_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create INTERVIEW_FEEDBACK table
CREATE TABLE interview_feedback (
    id BIGSERIAL PRIMARY KEY,
    interview_id BIGINT NOT NULL UNIQUE REFERENCES interviews(id) ON DELETE CASCADE,
    comments TEXT,
    rating INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
