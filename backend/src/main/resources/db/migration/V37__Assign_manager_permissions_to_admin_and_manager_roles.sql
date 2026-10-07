-- V37__Assign_manager_permissions_to_admin_and_manager_roles.sql
-- Grants the Manager-phase permissions to ADMIN and MANAGER (first permission grant to MANAGER)

DO $$
DECLARE
    v_role_code TEXT;
    v_role_id BIGINT;
BEGIN
    FOREACH v_role_code IN ARRAY ARRAY['ADMIN', 'MANAGER']
    LOOP
        SELECT id INTO v_role_id FROM roles WHERE code = v_role_code LIMIT 1;

        IF v_role_id IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id, created_at)
            SELECT v_role_id, id, CURRENT_TIMESTAMP
            FROM permissions
            WHERE is_system = true AND is_active = true
            AND name IN (
                'PROJECT_CLAIM', 'PROJECT_READ_OWN',
                'REQUIREMENT_CREATE', 'REQUIREMENT_READ', 'REQUIREMENT_UPDATE',
                'REQUIREMENT_PUBLISH', 'REQUIREMENT_CLOSE', 'REQUIREMENT_ASSIGN_RESPONSIBILITY'
            )
            ON CONFLICT (role_id, permission_id) DO NOTHING;
        END IF;
    END LOOP;
END $$;
