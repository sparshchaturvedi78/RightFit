-- V66__Project_manager_optional.sql
-- A project can exist without a manager until one is named. Projects without a manager are visible to admins only.

ALTER TABLE projects ALTER COLUMN manager_id DROP NOT NULL;
