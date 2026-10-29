-- V64__Candidate_source_self_applied.sql
-- Associates can apply to an open requirement themselves (CandidateService.selfApply), which stores
-- source = 'SELF_APPLIED'. V39 only allowed MANAGER, SOURCER, RMG_RECOMMENDATION and ADMIN, so every
-- self-apply failed with chk_candidate_source.

ALTER TABLE candidate_applications DROP CONSTRAINT IF EXISTS chk_candidate_source;
ALTER TABLE candidate_applications ADD CONSTRAINT chk_candidate_source
    CHECK (source IN ('MANAGER', 'SOURCER', 'RMG_RECOMMENDATION', 'ADMIN', 'SELF_APPLIED'));
