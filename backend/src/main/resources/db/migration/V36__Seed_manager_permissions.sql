-- V36__Seed_manager_permissions.sql
-- Manager Phases 1-3: project claim + requirement management permissions

INSERT INTO permissions (name, description, resource, action, scope, is_system, is_active) VALUES
('PROJECT_CLAIM', 'Claim/verify an assigned project', 'PROJECT', 'CLAIM', 'GLOBAL', true, true),
('PROJECT_READ_OWN', 'View projects assigned to the caller as Manager', 'PROJECT', 'READ_OWN', 'GLOBAL', true, true),
('REQUIREMENT_CREATE', 'Create project requirements', 'REQUIREMENT', 'CREATE', 'GLOBAL', true, true),
('REQUIREMENT_READ', 'View project requirements', 'REQUIREMENT', 'READ', 'GLOBAL', true, true),
('REQUIREMENT_UPDATE', 'Update, hold and resume requirements', 'REQUIREMENT', 'UPDATE', 'GLOBAL', true, true),
('REQUIREMENT_PUBLISH', 'Publish requirements', 'REQUIREMENT', 'PUBLISH', 'GLOBAL', true, true),
('REQUIREMENT_CLOSE', 'Close or cancel requirements', 'REQUIREMENT', 'CLOSE', 'GLOBAL', true, true),
('REQUIREMENT_ASSIGN_RESPONSIBILITY', 'Assign SOURCER/INTERVIEWER/COORDINATOR responsibilities', 'REQUIREMENT', 'ASSIGN_RESPONSIBILITY', 'GLOBAL', true, true)
ON CONFLICT (name) DO NOTHING;
