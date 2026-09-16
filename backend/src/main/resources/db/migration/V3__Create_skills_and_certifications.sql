-- V3__Create_skills_and_certifications.sql
-- Skills and Certifications Master Data

-- Create SKILLS table (Master)
CREATE TABLE skills (
    id BIGSERIAL PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create EMPLOYEE_SKILLS junction table
CREATE TABLE employee_skills (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level INT NOT NULL,
    years_of_experience INT,
    last_used_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, skill_id),
    CONSTRAINT chk_proficiency_level CHECK (proficiency_level BETWEEN 1 AND 10)
);

-- Create CERTIFICATIONS table (Master)
CREATE TABLE certifications (
    id BIGSERIAL PRIMARY KEY,
    certification_name VARCHAR(100) NOT NULL UNIQUE,
    issuing_organization VARCHAR(100),
    description TEXT,
    valid_years INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create EMPLOYEE_CERTIFICATIONS junction table
CREATE TABLE employee_certifications (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    certification_id BIGINT NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
    obtained_date DATE NOT NULL,
    expiry_date DATE,
    is_valid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, certification_id, obtained_date)
);
