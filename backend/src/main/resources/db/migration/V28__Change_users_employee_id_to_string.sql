-- V28__Change_users_employee_id_to_string.sql
-- Change users.employee_id from BIGINT to VARCHAR to support business-facing string employee IDs

-- Drop the existing foreign key constraint
ALTER TABLE users DROP CONSTRAINT users_employee_id_fkey;

-- Create a temporary column to hold the string employee IDs
ALTER TABLE users ADD COLUMN employee_id_temp VARCHAR(50);

-- Update the temporary column with string employee IDs from the employees table
UPDATE users u
SET employee_id_temp = e.employee_id
FROM employees e
WHERE u.employee_id = e.id;

-- Drop the old numeric column
ALTER TABLE users DROP COLUMN employee_id;

-- Rename the temporary column to employee_id
ALTER TABLE users RENAME COLUMN employee_id_temp TO employee_id;

-- Set NOT NULL constraint
ALTER TABLE users ALTER COLUMN employee_id SET NOT NULL;

-- Add the unique constraint
ALTER TABLE users ADD CONSTRAINT users_employee_id_unique UNIQUE (employee_id);

-- Add the foreign key back, referencing the string employee_id column
ALTER TABLE users ADD CONSTRAINT users_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE;
