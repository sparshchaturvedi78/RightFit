-- V54__Assign_rejection_training_demand_supply_permissions.sql
-- Rejection review, training management and demand/supply analytics are RMG responsibilities
-- (BRD 27-29); Admin gets the same read/manage access it has everywhere else. TRAINING_READ_OWN is
-- self-service, so it goes to all four roles like every other self-service permission.

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

SELECT pg_temp.grant_permissions('RMG', ARRAY['REJECTION_READ', 'TRAINING_READ', 'TRAINING_MANAGE', 'DEMAND_SUPPLY_READ']);
SELECT pg_temp.grant_permissions('ADMIN', ARRAY['REJECTION_READ', 'TRAINING_READ', 'TRAINING_MANAGE', 'DEMAND_SUPPLY_READ']);

SELECT pg_temp.grant_permissions('ADMIN', ARRAY['TRAINING_READ_OWN']);
SELECT pg_temp.grant_permissions('MANAGER', ARRAY['TRAINING_READ_OWN']);
SELECT pg_temp.grant_permissions('RMG', ARRAY['TRAINING_READ_OWN']);
SELECT pg_temp.grant_permissions('ASSOCIATE', ARRAY['TRAINING_READ_OWN']);
