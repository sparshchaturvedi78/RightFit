-- V44__Fix_rbac_permission_code_mismatches.sql
-- Closes the pre-existing RBAC bug: 5 @PreAuthorize codes had no matching seeded permission,
-- blocking AdminPermissionController, AdminRoleController, UserRoleManagementController,
-- RolePermissionManagementController and AdminReportController's list endpoint for everyone,
-- including ADMIN, on a fresh (migration-only) database.
--
-- Three codes (PERMISSION_VIEW, ROLE_VIEW, USER_ROLE_ASSIGN) are fixed by renaming the controller
-- literals to the equivalent already-seeded codes (see the Java changes in this commit) - no SQL
-- needed for those three.
--
-- The other two (REPORT_VIEW, ROLE_PERMISSION_VIEW) were never seeded by any migration at all; on
-- this development database they happen to work only because of untracked rows inserted directly
-- during an earlier, abandoned fix attempt. This migration seeds them for real so a fresh database
-- (CI, a new developer, production) isn't left with the same hole. ON CONFLICT DO NOTHING makes it
-- safe to run against a database that already has the untracked rows.

INSERT INTO permissions (name, description, resource, action, scope, is_system, is_active) VALUES
('REPORT_VIEW', 'View available report types', 'REPORT', 'VIEW', 'GLOBAL', true, true),
('ROLE_PERMISSION_VIEW', 'View role-permission assignments', 'ROLE_PERMISSION', 'VIEW', 'GLOBAL', true, true)
ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
    v_admin_role_id BIGINT;
BEGIN
    SELECT id INTO v_admin_role_id FROM roles WHERE code = 'ADMIN' LIMIT 1;
    IF v_admin_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id, created_at)
        SELECT v_admin_role_id, id, CURRENT_TIMESTAMP
        FROM permissions
        WHERE is_system = true AND is_active = true AND name IN ('REPORT_VIEW', 'ROLE_PERMISSION_VIEW')
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
END $$;
