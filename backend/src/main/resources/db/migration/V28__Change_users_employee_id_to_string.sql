-- V28__Change_users_employee_id_to_string.sql
-- Change users.employee_id from BIGINT to VARCHAR to support business-facing string employee IDs

-- Drop the existing foreign key constraint
ALTER TABLE users DROP CONSTRAINT users_employee_id_fkey;

-- Change the column type from BIGINT to VARCHAR(50)
ALTER TABLE users ALTER COLUMN employee_id TYPE VARCHAR(50);

-- Add the foreign key back, referencing the string employee_id column
ALTER TABLE users ADD CONSTRAINT users_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE;
