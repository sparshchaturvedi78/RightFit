-- V52__Add_training_business_id_sequences.sql
-- Training Management: training_programs.program_id and training_assignments.assignment_id already
-- exist as unique VARCHAR columns (V9) but were never given a generator, matching the pattern used by
-- every other operational entity added since (requirements, candidates, invitations, interviews,
-- allocations, rejections).

CREATE SEQUENCE IF NOT EXISTS training_program_business_id_seq START WITH 1001 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS training_assignment_business_id_seq START WITH 1001 INCREMENT BY 1;
