-- V62__Interview_held_at.sql
-- The interviewer (or coordinator) marks an interview as held once it has taken place; that opens its feedback.
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS held_at TIMESTAMP NULL;
