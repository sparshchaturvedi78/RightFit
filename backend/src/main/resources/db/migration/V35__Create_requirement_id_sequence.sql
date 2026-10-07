-- V35__Create_requirement_id_sequence.sql
-- Manager Phase 2: server-generated Requirement IDs (REQ-1001, REQ-1002, ...)

CREATE SEQUENCE IF NOT EXISTS requirement_business_id_seq START WITH 1001 INCREMENT BY 1;
