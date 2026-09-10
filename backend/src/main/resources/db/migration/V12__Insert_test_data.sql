-- V12__Insert_test_data.sql
-- Minimal Test Data for Development - Handles all FK dependencies properly

-- ============================================================================
-- DEPARTMENTS (uses default org from V0)
-- ============================================================================
INSERT INTO departments (organization_id, name, code, is_active)
SELECT 1, 'Engineering', 'ENG', TRUE
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE code = 'ENG')
UNION ALL
SELECT 1, 'Sales', 'SALES', TRUE
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE code = 'SALES')
UNION ALL
SELECT 1, 'Operations', 'OPS', TRUE
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE code = 'OPS')
UNION ALL
SELECT 1, 'HR', 'HR', TRUE
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE code = 'HR');

-- ============================================================================
-- LOCATIONS (uses default org from V0)
-- ============================================================================
INSERT INTO locations (organization_id, name, city, state, country, timezone, is_active)
SELECT 1, 'Bangalore', 'Bangalore', 'Karnataka', 'India', 'Asia/Kolkata', TRUE
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Bangalore')
UNION ALL
SELECT 1, 'Delhi', 'Delhi', 'Delhi', 'India', 'Asia/Kolkata', TRUE
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Delhi')
UNION ALL
SELECT 1, 'Pune', 'Pune', 'Maharashtra', 'India', 'Asia/Kolkata', TRUE
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Pune');

-- ============================================================================
-- EMPLOYEES (Core team)
-- ============================================================================
INSERT INTO employees (employee_id, first_name, last_name, email, phone, department_id, location_id,
                       designation, grade, domain, years_of_experience, date_of_joining,
                       employment_status, allocation_status, availability_status, pool_status, working_hours_per_day)
SELECT 'EMP001', 'Rajesh', 'Kumar', 'rajesh.kumar@techcorp.com', '+91-9876543210', 1, 1,
       'CTO', 'L5', 'Technology Leadership', 15.00, '2015-01-15'::DATE, 'ACTIVE', 'UNALLOCATED', 'AVAILABLE', 'NOT_IN_RESOURCE_POOL', 9.00
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = 'EMP001')
UNION ALL
SELECT 'EMP002', 'Priya', 'Sharma', 'priya.sharma@techcorp.com', '+91-9876543211', 1, 1,
       'Resource Manager', 'L4', 'Resource Management', 10.00, '2016-03-20'::DATE, 'ACTIVE', 'UNALLOCATED', 'AVAILABLE', 'NOT_IN_RESOURCE_POOL', 9.00
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = 'EMP002')
UNION ALL
SELECT 'EMP003', 'Amit', 'Patel', 'amit.patel@techcorp.com', '+91-9876543212', 1, 1,
       'Project Manager', 'L4', 'Project Management', 8.00, '2017-06-10'::DATE, 'ACTIVE', 'ALLOCATED', 'AVAILABLE', 'NOT_IN_RESOURCE_POOL', 9.00
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = 'EMP003')
UNION ALL
SELECT 'EMP004', 'Ananya', 'Singh', 'ananya.singh@techcorp.com', '+91-9876543213', 1, 1,
       'Senior Software Engineer', 'L3', 'Java/Spring', 7.00, '2018-02-01'::DATE, 'ACTIVE', 'ALLOCATED', 'AVAILABLE', 'NOT_IN_RESOURCE_POOL', 9.00
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = 'EMP004')
UNION ALL
SELECT 'EMP005', 'Vikram', 'Desai', 'vikram.desai@techcorp.com', '+91-9876543214', 1, 1,
       'Software Engineer', 'L2', 'Python/Django', 3.00, '2021-07-15'::DATE, 'ACTIVE', 'UNALLOCATED', 'AVAILABLE', 'IN_RESOURCE_POOL', 9.00
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = 'EMP005')
UNION ALL
SELECT 'EMP006', 'Sneha', 'Gupta', 'sneha.gupta@techcorp.com', '+91-9876543215', 1, 1,
       'Software Engineer', 'L2', 'React/JavaScript', 2.50, '2022-01-10'::DATE, 'ACTIVE', 'UNALLOCATED', 'AVAILABLE', 'IN_RESOURCE_POOL', 9.00
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = 'EMP006');

-- ============================================================================
-- USERS (for login)
-- ============================================================================
INSERT INTO users (employee_id, email, password_hash, is_active, status)
SELECT 1, 'rajesh.kumar@techcorp.com', '$2a$10$slYQmyNdGzSgNdrjPHIvHuC8qY0vPKzIFTm1yBLOLb2HQIoJ7Q5lS', TRUE, 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE employee_id = 1)
UNION ALL
SELECT 2, 'priya.sharma@techcorp.com', '$2a$10$slYQmyNdGzSgNdrjPHIvHuC8qY0vPKzIFTm1yBLOLb2HQIoJ7Q5lS', TRUE, 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE employee_id = 2)
UNION ALL
SELECT 3, 'amit.patel@techcorp.com', '$2a$10$slYQmyNdGzSgNdrjPHIvHuC8qY0vPKzIFTm1yBLOLb2HQIoJ7Q5lS', TRUE, 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE employee_id = 3)
UNION ALL
SELECT 4, 'ananya.singh@techcorp.com', '$2a$10$slYQmyNdGzSgNdrjPHIvHuC8qY0vPKzIFTm1yBLOLb2HQIoJ7Q5lS', TRUE, 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE employee_id = 4)
UNION ALL
SELECT 5, 'vikram.desai@techcorp.com', '$2a$10$slYQmyNdGzSgNdrjPHIvHuC8qY0vPKzIFTm1yBLOLb2HQIoJ7Q5lS', TRUE, 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE employee_id = 5)
UNION ALL
SELECT 6, 'sneha.gupta@techcorp.com', '$2a$10$slYQmyNdGzSgNdrjPHIvHuC8qY0vPKzIFTm1yBLOLb2HQIoJ7Q5lS', TRUE, 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE employee_id = 6);

-- ============================================================================
-- USER ROLES
-- ============================================================================
INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT 1, 1, CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = 1 AND role_id = 1)
UNION ALL
SELECT 2, 3, CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = 2 AND role_id = 3)
UNION ALL
SELECT 3, 2, CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = 3 AND role_id = 2)
UNION ALL
SELECT 4, 4, CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = 4 AND role_id = 4)
UNION ALL
SELECT 5, 4, CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = 5 AND role_id = 4)
UNION ALL
SELECT 6, 4, CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = 6 AND role_id = 4);

-- ============================================================================
-- SKILLS
-- ============================================================================
INSERT INTO skills (skill_name, category, description)
SELECT 'Java', 'BACKEND', 'Java programming' WHERE NOT EXISTS (SELECT 1 FROM skills WHERE skill_name = 'Java')
UNION ALL
SELECT 'Spring Boot', 'BACKEND', 'Spring Boot framework' WHERE NOT EXISTS (SELECT 1 FROM skills WHERE skill_name = 'Spring Boot')
UNION ALL
SELECT 'Python', 'BACKEND', 'Python programming' WHERE NOT EXISTS (SELECT 1 FROM skills WHERE skill_name = 'Python')
UNION ALL
SELECT 'Django', 'BACKEND', 'Django framework' WHERE NOT EXISTS (SELECT 1 FROM skills WHERE skill_name = 'Django')
UNION ALL
SELECT 'React', 'FRONTEND', 'React library' WHERE NOT EXISTS (SELECT 1 FROM skills WHERE skill_name = 'React')
UNION ALL
SELECT 'JavaScript', 'FRONTEND', 'JavaScript language' WHERE NOT EXISTS (SELECT 1 FROM skills WHERE skill_name = 'JavaScript')
UNION ALL
SELECT 'PostgreSQL', 'DATABASE', 'PostgreSQL database' WHERE NOT EXISTS (SELECT 1 FROM skills WHERE skill_name = 'PostgreSQL')
UNION ALL
SELECT 'Docker', 'DEVOPS', 'Docker containerization' WHERE NOT EXISTS (SELECT 1 FROM skills WHERE skill_name = 'Docker')
UNION ALL
SELECT 'Kubernetes', 'DEVOPS', 'Kubernetes orchestration' WHERE NOT EXISTS (SELECT 1 FROM skills WHERE skill_name = 'Kubernetes')
UNION ALL
SELECT 'AWS', 'CLOUD', 'Amazon Web Services' WHERE NOT EXISTS (SELECT 1 FROM skills WHERE skill_name = 'AWS');

-- ============================================================================
-- CERTIFICATIONS
-- ============================================================================
INSERT INTO certifications (certification_name, issuing_organization, description, valid_years)
SELECT 'AWS Solutions Architect', 'Amazon Web Services', 'AWS certification', 3 WHERE NOT EXISTS (SELECT 1 FROM certifications WHERE certification_name = 'AWS Solutions Architect')
UNION ALL
SELECT 'Oracle Java Programmer', 'Oracle', 'Java certification', 5 WHERE NOT EXISTS (SELECT 1 FROM certifications WHERE certification_name = 'Oracle Java Programmer')
UNION ALL
SELECT 'AWS Developer Associate', 'Amazon Web Services', 'AWS Dev cert', 3 WHERE NOT EXISTS (SELECT 1 FROM certifications WHERE certification_name = 'AWS Developer Associate');

-- ============================================================================
-- EMPLOYEE SKILLS
-- ============================================================================
INSERT INTO employee_skills (employee_id, skill_id, proficiency_level, years_of_experience)
SELECT emp.id, sk.id, 9, 8
FROM employees emp, skills sk
WHERE emp.employee_id = 'EMP003' AND sk.skill_name = 'Java'
AND NOT EXISTS (SELECT 1 FROM employee_skills WHERE employee_id = emp.id AND skill_id = sk.id)
UNION ALL
SELECT emp.id, sk.id, 8, 6
FROM employees emp, skills sk
WHERE emp.employee_id = 'EMP003' AND sk.skill_name = 'Spring Boot'
AND NOT EXISTS (SELECT 1 FROM employee_skills WHERE employee_id = emp.id AND skill_id = sk.id)
UNION ALL
SELECT emp.id, sk.id, 8, 7
FROM employees emp, skills sk
WHERE emp.employee_id = 'EMP004' AND sk.skill_name = 'Java'
AND NOT EXISTS (SELECT 1 FROM employee_skills WHERE employee_id = emp.id AND skill_id = sk.id)
UNION ALL
SELECT emp.id, sk.id, 8, 3
FROM employees emp, skills sk
WHERE emp.employee_id = 'EMP005' AND sk.skill_name = 'Python'
AND NOT EXISTS (SELECT 1 FROM employee_skills WHERE employee_id = emp.id AND skill_id = sk.id)
UNION ALL
SELECT emp.id, sk.id, 8, 2
FROM employees emp, skills sk
WHERE emp.employee_id = 'EMP006' AND sk.skill_name = 'React'
AND NOT EXISTS (SELECT 1 FROM employee_skills WHERE employee_id = emp.id AND skill_id = sk.id);

-- ============================================================================
-- EMPLOYEE CERTIFICATIONS
-- ============================================================================
INSERT INTO employee_certifications (employee_id, certification_id, obtained_date, expiry_date, is_valid)
SELECT emp.id, cert.id, '2022-03-15'::DATE, '2025-03-15'::DATE, TRUE
FROM employees emp, certifications cert
WHERE emp.employee_id = 'EMP003' AND cert.certification_name = 'AWS Solutions Architect'
AND NOT EXISTS (SELECT 1 FROM employee_certifications WHERE employee_id = emp.id AND certification_id = cert.id)
UNION ALL
SELECT emp.id, cert.id, '2023-08-20'::DATE, '2026-08-20'::DATE, TRUE
FROM employees emp, certifications cert
WHERE emp.employee_id = 'EMP004' AND cert.certification_name = 'AWS Developer Associate'
AND NOT EXISTS (SELECT 1 FROM employee_certifications WHERE employee_id = emp.id AND certification_id = cert.id);

-- ============================================================================
-- PROJECTS (with manager_id)
-- ============================================================================
INSERT INTO projects (project_id, project_name, description, client_name, status, manager_id, start_date, end_date)
SELECT 'PROJ001', 'FinTech Platform', 'Modern fintech platform', 'GlobalBank', 'ACTIVE', emp.id, '2024-01-15'::DATE, '2024-12-31'::DATE
FROM employees emp
WHERE emp.employee_id = 'EMP003'
AND NOT EXISTS (SELECT 1 FROM projects WHERE project_id = 'PROJ001')
UNION ALL
SELECT 'PROJ002', 'E-Commerce Platform', 'E-commerce system', 'ShopHub', 'ACTIVE', emp.id, '2024-03-01'::DATE, '2025-06-30'::DATE
FROM employees emp
WHERE emp.employee_id = 'EMP003'
AND NOT EXISTS (SELECT 1 FROM projects WHERE project_id = 'PROJ002');

-- ============================================================================
-- PROJECT MEMBERS
-- ============================================================================
INSERT INTO project_members (project_id, employee_id, role, joined_at)
SELECT proj.id, emp.id, 'Project Manager', CURRENT_TIMESTAMP
FROM projects proj, employees emp
WHERE proj.project_id = 'PROJ001' AND emp.employee_id = 'EMP003'
AND NOT EXISTS (SELECT 1 FROM project_members WHERE project_id = proj.id AND employee_id = emp.id)
UNION ALL
SELECT proj.id, emp.id, 'Developer', CURRENT_TIMESTAMP
FROM projects proj, employees emp
WHERE proj.project_id = 'PROJ001' AND emp.employee_id = 'EMP004'
AND NOT EXISTS (SELECT 1 FROM project_members WHERE project_id = proj.id AND employee_id = emp.id)
UNION ALL
SELECT proj.id, emp.id, 'Project Manager', CURRENT_TIMESTAMP
FROM projects proj, employees emp
WHERE proj.project_id = 'PROJ002' AND emp.employee_id = 'EMP003'
AND NOT EXISTS (SELECT 1 FROM project_members WHERE project_id = proj.id AND employee_id = emp.id);

-- ============================================================================
-- PROJECT REQUIREMENTS
-- ============================================================================
INSERT INTO project_requirements (requirement_id, project_id, position_title, description, min_experience, max_experience, priority, status, allocation_start_date)
SELECT 'REQ001', proj.id, 'Senior Java Developer', 'Experienced Java developer', 5, 10, 'HIGH', 'PUBLISHED', '2024-10-01'::DATE
FROM projects proj
WHERE proj.project_id = 'PROJ001'
AND NOT EXISTS (SELECT 1 FROM project_requirements WHERE requirement_id = 'REQ001')
UNION ALL
SELECT 'REQ002', proj.id, 'Python Backend Developer', 'Python developer', 3, 6, 'MEDIUM', 'PUBLISHED', '2024-10-15'::DATE
FROM projects proj
WHERE proj.project_id = 'PROJ002'
AND NOT EXISTS (SELECT 1 FROM project_requirements WHERE requirement_id = 'REQ002');

-- ============================================================================
-- EMPLOYEE PREFERENCES & AVAILABILITY
-- ============================================================================
INSERT INTO employee_preferences (employee_id, preferred_technology, preferred_domain, preferred_work_mode)
SELECT emp.id, 'Java, Spring Boot', 'Banking', 'Remote'
FROM employees emp
WHERE emp.employee_id = 'EMP003'
AND NOT EXISTS (SELECT 1 FROM employee_preferences WHERE employee_id = emp.id)
UNION ALL
SELECT emp.id, 'Python, Django', 'E-commerce', 'Remote'
FROM employees emp
WHERE emp.employee_id = 'EMP005'
AND NOT EXISTS (SELECT 1 FROM employee_preferences WHERE employee_id = emp.id);

INSERT INTO employee_availability (employee_id, availability_status, verification_status)
SELECT emp.id, 'AVAILABLE', 'NOT_REQUIRED'
FROM employees emp
WHERE emp.employee_id IN ('EMP003', 'EMP004', 'EMP005', 'EMP006')
AND NOT EXISTS (SELECT 1 FROM employee_availability WHERE employee_id = emp.id);

-- ============================================================================
-- RESOURCE POOL & BENCH
-- ============================================================================
INSERT INTO resource_pool_entries (employee_id, entry_date, entry_reason, is_current)
SELECT emp.id, (CURRENT_TIMESTAMP - INTERVAL '30 days')::DATE, 'ALLOCATION_END', TRUE
FROM employees emp
WHERE emp.employee_id IN ('EMP005', 'EMP006')
AND NOT EXISTS (SELECT 1 FROM resource_pool_entries WHERE employee_id = emp.id);

INSERT INTO bench_history (employee_id, bench_start_date, bench_status, is_current)
SELECT emp.id, (CURRENT_DATE - INTERVAL '30 days')::DATE, 'GREEN', TRUE
FROM employees emp
WHERE emp.employee_id IN ('EMP005', 'EMP006')
AND NOT EXISTS (SELECT 1 FROM bench_history WHERE employee_id = emp.id);

-- ============================================================================
-- BENCH CONFIGURATION
-- ============================================================================
INSERT INTO bench_configuration (organization_id, green_max_days, amber_max_days, red_threshold_days, effective_from, is_active)
SELECT 1, 90, 120, 120, '2024-01-01'::DATE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM bench_configuration WHERE organization_id = 1);

-- ============================================================================
-- ALLOCATION CAPACITY RULES
-- ============================================================================
INSERT INTO allocation_capacity_rules (organization_id, working_hours_per_day, working_hours_per_week, effective_from, is_active)
SELECT 1, 9.00, 45.00, '2024-01-01'::DATE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM allocation_capacity_rules WHERE organization_id = 1);
