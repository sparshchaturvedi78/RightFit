-- V2__Create_employees_and_projects.sql
-- Employee Management Master Data & Project Master Data

-- Create EMPLOYEES table (Master)
CREATE TABLE employees (
    id BIGSERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    grade VARCHAR(50),
    designation VARCHAR(255),
    domain VARCHAR(100),
    department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL,
    location_id BIGINT REFERENCES locations(id) ON DELETE SET NULL,
    years_of_experience DECIMAL(5,2),
    date_of_joining DATE,
    rmg_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    employment_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    allocation_status VARCHAR(20) NOT NULL DEFAULT 'UNALLOCATED',
    availability_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    pool_status VARCHAR(50) DEFAULT 'NOT_IN_RESOURCE_POOL',
    working_hours_per_day DECIMAL(5,2) DEFAULT 9.00,
    available_from_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT chk_employment_status CHECK (employment_status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT chk_allocation_status CHECK (allocation_status IN ('ALLOCATED', 'UNALLOCATED', 'ALLOCATION_PENDING')),
    CONSTRAINT chk_availability_status CHECK (availability_status IN ('AVAILABLE', 'UNAVAILABLE', 'ON_HOLD'))
);

-- Add missing columns to users table
ALTER TABLE users
    ADD COLUMN employee_id BIGINT NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN created_by VARCHAR(255),
    ADD COLUMN updated_by VARCHAR(255);

-- Create PROJECTS table (Master)
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL UNIQUE,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    client_name VARCHAR(255),
    project_type VARCHAR(100),
    domain VARCHAR(100),
    technology TEXT,
    location VARCHAR(100),
    work_mode VARCHAR(50),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    manager_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Create PROJECT_MEMBERS table
CREATE TABLE project_members (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    role VARCHAR(100),
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, employee_id)
);
