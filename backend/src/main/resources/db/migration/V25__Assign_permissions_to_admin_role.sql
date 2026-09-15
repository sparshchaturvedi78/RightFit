-- V25__Assign_permissions_to_admin_role.sql
-- Assign all 28 Phase 3.1 system permissions to ADMIN role

DO $$
DECLARE
    v_admin_role_id BIGINT;
BEGIN
    -- Get ADMIN role ID
    SELECT id INTO v_admin_role_id FROM roles WHERE code = 'ADMIN' LIMIT 1;

    -- Only proceed if ADMIN role exists
    IF v_admin_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id, created_at)
        SELECT
            v_admin_role_id,
            id,
            CURRENT_TIMESTAMP
        FROM permissions
        WHERE is_system = true AND is_active = true
        AND name IN (
            'EMPLOYEE_CREATE', 'EMPLOYEE_READ', 'EMPLOYEE_UPDATE', 'EMPLOYEE_DEACTIVATE',
            'EMPLOYEE_ASSIGN_RMG', 'EMPLOYEE_CHANGE_RMG', 'EMPLOYEE_MANAGE_ADMINISTRATIVE',
            'PROJECT_CREATE', 'PROJECT_READ', 'PROJECT_UPDATE', 'PROJECT_ASSIGN_MANAGER',
            'PROJECT_CHANGE_MANAGER', 'PROJECT_CLOSE',
            'ROLE_READ', 'ROLE_ASSIGN_USER', 'PERMISSION_READ', 'USER_ENABLE_DISABLE',
            'ASSIGNMENT_VIEW', 'ASSIGNMENT_REPLACE_MANAGER', 'ASSIGNMENT_REPLACE_RMG',
            'AUDIT_READ', 'AUDIT_EXPORT', 'AUDIT_FILTER', 'REPORT_GENERATE', 'REPORT_DOWNLOAD',
            'EMPLOYEE_SEARCH', 'PROJECT_SEARCH', 'RMG_VIEW'
        )
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
END $$;
