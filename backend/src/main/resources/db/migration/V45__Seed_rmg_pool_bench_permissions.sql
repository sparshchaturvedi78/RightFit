-- V45__Seed_rmg_pool_bench_permissions.sql
-- RMG Phase: Resource Pool & Bench governance permissions (BRD 22, 7.1).
-- Pool/bench entry, exit and aging-pause themselves are already automatic (allocation and
-- availability events); these permissions only gate the new read/governance endpoints.

INSERT INTO permissions (name, description, resource, action, scope, is_system, is_active) VALUES
('POOL_READ', 'View the Resource Pool', 'POOL', 'READ', 'GLOBAL', true, true),
('BENCH_READ', 'View bench status and bench threshold configuration', 'BENCH', 'READ', 'GLOBAL', true, true),
('BENCH_CONFIGURATION_MANAGE', 'Set the bench threshold policy (Admin only)', 'BENCH_CONFIGURATION', 'MANAGE', 'GLOBAL', true, true)
ON CONFLICT (name) DO NOTHING;
