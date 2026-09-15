-- V24__Seed_system_roles.sql
-- Seed system roles: ADMIN, MANAGER, RMG, ASSOCIATE

INSERT INTO roles (code, name, description, role_type, is_modifiable, created_at, updated_at) VALUES
('ADMIN', 'Platform Administrator - Full system access', 'Platform Administrator - Full system access', 'SYSTEM', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('MANAGER', 'Project Manager', 'Manages assigned projects', 'SYSTEM', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('RMG', 'Resource Manager Group', 'Manages employee resources', 'SYSTEM', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ASSOCIATE', 'Employee Associate', 'Self-service profile access', 'SYSTEM', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;
