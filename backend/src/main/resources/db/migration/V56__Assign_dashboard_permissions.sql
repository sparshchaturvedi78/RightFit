-- V56__Assign_dashboard_permissions.sql
-- Admin dashboard: Admin only. RMG dashboard: RMG + Admin, same as every other RMG-phase endpoint.
-- Associate dashboard: self-service, all four roles - everyone is an Employee first.

CREATE OR REPLACE FUNCTION pg_temp.grant_permissions(p_role_code TEXT, p_names TEXT[]) RETURNS VOID AS $$
DECLARE
    v_role_id BIGINT;
BEGIN
    SELECT id INTO v_role_id FROM roles WHERE code = p_role_code LIMIT 1;
    IF v_role_id IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id, created_at)
        SELECT v_role_id, id, CURRENT_TIMESTAMP FROM permissions
        WHERE name = ANY(p_names) AND is_system = true AND is_active = true
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

SELECT pg_temp.grant_permissions('ADMIN', ARRAY['ADMIN_DASHBOARD_READ', 'RMG_DASHBOARD_READ', 'ASSOCIATE_DASHBOARD_READ']);
SELECT pg_temp.grant_permissions('RMG', ARRAY['RMG_DASHBOARD_READ', 'ASSOCIATE_DASHBOARD_READ']);
SELECT pg_temp.grant_permissions('MANAGER', ARRAY['ASSOCIATE_DASHBOARD_READ']);
SELECT pg_temp.grant_permissions('ASSOCIATE', ARRAY['ASSOCIATE_DASHBOARD_READ']);
