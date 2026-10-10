-- V43__Assign_manager_workflow_permissions.sql
-- Role grants that encode the BRD 39 access-control summary.
-- Ownership / responsibility checks (Level 2 and 3) are enforced in the service layer on top of these.
--   MANAGER   : everything in the Manager journey, but NOT recommend / allocation approval.
--   ADMIN     : "Authorized" rows only; NOT final decision, allocation request, allocation approval, invitation send.
--   RMG       : search, recommend, contact, allocation review. NOT shortlist, interview, decision.
--   ASSOCIATE : responsibility-gated sourcing/interviewing (service checks the assignment) + own responses.

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

SELECT pg_temp.grant_permissions('MANAGER', ARRAY[
    'CANDIDATE_SEARCH', 'CANDIDATE_READ', 'CANDIDATE_SHORTLIST', 'CANDIDATE_CONTACT', 'CANDIDATE_DECISION',
    'INVITATION_SEND', 'INVITATION_READ', 'INVITATION_RESPOND',
    'INTERVIEW_SCHEDULE', 'INTERVIEW_CONDUCT', 'INTERVIEW_READ', 'INTERVIEW_RESPOND',
    'ALLOCATION_REQUEST_CREATE', 'ALLOCATION_REQUEST_READ',
    'TEAM_READ', 'TEAM_MANAGE', 'ALLOCATION_MANAGE',
    'PROJECT_LOOKUP', 'NOTIFICATION_READ_OWN', 'MANAGER_DASHBOARD_READ']);

SELECT pg_temp.grant_permissions('ADMIN', ARRAY[
    'CANDIDATE_SEARCH', 'CANDIDATE_READ', 'CANDIDATE_SHORTLIST', 'CANDIDATE_CONTACT',
    'INVITATION_READ',
    'INTERVIEW_SCHEDULE', 'INTERVIEW_CONDUCT', 'INTERVIEW_READ',
    'ALLOCATION_REQUEST_READ',
    'TEAM_READ', 'TEAM_MANAGE', 'ALLOCATION_MANAGE',
    'PROJECT_LOOKUP', 'NOTIFICATION_READ_OWN', 'MANAGER_DASHBOARD_READ']);

SELECT pg_temp.grant_permissions('RMG', ARRAY[
    'CANDIDATE_SEARCH', 'CANDIDATE_RECOMMEND', 'CANDIDATE_CONTACT',
    'ALLOCATION_REQUEST_READ', 'ALLOCATION_REQUEST_APPROVE',
    'PROJECT_LOOKUP', 'NOTIFICATION_READ_OWN']);

SELECT pg_temp.grant_permissions('ASSOCIATE', ARRAY[
    'REQUIREMENT_READ',
    'CANDIDATE_SEARCH', 'CANDIDATE_READ', 'CANDIDATE_SHORTLIST',
    'INTERVIEW_SCHEDULE', 'INTERVIEW_CONDUCT', 'INTERVIEW_READ',
    'INVITATION_RESPOND', 'INTERVIEW_RESPOND', 'PROJECT_LOOKUP', 'NOTIFICATION_READ_OWN']);
