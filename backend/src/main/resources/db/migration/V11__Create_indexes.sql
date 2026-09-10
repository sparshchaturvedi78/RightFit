-- V11__Create_indexes.sql
-- Performance Indexes for Query Optimization

-- USERS Table Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_employee_id ON users(employee_id);

-- EMPLOYEES Table Indexes
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_rmg_id ON employees(rmg_id);
CREATE INDEX idx_employees_allocation_status ON employees(allocation_status);
CREATE INDEX idx_employees_availability_status ON employees(availability_status);
CREATE INDEX idx_employees_user_id ON employees(user_id);

-- SKILLS Table Indexes
CREATE INDEX idx_skills_name ON skills(skill_name);
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_employee_skills_employee ON employee_skills(employee_id);
CREATE INDEX idx_employee_skills_skill ON employee_skills(skill_id);
CREATE INDEX idx_employee_skills_proficiency ON employee_skills(proficiency_level);

-- CERTIFICATIONS Table Indexes
CREATE INDEX idx_certifications_name ON certifications(certification_name);
CREATE INDEX idx_employee_certs_employee ON employee_certifications(employee_id);
CREATE INDEX idx_employee_certs_cert ON employee_certifications(certification_id);
CREATE INDEX idx_employee_certs_valid ON employee_certifications(is_valid);

-- PROJECTS Table Indexes
CREATE INDEX idx_projects_project_id ON projects(project_id);
CREATE INDEX idx_projects_manager_id ON projects(manager_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_employee ON project_members(employee_id);

-- PROJECT_REQUIREMENTS Indexes
CREATE INDEX idx_proj_req_project ON project_requirements(project_id);
CREATE INDEX idx_proj_req_status ON project_requirements(status);
CREATE INDEX idx_proj_req_priority ON project_requirements(priority);
CREATE INDEX idx_proj_req_requirement_id ON project_requirements(requirement_id);

-- CANDIDATE_APPLICATIONS Indexes
CREATE INDEX idx_candidate_app_requirement ON candidate_applications(requirement_id);
CREATE INDEX idx_candidate_app_employee ON candidate_applications(employee_id);
CREATE INDEX idx_candidate_app_status ON candidate_applications(application_status);

-- INVITATIONS Indexes
CREATE INDEX idx_invitations_employee ON invitations(employee_id);
CREATE INDEX idx_invitations_requirement ON invitations(requirement_id);
CREATE INDEX idx_invitations_status ON invitations(invitation_status);

-- INTERVIEWS Indexes
CREATE INDEX idx_interviews_employee ON interviews(employee_id);
CREATE INDEX idx_interviews_requirement ON interviews(requirement_id);
CREATE INDEX idx_interviews_status ON interviews(interview_status);
CREATE INDEX idx_interviews_interviewer ON interviews(interviewer_id);
CREATE INDEX idx_interviews_scheduled_date ON interviews(scheduled_date);

-- SKILLS AND PREFERENCES Indexes
CREATE INDEX idx_emp_prefs_employee ON employee_preferences(employee_id);
CREATE INDEX idx_emp_avail_employee ON employee_availability(employee_id);
CREATE INDEX idx_emp_avail_status ON employee_availability(availability_status);

-- RESOURCE POOL Indexes
CREATE INDEX idx_resource_pool_employee ON resource_pool_entries(employee_id);
CREATE INDEX idx_resource_pool_is_current ON resource_pool_entries(is_current);
CREATE INDEX idx_resource_pool_entry_date ON resource_pool_entries(entry_date);

-- BENCH HISTORY Indexes
CREATE INDEX idx_bench_history_employee ON bench_history(employee_id);
CREATE INDEX idx_bench_history_status ON bench_history(bench_status);
CREATE INDEX idx_bench_history_is_current ON bench_history(is_current);

-- TRAINING Indexes
CREATE INDEX idx_training_assign_employee ON training_assignments(employee_id);
CREATE INDEX idx_training_assign_program ON training_assignments(training_program_id);
CREATE INDEX idx_training_programs_active ON training_programs(is_active);

-- USER ROLES Indexes
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
