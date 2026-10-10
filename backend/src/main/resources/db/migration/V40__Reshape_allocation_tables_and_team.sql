-- V40__Reshape_allocation_tables_and_team.sql
-- Manager Phases 9-10: allocation requests, allocations (capacity split), allocation history, team membership.
-- The V8 allocation_requests/allocations stubs were never wired (0 rows) and are recreated.

DROP TABLE IF EXISTS allocations CASCADE;
DROP TABLE IF EXISTS allocation_requests CASCADE;

CREATE SEQUENCE IF NOT EXISTS allocation_request_business_id_seq START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS allocation_business_id_seq START WITH 1001 INCREMENT BY 1;

CREATE TABLE allocation_requests (
    id BIGSERIAL PRIMARY KEY,
    request_id VARCHAR(50) NOT NULL UNIQUE,
    candidate_application_id BIGINT NOT NULL REFERENCES candidate_applications(id) ON DELETE RESTRICT,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    requirement_id BIGINT NOT NULL REFERENCES project_requirements(id) ON DELETE RESTRICT,
    submitted_by BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    requested_start_date DATE NOT NULL,
    requested_end_date DATE,
    requested_hours_per_day NUMERIC(4, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    review_comments TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_alloc_request_status CHECK (status IN ('SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED')),
    CONSTRAINT chk_alloc_request_hours CHECK (requested_hours_per_day > 0)
);
CREATE UNIQUE INDEX uq_alloc_request_open_per_candidate
    ON allocation_requests(candidate_application_id) WHERE status = 'SUBMITTED';
CREATE INDEX idx_alloc_requests_project ON allocation_requests(project_id);
CREATE INDEX idx_alloc_requests_employee ON allocation_requests(employee_id);

CREATE TABLE allocations (
    id BIGSERIAL PRIMARY KEY,
    allocation_id VARCHAR(50) NOT NULL UNIQUE,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    requirement_id BIGINT REFERENCES project_requirements(id) ON DELETE RESTRICT,
    allocation_request_id BIGINT REFERENCES allocation_requests(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE,
    hours_per_day NUMERIC(4, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    end_reason VARCHAR(50),
    created_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    ended_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    ended_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_allocation_status CHECK (status IN ('ACTIVE', 'ENDED')),
    CONSTRAINT chk_allocation_hours CHECK (hours_per_day > 0)
);
CREATE UNIQUE INDEX uq_allocation_active_employee_project
    ON allocations(employee_id, project_id) WHERE status = 'ACTIVE';
CREATE INDEX idx_allocations_employee ON allocations(employee_id);
CREATE INDEX idx_allocations_project ON allocations(project_id);

-- Append-only: historical allocation records must be preserved (BRD 7.1)
CREATE TABLE allocation_events (
    id BIGSERIAL PRIMARY KEY,
    allocation_id BIGINT NOT NULL REFERENCES allocations(id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL,
    details TEXT,
    performed_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_allocation_events_allocation ON allocation_events(allocation_id, created_at);

-- Soft-removable team membership (history kept)
ALTER TABLE project_members
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN left_at TIMESTAMP,
    ADD COLUMN added_by BIGINT;
