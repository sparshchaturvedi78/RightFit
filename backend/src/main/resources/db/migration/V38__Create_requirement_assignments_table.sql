-- V38__Create_requirement_assignments_table.sql
-- Manager Phase 3: SOURCER / INTERVIEWER / COORDINATOR responsibilities per requirement (BR-008..010)

CREATE TABLE requirement_assignments (
    id BIGSERIAL PRIMARY KEY,
    requirement_id BIGINT NOT NULL REFERENCES project_requirements(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    responsibility_type VARCHAR(20) NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by BIGINT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_responsibility_type CHECK (responsibility_type IN ('SOURCER', 'INTERVIEWER', 'COORDINATOR'))
);

-- Same employee may hold several responsibility types, and several employees may share one type,
-- but the same employee cannot hold the same type twice while active.
CREATE UNIQUE INDEX uq_requirement_assignment_active
    ON requirement_assignments(requirement_id, employee_id, responsibility_type)
    WHERE is_active = TRUE;

CREATE INDEX idx_requirement_assignments_requirement ON requirement_assignments(requirement_id);
CREATE INDEX idx_requirement_assignments_employee ON requirement_assignments(employee_id);
