-- V6__Create_project_requirements.sql
-- Project Requirements and Candidate Matching

-- Create PROJECT_REQUIREMENTS table
CREATE TABLE project_requirements (
    id BIGSERIAL PRIMARY KEY,
    requirement_id VARCHAR(50) NOT NULL UNIQUE,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    position_title VARCHAR(255) NOT NULL,
    description TEXT,
    required_skills TEXT,
    min_experience INT,
    max_experience INT,
    required_certifications TEXT,
    min_employees INT,
    max_employees INT,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    allocation_start_date DATE,
    allocation_end_date DATE,
    created_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by_name VARCHAR(255),
    updated_by_name VARCHAR(255),
    CONSTRAINT chk_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'OPEN', 'INTERVIEWING', 'MANAGER_REVIEW', 'SELECTED', 'REJECTED', 'ALLOCATION_REQUESTED', 'ALLOCATED', 'CLOSED', 'ON_HOLD', 'CANCELLED'))
);
