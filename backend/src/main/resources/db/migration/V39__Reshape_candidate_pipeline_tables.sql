-- V39__Reshape_candidate_pipeline_tables.sql
-- Manager Phases 4-8: the V7 stub tables were never wired to any code (0 rows) and do not match the
-- BRD candidate lifecycle, so they are recreated. rejections' FKs to them are restored at the end.

DROP TABLE IF EXISTS interview_feedback CASCADE;
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS candidate_applications CASCADE;

CREATE SEQUENCE IF NOT EXISTS candidate_business_id_seq START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS invitation_business_id_seq START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS interview_business_id_seq START WITH 1001 INCREMENT BY 1;

-- One row per (requirement, employee): candidate history is requirement-specific (BRD 11)
CREATE TABLE candidate_applications (
    id BIGSERIAL PRIMARY KEY,
    application_id VARCHAR(50) NOT NULL UNIQUE,
    requirement_id BIGINT NOT NULL REFERENCES project_requirements(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'IDENTIFIED',
    previous_status VARCHAR(30),
    source VARCHAR(30) NOT NULL DEFAULT 'MANAGER',
    notes TEXT,
    identified_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    identified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    shortlisted_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    shortlisted_at TIMESTAMP,
    requires_interview BOOLEAN NOT NULL DEFAULT TRUE,
    confirmed_at TIMESTAMP,
    decision VARCHAR(20),
    decision_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    decision_at TIMESTAMP,
    decision_reason TEXT,
    rejection_reason_code VARCHAR(50),
    rejection_comment TEXT,
    rejected_at TIMESTAMP,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_candidate_requirement_employee UNIQUE (requirement_id, employee_id),
    CONSTRAINT chk_candidate_status CHECK (status IN (
        'IDENTIFIED', 'SHORTLISTED', 'INVITATION_SENT', 'ACCEPTED', 'INTERVIEW', 'INTERVIEW_COMPLETED',
        'RECOMMENDED', 'MANAGER_REVIEW', 'SELECTED', 'ALLOCATION_REQUESTED', 'ALLOCATED',
        'DECLINED', 'REJECTED', 'WITHDRAWN', 'ON_HOLD')),
    CONSTRAINT chk_candidate_source CHECK (source IN ('MANAGER', 'SOURCER', 'RMG_RECOMMENDATION', 'ADMIN'))
);
CREATE INDEX idx_candidate_apps_requirement ON candidate_applications(requirement_id);
CREATE INDEX idx_candidate_apps_employee ON candidate_applications(employee_id);
CREATE INDEX idx_candidate_apps_status ON candidate_applications(status);

CREATE TABLE candidate_status_history (
    id BIGSERIAL PRIMARY KEY,
    candidate_application_id BIGINT NOT NULL REFERENCES candidate_applications(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    changed_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    reason TEXT,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_candidate_history_app ON candidate_status_history(candidate_application_id, changed_at);

CREATE TABLE invitations (
    id BIGSERIAL PRIMARY KEY,
    invitation_id VARCHAR(50) NOT NULL UNIQUE,
    candidate_application_id BIGINT NOT NULL REFERENCES candidate_applications(id) ON DELETE CASCADE,
    requirement_id BIGINT NOT NULL REFERENCES project_requirements(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'SENT',
    message TEXT,
    requires_interview BOOLEAN NOT NULL DEFAULT TRUE,
    invited_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    invited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    response_deadline DATE,
    viewed_at TIMESTAMP,
    responded_at TIMESTAMP,
    response_comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_invitation_status CHECK (status IN ('SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'JOINED', 'WITHDRAWN', 'EXPIRED'))
);
CREATE UNIQUE INDEX uq_invitation_open_per_candidate
    ON invitations(candidate_application_id) WHERE status IN ('SENT', 'VIEWED');
CREATE INDEX idx_invitations_employee ON invitations(employee_id);
CREATE INDEX idx_invitations_requirement ON invitations(requirement_id);

CREATE TABLE interviews (
    id BIGSERIAL PRIMARY KEY,
    interview_id VARCHAR(50) NOT NULL UNIQUE,
    candidate_application_id BIGINT NOT NULL REFERENCES candidate_applications(id) ON DELETE CASCADE,
    requirement_id BIGINT NOT NULL REFERENCES project_requirements(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    interviewer_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    scheduled_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    round_number INT NOT NULL DEFAULT 1,
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    mode VARCHAR(20) NOT NULL DEFAULT 'ONLINE',
    location_or_link VARCHAR(500),
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    candidate_response_at TIMESTAMP,
    candidate_response_comment TEXT,
    completed_at TIMESTAMP,
    cancelled_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_interview_status CHECK (status IN ('SCHEDULED', 'ACCEPTED', 'DECLINED', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_interview_mode CHECK (mode IN ('ONLINE', 'IN_PERSON', 'PHONE'))
);
CREATE INDEX idx_interviews_candidate ON interviews(candidate_application_id);
CREATE INDEX idx_interviews_employee ON interviews(employee_id);
CREATE INDEX idx_interviews_interviewer ON interviews(interviewer_id);
CREATE INDEX idx_interviews_scheduled_at ON interviews(scheduled_at);

CREATE TABLE interview_feedback (
    id BIGSERIAL PRIMARY KEY,
    interview_id BIGINT NOT NULL UNIQUE REFERENCES interviews(id) ON DELETE CASCADE,
    rating INT NOT NULL,
    technical_score INT,
    communication_score INT,
    cultural_fit_score INT,
    recommendation VARCHAR(10) NOT NULL,
    comments TEXT,
    given_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_feedback_rating CHECK (rating BETWEEN 1 AND 10),
    CONSTRAINT chk_feedback_recommendation CHECK (recommendation IN ('SELECT', 'REJECT', 'ON_HOLD'))
);

-- Restore the FKs that DROP ... CASCADE removed from the (still unwired) rejections table
ALTER TABLE rejections
    ADD CONSTRAINT rejections_candidate_application_id_fkey
        FOREIGN KEY (candidate_application_id) REFERENCES candidate_applications(id) ON DELETE CASCADE,
    ADD CONSTRAINT rejections_interview_feedback_id_fkey
        FOREIGN KEY (interview_feedback_id) REFERENCES interview_feedback(id) ON DELETE SET NULL;
