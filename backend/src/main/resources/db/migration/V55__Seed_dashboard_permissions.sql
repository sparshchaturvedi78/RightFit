-- V55__Seed_dashboard_permissions.sql
-- Admin/RMG/Associate dashboards (BRD 42), matching the resource/action style MANAGER_DASHBOARD_READ
-- already uses (V42).

INSERT INTO permissions (name, description, resource, action, scope, is_system, is_active) VALUES
('ADMIN_DASHBOARD_READ', 'View the Admin dashboard', 'DASHBOARD', 'ADMIN_READ', 'GLOBAL', true, true),
('RMG_DASHBOARD_READ', 'View the RMG dashboard', 'DASHBOARD', 'RMG_READ', 'GLOBAL', true, true),
('ASSOCIATE_DASHBOARD_READ', 'View my own Associate dashboard', 'DASHBOARD', 'ASSOCIATE_READ', 'GLOBAL', true, true)
ON CONFLICT (name) DO NOTHING;
