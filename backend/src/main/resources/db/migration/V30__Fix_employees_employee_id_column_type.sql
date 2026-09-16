-- V30__Fix_employees_employee_id_column_type.sql
-- Explicitly verify and fix the employees.employee_id column type

-- Check current column type and fix if needed
ALTER TABLE employees
ALTER COLUMN employee_id TYPE VARCHAR(50) USING employee_id::text;

-- Ensure NOT NULL constraint
ALTER TABLE employees
ALTER COLUMN employee_id SET NOT NULL;
