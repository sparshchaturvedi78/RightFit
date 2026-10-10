-- V47__Add_bench_pause_marker_and_catalog_retirement.sql
-- Associate Phase: bench_history.paused_days (from the RMG phase) has no marker for when a pause
-- started, so there's no way to compute elapsed pause length when someone is restored - this adds it.
-- Also adds retirement (is_active) to the skill/certification catalogs, replacing hard delete.

ALTER TABLE bench_history ADD COLUMN pause_started_at TIMESTAMP;

ALTER TABLE skills ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE certifications ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- An employee withdrawing their own still-pending unavailability request is not the same thing as
-- RMG rejecting it - conflating the two would corrupt the RMG's own decision history.
ALTER TABLE employee_availability DROP CONSTRAINT chk_verification_status;
ALTER TABLE employee_availability ADD CONSTRAINT chk_verification_status
    CHECK (verification_status IN ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'));
