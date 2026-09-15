-- V25__Assign_permissions_to_admin_role.sql
-- Assign all 28 Phase 3.1 system permissions to ADMIN role

-- Get ADMIN role ID and insert all permission assignments
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT
    (SELECT id FROM roles WHERE name = 'ADMIN' LIMIT 1),
    id,
    CURRENT_TIMESTAMP
FROM permissions
WHERE is_system = true AND is_active = true
AND name IN (
    -- Employee Management (7)
    'EMPLOYEE_CREATE', 'EMPLOYEE_READ', 'EMPLOYEE_UPDATE', 'EMPLOYEE_DEACTIVATE',
    'EMPLOYEE_ASSIGN_RMG', 'EMPLOYEE_CHANGE_RMG', 'EMPLOYEE_MANAGE_ADMINISTRATIVE',
    -- Project Management (6)
    'PROJECT_CREATE', 'PROJECT_READ', 'PROJECT_UPDATE', 'PROJECT_ASSIGN_MANAGER',
    'PROJECT_CHANGE_MANAGER', 'PROJECT_CLOSE',
    -- Role Management (4)
    'ROLE_READ', 'ROLE_ASSIGN_USER', 'PERMISSION_READ', 'USER_ENABLE_DISABLE',
    -- Assignment Management (3)
    'ASSIGNMENT_VIEW', 'ASSIGNMENT_REPLACE_MANAGER', 'ASSIGNMENT_REPLACE_RMG',
    -- Audit & Reporting (5)
    'AUDIT_READ', 'AUDIT_EXPORT', 'AUDIT_FILTER', 'REPORT_GENERATE', 'REPORT_DOWNLOAD',
    -- Search & Discovery (3)
    'EMPLOYEE_SEARCH', 'PROJECT_SEARCH', 'RMG_VIEW'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;
