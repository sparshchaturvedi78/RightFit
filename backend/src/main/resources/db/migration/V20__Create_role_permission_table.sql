-- V20__Create_role_permission_table.sql
-- Create RolePermission join table for mapping roles to permissions

CREATE TABLE role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permission_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permission_permission_id ON role_permissions(permission_id);
