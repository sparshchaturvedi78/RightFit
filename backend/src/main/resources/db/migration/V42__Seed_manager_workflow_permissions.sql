-- V42__Seed_manager_workflow_permissions.sql
-- Manager Phases 4-13 permissions

INSERT INTO permissions (name, description, resource, action, scope, is_system, is_active) VALUES
('CANDIDATE_SEARCH', 'Search employees and view permitted candidate profiles', 'CANDIDATE', 'SEARCH', 'GLOBAL', true, true),
('CANDIDATE_READ', 'View candidate pipelines and history', 'CANDIDATE', 'READ', 'GLOBAL', true, true),
('CANDIDATE_SHORTLIST', 'Identify, shortlist and withdraw candidates', 'CANDIDATE', 'SHORTLIST', 'GLOBAL', true, true),
('CANDIDATE_RECOMMEND', 'Recommend employees to a requirement (does not shortlist)', 'CANDIDATE', 'RECOMMEND', 'GLOBAL', true, true),
('CANDIDATE_CONTACT', 'Contact employees about opportunities', 'CANDIDATE', 'CONTACT', 'GLOBAL', true, true),
('CANDIDATE_DECISION', 'Make the final candidate decision (Manager only)', 'CANDIDATE', 'DECISION', 'GLOBAL', true, true),
('INVITATION_SEND', 'Send and withdraw project invitations', 'INVITATION', 'SEND', 'GLOBAL', true, true),
('INVITATION_READ', 'View project invitations for owned requirements', 'INVITATION', 'READ', 'GLOBAL', true, true),
('INVITATION_RESPOND', 'View and respond to own project invitations and opportunities', 'INVITATION', 'RESPOND', 'GLOBAL', true, true),
('INTERVIEW_SCHEDULE', 'Schedule and cancel interviews', 'INTERVIEW', 'SCHEDULE', 'GLOBAL', true, true),
('INTERVIEW_CONDUCT', 'Conduct interviews and submit feedback', 'INTERVIEW', 'CONDUCT', 'GLOBAL', true, true),
('INTERVIEW_READ', 'View interviews and feedback', 'INTERVIEW', 'READ', 'GLOBAL', true, true),
('INTERVIEW_RESPOND', 'Respond to own interview invitations', 'INTERVIEW', 'RESPOND', 'GLOBAL', true, true),
('ALLOCATION_REQUEST_CREATE', 'Submit allocation requests (Manager only)', 'ALLOCATION_REQUEST', 'CREATE', 'GLOBAL', true, true),
('ALLOCATION_REQUEST_READ', 'View allocation requests', 'ALLOCATION_REQUEST', 'READ', 'GLOBAL', true, true),
('ALLOCATION_REQUEST_APPROVE', 'Approve or reject allocation requests (RMG only)', 'ALLOCATION_REQUEST', 'APPROVE', 'GLOBAL', true, true),
('TEAM_READ', 'View project teams and staffing', 'TEAM', 'READ', 'GLOBAL', true, true),
('TEAM_MANAGE', 'Add or remove project team members', 'TEAM', 'MANAGE', 'GLOBAL', true, true),
('ALLOCATION_MANAGE', 'Move employees between projects and split allocation capacity', 'ALLOCATION', 'MANAGE', 'GLOBAL', true, true),
('PROJECT_LOOKUP', 'Look up projects by Project ID', 'PROJECT', 'LOOKUP', 'GLOBAL', true, true),
('NOTIFICATION_READ_OWN', 'Read own notifications', 'NOTIFICATION', 'READ_OWN', 'GLOBAL', true, true),
('MANAGER_DASHBOARD_READ', 'View the Manager dashboard and reports', 'DASHBOARD', 'MANAGER_READ', 'GLOBAL', true, true)
ON CONFLICT (name) DO NOTHING;
