-- V8__Create_allocations.sql
-- Allocation Management (Requests and Allocations)

-- Create ALLOCATION_CAPACITY_RULES table
-- Configurable working hours and capacity rules
CREATE TABLE allocation_capacity_rules (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    working_hours_per_day DECIMAL(4, 2) NOT NULL,
    working_hours_per_week DECIMAL(5, 2) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create ALLOCATION_REQUESTS table
-- Reservation begins here: after employee acceptance + Manager allocation request
CREATE TABLE allocation_requests (
    id BIGSERIAL PRIMARY KEY,
    candidate_application_id BIGINT NOT NULL REFERENCES candidate_applications(id) ON DELETE RESTRICT,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    requirement_id BIGINT NOT NULL REFERENCES project_requirements(id) ON DELETE RESTRICT,
    submitted_by BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    requested_start_date DATE NOT NULL,
    requested_end_date DATE,
    requested_hours_per_day DECIMAL(4, 2),
    request_status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    review_comments TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_alloc_req_status CHECK (request_status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'))
);

-- Create ALLOCATIONS table
-- Actual allocation after approval
CREATE TABLE allocations (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    requirement_id BIGINT NOT NULL REFERENCES project_requirements(id) ON DELETE RESTRICT,
    allocation_request_id BIGINT REFERENCES allocation_requests(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    expected_end_date DATE,
    actual_end_date DATE,
    hours_per_day DECIMAL(4, 2),
    allocation_percentage DECIMAL(5, 2),
    allocation_type VARCHAR(20) NOT NULL DEFAULT 'FULL_TIME',
    allocation_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    ended_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_alloc_type CHECK (allocation_type IN ('FULL_TIME', 'PART_TIME', 'SPLIT')),
    CONSTRAINT chk_alloc_status CHECK (allocation_status IN ('ACTIVE', 'ENDED', 'CANCELLED'))
);
