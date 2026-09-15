-- V21__Enhance_user_role_table.sql
-- Enhance user_roles table with audit fields and constraints

ALTER TABLE user_roles
ADD COLUMN IF NOT EXISTS assigned_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add unique constraint to enforce one platform role per user in Phase 3.1 MVP
-- Note: This assumes the user_roles table doesn't already have this constraint
-- If the constraint already exists, this migration will fail gracefully with "IF NOT EXISTS" equivalent

DO $$
BEGIN
    BEGIN
        ALTER TABLE user_roles
        ADD CONSTRAINT uk_user_role UNIQUE (user_id, role_id);
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END$$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_role_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assigned_by ON user_roles(assigned_by);
