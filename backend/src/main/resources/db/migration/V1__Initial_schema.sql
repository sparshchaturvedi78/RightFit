-- V1__Initial_schema.sql
-- Authentication & Authorization Layer
-- Creates fundamental auth structures: Roles, Users, and User-Role mapping

-- Create ROLES table (Master data)
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create USERS table
-- Note: employee_id FK will be added in V2 after employees table is created
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    password_changed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create USER_ROLES junction table
CREATE TABLE user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- Insert initial roles
INSERT INTO roles (code, name, description) VALUES
    ('ADMIN', 'Admin', 'Administrator - Full system access and organizational management'),
    ('MANAGER', 'Manager', 'Project Manager - Project and candidate management responsibilities'),
    ('RMG', 'RMG', 'Resource Management Group - Workforce allocation and pool management'),
    ('ASSOCIATE', 'Associate', 'Employee/Resource - Self-service profile and opportunity access');
