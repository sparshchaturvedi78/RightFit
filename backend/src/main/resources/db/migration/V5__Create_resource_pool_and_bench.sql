-- V5__Create_resource_pool_and_bench.sql
-- Resource Pool and Bench Monitoring

-- Create RESOURCE_POOL_ENTRIES table
-- Historical tracking of when employees enter/exit resource pool
CREATE TABLE resource_pool_entries (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    entry_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exit_date TIMESTAMP,
    entry_reason VARCHAR(50),
    exit_reason VARCHAR(50),
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_entry_reason CHECK (entry_reason IN ('ALLOCATION_END', 'RELEASE', 'AVAILABILITY_RESTORED', 'MANUAL_ENTRY', NULL)),
    CONSTRAINT chk_exit_reason CHECK (exit_reason IN ('ALLOCATION_START', 'UNAVAILABLE', 'INACTIVE', 'COMPANY_EXIT', NULL))
);

-- Create BENCH_HISTORY table
-- Historical tracking of bench periods
CREATE TABLE bench_history (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    bench_start_date DATE NOT NULL,
    bench_end_date DATE,
    days_on_bench INT,
    paused_days INT DEFAULT 0,
    bench_status VARCHAR(20) NOT NULL DEFAULT 'GREEN',
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_bench_status CHECK (bench_status IN ('GREEN', 'AMBER', 'RED')),
    CONSTRAINT chk_days_on_bench CHECK (days_on_bench >= 0)
);

-- Create BENCH_CONFIGURATION table
-- Organization-specific bench status configuration
CREATE TABLE bench_configuration (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    green_max_days INT NOT NULL,
    amber_max_days INT NOT NULL,
    red_threshold_days INT NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
