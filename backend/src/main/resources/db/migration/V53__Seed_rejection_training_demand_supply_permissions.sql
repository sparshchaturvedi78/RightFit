-- V53__Seed_rejection_training_demand_supply_permissions.sql
-- Rejection Management (BRD 28), Training Management (BRD 29), Demand & Supply Analytics (BRD 27) -
-- all three are RMG Workforce Intelligence responsibilities the Pool/Bench phase didn't cover.

INSERT INTO permissions (name, description, resource, action, scope, is_system, is_active) VALUES
('REJECTION_READ', 'Review rejected candidates and repeated-rejection patterns', 'REJECTION', 'READ', 'GLOBAL', true, true),
('TRAINING_READ', 'View training programs and assignments', 'TRAINING', 'READ', 'GLOBAL', true, true),
('TRAINING_MANAGE', 'Create training programs and assign employees to them', 'TRAINING', 'MANAGE', 'GLOBAL', true, true),
('TRAINING_READ_OWN', 'View my own training assignments', 'TRAINING', 'READ_OWN', 'GLOBAL', true, true),
('DEMAND_SUPPLY_READ', 'View skill demand vs. supply analytics', 'DEMAND_SUPPLY', 'READ', 'GLOBAL', true, true)
ON CONFLICT (name) DO NOTHING;
