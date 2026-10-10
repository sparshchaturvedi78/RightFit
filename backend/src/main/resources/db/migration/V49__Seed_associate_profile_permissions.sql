-- V49__Seed_associate_profile_permissions.sql
-- Associate Phase: self-service profile (BRD 18-21). Self-service permissions are not role-specific -
-- every employee, whatever role they also hold, manages their own skills/certs/preferences/availability.

INSERT INTO permissions (name, description, resource, action, scope, is_system, is_active) VALUES
('EMPLOYEE_PROFILE_UPDATE', 'View and update own basic profile (phone)', 'EMPLOYEE_PROFILE', 'UPDATE', 'GLOBAL', true, true),
('EMPLOYEE_SKILL_MANAGE', 'Manage own skills', 'EMPLOYEE_SKILL', 'MANAGE', 'GLOBAL', true, true),
('EMPLOYEE_CERTIFICATION_MANAGE', 'Manage own certifications, including document upload', 'EMPLOYEE_CERTIFICATION', 'MANAGE', 'GLOBAL', true, true),
('EMPLOYEE_PREFERENCE_MANAGE', 'View and update own preferences', 'EMPLOYEE_PREFERENCE', 'MANAGE', 'GLOBAL', true, true),
('EMPLOYEE_AVAILABILITY_REQUEST', 'Request temporary unavailability and return early', 'EMPLOYEE_AVAILABILITY', 'REQUEST', 'GLOBAL', true, true),
('EMPLOYEE_AVAILABILITY_VERIFY', 'Approve or reject temporary unavailability requests (RMG only)', 'EMPLOYEE_AVAILABILITY', 'VERIFY', 'GLOBAL', true, true),
('SKILL_CATALOG_READ', 'Browse the skill catalog', 'SKILL_CATALOG', 'READ', 'GLOBAL', true, true),
('SKILL_CATALOG_MANAGE', 'Create, update and retire skills in the catalog (Admin only)', 'SKILL_CATALOG', 'MANAGE', 'GLOBAL', true, true),
('CERTIFICATION_CATALOG_READ', 'Browse the certification catalog', 'CERTIFICATION_CATALOG', 'READ', 'GLOBAL', true, true),
('CERTIFICATION_CATALOG_MANAGE', 'Create, update and retire certifications in the catalog (Admin only)', 'CERTIFICATION_CATALOG', 'MANAGE', 'GLOBAL', true, true)
ON CONFLICT (name) DO NOTHING;
