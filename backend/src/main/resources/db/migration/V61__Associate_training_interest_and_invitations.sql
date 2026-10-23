-- V61__Associate_training_interest_and_invitations.sql
-- 1. An associate can ask to join a training (REQUESTED); their RMG approves it (ASSIGNED) or turns it down (DECLINED).
-- 2. Anyone holding the COORDINATOR responsibility can send invitations, so associates need INVITATION_SEND / INVITATION_READ.
--    The service still checks the responsibility on the requirement (RequirementAccessGuard.assertCanCoordinate).

ALTER TABLE training_assignments DROP CONSTRAINT IF EXISTS chk_assign_status;
ALTER TABLE training_assignments ADD CONSTRAINT chk_assign_status
    CHECK (assignment_status IN ('REQUESTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DEFERRED', 'DECLINED'));

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

SELECT pg_temp.grant_permissions('ASSOCIATE', ARRAY['INVITATION_SEND', 'INVITATION_READ']);
