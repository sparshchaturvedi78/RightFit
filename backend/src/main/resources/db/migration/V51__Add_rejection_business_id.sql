-- V51__Add_rejection_business_id.sql
-- Rejection Management: the rejections table (V9) was never given a business-string id, unlike every
-- other business object in this codebase (REQ-1001, CAND-1001, ALC-1001...). Adding one for consistency
-- before this table gets its first real writer.

ALTER TABLE rejections ADD COLUMN rejection_id VARCHAR(50) UNIQUE;
CREATE SEQUENCE IF NOT EXISTS rejection_business_id_seq START WITH 1001 INCREMENT BY 1;
