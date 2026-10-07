-- V32__Fix_employees_id_sequence.sql
-- V12 seeds employees with explicit id values, which does not advance the
-- BIGSERIAL sequence. Subsequent application inserts then collide with the
-- seeded ids. Sync the sequence to the current max id.

SELECT setval('employees_id_seq', (SELECT COALESCE(MAX(id), 1) FROM employees));
