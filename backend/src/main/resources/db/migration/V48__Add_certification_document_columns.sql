-- V48__Add_certification_document_columns.sql
-- Associate Phase: optional uploaded-certificate file per employee certification. Title/issuer/
-- description already live on the shared certifications catalog (V3) and are never duplicated here -
-- only the file metadata is genuinely per-employee.

ALTER TABLE employee_certifications
    ADD COLUMN file_name VARCHAR(255),
    ADD COLUMN storage_key VARCHAR(500),
    ADD COLUMN content_type VARCHAR(100),
    ADD COLUMN file_size BIGINT;
