-- V18__Enhance_role_table_for_rbac.sql
-- Enhance Role table with system role protection and role type

ALTER TABLE roles
ADD COLUMN IF NOT EXISTS role_type VARCHAR(50) NOT NULL DEFAULT 'CUSTOM',
ADD COLUMN IF NOT EXISTS is_modifiable BOOLEAN NOT NULL DEFAULT true;

-- Update existing roles as SYSTEM roles
UPDATE roles SET role_type = 'SYSTEM', is_modifiable = false
WHERE name IN ('ADMIN', 'MANAGER', 'RMG', 'ASSOCIATE');

-- Ensure other roles are marked as CUSTOM
UPDATE roles SET role_type = 'CUSTOM', is_modifiable = true
WHERE role_type = 'CUSTOM' OR (name NOT IN ('ADMIN', 'MANAGER', 'RMG', 'ASSOCIATE'));
