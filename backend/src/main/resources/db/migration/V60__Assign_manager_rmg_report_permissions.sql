-- V60__Assign_manager_rmg_report_permissions.sql
-- Managers and RMGs can open the Reports page. The service narrows what they see: Managers get rows
-- about their own projects, RMGs get rows about their own associates (AdminReportService.scopeForCaller).
-- REPORT_VIEW itself is seeded by V44; this only grants it, plus REPORT_GENERATE, to the two roles.

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

SELECT pg_temp.grant_permissions('MANAGER', ARRAY['REPORT_VIEW', 'REPORT_GENERATE']);
SELECT pg_temp.grant_permissions('RMG', ARRAY['REPORT_VIEW', 'REPORT_GENERATE']);
