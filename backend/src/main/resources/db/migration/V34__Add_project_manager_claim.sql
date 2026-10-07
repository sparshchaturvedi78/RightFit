-- V34__Add_project_manager_claim.sql
-- Manager Phase 1: BRD 6.2 project claim/verify flow (FR-008)

ALTER TABLE projects
    ADD COLUMN manager_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN claimed_at TIMESTAMP;

CREATE INDEX idx_projects_manager_claimed ON projects(manager_id, manager_claimed);
