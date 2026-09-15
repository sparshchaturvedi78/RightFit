-- V29__Change_employees_employee_id_to_string.sql
-- Change employees.employee_id from BIGINT to VARCHAR to support business-facing string employee IDs

-- First, cast employees.employee_id to text and prepend 'EMP' for matching with users.employee_id
-- The users table already has string IDs from V28, so we need to match those

-- Create a temporary column to hold the string employee IDs
ALTER TABLE employees ADD COLUMN employee_id_temp VARCHAR(50);

-- For existing employees, generate string IDs from their numeric ID
-- This should match what was set in users.employee_id by V28
UPDATE employees
SET employee_id_temp = COALESCE(
  (SELECT u.employee_id FROM users u WHERE u.id = employees.user_id),
  'EMP' || LPAD(CAST(id AS TEXT), 3, '0')
);

-- Drop the old numeric column and the FK that references it
ALTER TABLE users DROP CONSTRAINT users_employee_id_fkey;
ALTER TABLE employees DROP COLUMN employee_id;

-- Rename the temporary column to employee_id
ALTER TABLE employees RENAME COLUMN employee_id_temp TO employee_id;

-- Set NOT NULL and UNIQUE constraints
ALTER TABLE employees ALTER COLUMN employee_id SET NOT NULL;
ALTER TABLE employees ADD CONSTRAINT employees_employee_id_unique UNIQUE (employee_id);

-- Re-add the foreign key from users to employees
ALTER TABLE users ADD CONSTRAINT users_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE;
