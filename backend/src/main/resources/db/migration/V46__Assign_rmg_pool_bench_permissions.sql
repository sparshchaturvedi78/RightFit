-- V46__Assign_rmg_pool_bench_permissions.sql
-- RMG and Admin can both view the Resource Pool and Bench; only Admin sets the threshold policy
-- (a proposed decision, not a BRD-mandated split - see RMG_PHASE_GUIDE.md open questions).

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

SELECT pg_temp.grant_permissions('RMG', ARRAY['POOL_READ', 'BENCH_READ']);
SELECT pg_temp.grant_permissions('ADMIN', ARRAY['POOL_READ', 'BENCH_READ', 'BENCH_CONFIGURATION_MANAGE']);
