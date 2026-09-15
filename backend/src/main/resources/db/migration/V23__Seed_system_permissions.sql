-- V23__Seed_system_permissions.sql
-- Seed all 28 Phase 3.1 RBAC system-defined permissions

-- Employee Management (7 permissions)
INSERT INTO permissions (name, description, resource, action, scope, is_system, is_active) VALUES
('EMPLOYEE_CREATE', 'Create new employees', 'EMPLOYEE', 'CREATE', 'GLOBAL', true, true),
('EMPLOYEE_READ', 'View employee records', 'EMPLOYEE', 'READ', 'GLOBAL', true, true),
('EMPLOYEE_UPDATE', 'Update employee information', 'EMPLOYEE', 'UPDATE', 'GLOBAL', true, true),
('EMPLOYEE_DEACTIVATE', 'Deactivate employee (business lifecycle)', 'EMPLOYEE', 'DEACTIVATE', 'GLOBAL', true, true),
('EMPLOYEE_ASSIGN_RMG', 'Assign RMG during employee creation', 'EMPLOYEE', 'ASSIGN_RMG', 'GLOBAL', true, true),
('EMPLOYEE_CHANGE_RMG', 'Change employee RMG assignment', 'EMPLOYEE', 'CHANGE_RMG', 'GLOBAL', true, true),
('EMPLOYEE_MANAGE_ADMINISTRATIVE', 'Manage employee administrative information', 'EMPLOYEE', 'MANAGE_ADMINISTRATIVE', 'GLOBAL', true, true)
ON CONFLICT (name) DO NOTHING;

-- Project Management (6 permissions)
INSERT INTO permissions (name, description, resource, action, scope, is_system, is_active) VALUES
('PROJECT_CREATE', 'Create projects', 'PROJECT', 'CREATE', 'GLOBAL', true, true),
('PROJECT_READ', 'View project information', 'PROJECT', 'READ', 'GLOBAL', true, true),
('PROJECT_UPDATE', 'Update project details', 'PROJECT', 'UPDATE', 'GLOBAL', true, true),
('PROJECT_ASSIGN_MANAGER', 'Assign managers to projects', 'PROJECT', 'ASSIGN_MANAGER', 'GLOBAL', true, true),
('PROJECT_CHANGE_MANAGER', 'Change project managers', 'PROJECT', 'CHANGE_MANAGER', 'GLOBAL', true, true),
('PROJECT_CLOSE', 'Close/archive project (business lifecycle)', 'PROJECT', 'CLOSE', 'GLOBAL', true, true)
ON CONFLICT (name) DO NOTHING;

-- Role Management (4 permissions) - READ ONLY in MVP
INSERT INTO permissions (name, description, resource, action, scope, is_system, is_active) VALUES
('ROLE_READ', 'View platform roles', 'ROLE', 'READ', 'GLOBAL', true, true),
('ROLE_ASSIGN_USER', 'Assign roles to users', 'ROLE', 'ASSIGN_USER', 'GLOBAL', true, true),
('PERMISSION_READ', 'View available permissions', 'PERMISSION', 'READ', 'GLOBAL', true, true),
('USER_ENABLE_DISABLE', 'Enable/disable user accounts', 'USER', 'ENABLE_DISABLE', 'GLOBAL', true, true)
ON CONFLICT (name) DO NOTHING;

-- Assignment Management (3 permissions)
INSERT INTO permissions (name, description, resource, action, scope, is_system, is_active) VALUES
('ASSIGNMENT_VIEW', 'View all assignments for departing person', 'ASSIGNMENT', 'VIEW', 'GLOBAL', true, true),
('ASSIGNMENT_REPLACE_MANAGER', 'Replace departing Manager assignments', 'ASSIGNMENT', 'REPLACE_MANAGER', 'GLOBAL', true, true),
('ASSIGNMENT_REPLACE_RMG', 'Replace departing RMG assignments', 'ASSIGNMENT', 'REPLACE_RMG', 'GLOBAL', true, true)
ON CONFLICT (name) DO NOTHING;

-- Audit & Reporting (5 permissions)
INSERT INTO permissions (name, description, resource, action, scope, is_system, is_active) VALUES
('AUDIT_READ', 'View audit history', 'AUDIT', 'READ', 'GLOBAL', true, true),
('AUDIT_EXPORT', 'Download audit history files', 'AUDIT', 'EXPORT', 'GLOBAL', true, true),
('AUDIT_FILTER', 'Filter audit by date, actor, entity, action', 'AUDIT', 'FILTER', 'GLOBAL', true, true),
('REPORT_GENERATE', 'Generate system reports', 'REPORT', 'GENERATE', 'GLOBAL', true, true),
('REPORT_DOWNLOAD', 'Download generated reports', 'REPORT', 'DOWNLOAD', 'GLOBAL', true, true)
ON CONFLICT (name) DO NOTHING;

-- Search & Discovery (3 permissions)
INSERT INTO permissions (name, description, resource, action, scope, is_system, is_active) VALUES
('EMPLOYEE_SEARCH', 'Search employees with filters', 'SEARCH', 'EMPLOYEE_SEARCH', 'GLOBAL', true, true),
('PROJECT_SEARCH', 'Search projects with filters', 'SEARCH', 'PROJECT_SEARCH', 'GLOBAL', true, true),
('RMG_VIEW', 'View all RMGs with associate counts', 'SEARCH', 'RMG_VIEW', 'GLOBAL', true, true)
ON CONFLICT (name) DO NOTHING;
