# RBAC Implementation Plan - Phase 3.1
## Admin Role & RBAC Foundation | Revised per Architecture Review

---

## PHASE 3.1: ADMIN & RBAC FOUNDATION

### Block 0: PREREQUISITE - Confirm Domain & Authentication Integration (Days 0-0.5)

**Objective**: Establish integration points before implementing RBAC.

**DoD**: 
- [ ] Confirm existing UserAccount / Employee relationship
- [ ] Confirm how authentication resolves roles (JWT vs database fetch)
- [ ] Confirm JWT token strategy (roles embedded vs fetched on each request)
- [ ] Confirm permission cache invalidation for multi-instance deployment
- [ ] Confirm existing Role entity model
- [ ] Confirm no breaking changes needed in authentication flow
- [ ] Document any assumptions in RBAC_INTEGRATION_NOTES.md

**Owner**: Architecture/Lead

---

### Block 1: Common API Foundation & Exceptions (Days 1-2)

**Objective**: Establish reusable standards before implementing business APIs.

**Deliverables**:
- [ ] DTO validation framework
- [ ] Standard error response format
- [ ] Custom business exceptions:
  - [ ] PermissionDeniedException
  - [ ] InsufficientPrivilegesException
  - [ ] SystemRoleModificationException
  - [ ] InvalidRoleAssignmentException
  - [ ] LastAdminException
  - [ ] DuplicateEntityException
- [ ] Global exception handler
- [ ] Pagination/filtering standards
- [ ] Transaction & rollback handling
- [ ] Validation annotations

**DoD**: All later business APIs use consistent standards, validation, and error handling.

---

### Block 2: Core RBAC Database Schema (Days 2-4)

**Objective**: Create foundation for permission-based authorization.

**Deliverables**:
- [ ] Permission entity
  - [ ] id, name (UNIQUE), description, resource, action, scope
  - [ ] is_system, is_active flags
  - [ ] created_at, updated_at
  
- [ ] Enhance Role entity
  - [ ] Add role_type (SYSTEM, CUSTOM)
  - [ ] Add is_modifiable flag
  - [ ] Add description
  - [ ] Protect system roles
  
- [ ] RolePermission join entity
  - [ ] role_id, permission_id
  - [ ] UNIQUE constraint
  - [ ] created_at
  
- [ ] Enhance UserRole entity
  - [ ] Add assigned_by field
  - [ ] Add is_active flag
  - [ ] Add UNIQUE(user_id, role_id) constraint
  - [ ] Indexes for user_id, role_id
  
- [ ] AuditLog entity
  - [ ] user_id, action, entity_type, entity_id
  - [ ] before_state, after_state (JSON)
  - [ ] timestamp, ip_address, user_agent
  - [ ] Indexes for queries

**Migrations**:
- [ ] V18__Create_permission_table.sql
- [ ] V19__Create_role_permission_table.sql
- [ ] V20__Enhance_role_table.sql (add type, modifiable, description)
- [ ] V21__Enhance_user_role_table.sql (add assigned_by, is_active)
- [ ] V22__Create_audit_log_table.sql
- [ ] V23__Seed_system_permissions.sql (all 28 Phase 3.1 permissions)
- [ ] V24__Seed_system_roles.sql (ADMIN, MANAGER, RMG, ASSOCIATE)
- [ ] V25__Seed_system_role_permissions.sql (assign permissions to ADMIN role)
- [ ] V26__Protect_system_roles.sql (set is_modifiable=false)

**DoD**: All RBAC entities created with proper constraints, indexes, and system data seeded.

---

### Block 3: Repositories & Base Services (Days 4-5)

**Objective**: Data access layer for RBAC entities.

**Deliverables**:
- [ ] PermissionRepository (JpaRepository)
  - [ ] findByName, findByResource, findByActive
  - [ ] findAll with caching
  
- [ ] RolePermissionRepository
  - [ ] findByRoleId, findByPermissionId
  - [ ] deleteByRoleIdAndPermissionId
  
- [ ] UserRoleRepository
  - [ ] findByUserId (active only)
  - [ ] findByRoleId
  - [ ] findByUserIdAndRoleId
  - [ ] deleteByUserIdAndRoleId
  
- [ ] AuditLogRepository
  - [ ] findByUserId, findByEntityType, findByAction
  - [ ] findByTimestampBetween
  - [ ] Custom query: complex audit filtering
  
- [ ] BaseService utilities
  - [ ] Timestamp management
  - [ ] Common validation
  - [ ] Exception handling

**DoD**: All repositories implement required queries, tested with mock data.

---

### Block 4: Authorization Engine & Spring Security Integration (Days 5-7)

**Objective**: Core authorization without business logic dependencies.

**Deliverables**:
- [ ] PermissionEvaluator (Spring Security)
  - [ ] Check if user has permission
  - [ ] Support contextual parameters (projectId, employeeId)
  - [ ] Handle null/invalid permissions gracefully
  
- [ ] PermissionCache
  - [ ] In-memory cache of permissions by role
  - [ ] Cache invalidation strategy
  - [ ] TTL and refresh on change
  - [ ] Multi-instance safe (event-driven or polling)
  
- [ ] SecurityContextUtil
  - [ ] getCurrentUser()
  - [ ] getCurrentUserRoles()
  - [ ] getCurrentUserPermissions()
  - [ ] hasPermission(permission)
  - [ ] hasAnyPermission(permissions)
  
- [ ] @PreAuthorize Integration
  - [ ] Custom SpEL functions: @authz.hasPermission('EMPLOYEE_CREATE')
  - [ ] Contextual checks: @authz.canManageProject(#projectId)
  - [ ] Role checks: @authz.hasRole('ADMIN')
  
- [ ] AuthorizationAspect (optional logging)
  - [ ] Log permission checks (debug level)
  - [ ] Log authorization denials (warn level)
  
- [ ] PermissionCheckUtil
  - [ ] Manual permission checks for complex logic
  - [ ] Explicit authorization gates
  
- [ ] Spring Security Configuration
  - [ ] Enable @PreAuthorize
  - [ ] Register PermissionEvaluator
  - [ ] Configure authorization manager

**Testing**:
- [ ] Unit: PermissionEvaluator logic
- [ ] Unit: Cache invalidation
- [ ] Integration: Spring Security + @PreAuthorize
- [ ] Integration: Contextual authorization

**DoD**: Authorization works independently. No unauthorized access. Permissions evaluated consistently.

---

### Block 5: Audit Infrastructure (Platform-Wide) (Days 7-8)

**Objective**: Reusable audit mechanism for entire platform (not just Admin).

**Deliverables**:
- [ ] AuditService
  - [ ] logAction(actor, action, entityType, entityId, before, after) - SYNCHRONOUS for critical ops
  - [ ] logActionWithoutBefore(actor, action, entityType, entityId, after)
  - [ ] logActionWithReason(actor, action, entityType, entityId, before, after, reason)
  - [ ] Capture request context (IP, user agent)
  - [ ] **Synchronous persistence for critical operations**:
    - [ ] Employee deactivation
    - [ ] Project closure
    - [ ] Manager replacement
    - [ ] RMG replacement
    - [ ] Role assignment
    - [ ] Admin promotion
  - [ ] **Audit persists in SAME transaction as business operation**
  - [ ] **If audit fails, entire transaction rolls back (no orphaned changes)**
  
- [ ] @Auditable Annotation (Optional, for non-critical ops only)
  - [ ] Mark methods for automatic audit logging
  - [ ] Capture before/after state
  - [ ] Support for parameters
  - [ ] Use ONLY for non-critical operations (view, search, etc.)
  
- [ ] AuditAspect (Optional, for non-critical ops only)
  - [ ] Intercept @Auditable methods
  - [ ] Serialize before/after state (JSON)
  - [ ] May use post-commit event publishing for non-critical operations
  - [ ] DO NOT use for critical operations
  
- [ ] AuditLogDTO
  - [ ] For API responses
  - [ ] Hide sensitive fields
  
- [ ] AuditQueryService
  - [ ] Build complex queries with filters
  - [ ] Date range filtering
  - [ ] Entity type filtering
  - [ ] Actor filtering
  - [ ] Action filtering
  - [ ] Pagination

**Testing**:
- [ ] Unit: Serialization/deserialization
- [ ] Integration: Aspect captures state correctly
- [ ] Integration: Non-blocking audit doesn't slow requests

**DoD**: Any module can audit actions. Audit available for queries and export.

---

### Block 6: Role & Permission Management APIs - READ-ONLY in MVP (Days 8-9)

**Objective**: Admin views system roles and assigns them to users (no permission modification in Phase 3.1).

**IMPORTANT**: Permission assignment, custom role creation, and system role modification are deferred to Phase 3.2+.

**Deliverables**:
- [ ] AdminRoleController (Read-Only)
  - [ ] GET /api/admin/roles (list system roles only)
  - [ ] GET /api/admin/roles/{roleId} (get role details)
  - [ ] @PreAuthorize('hasPermission("ROLE_READ")')
  
- [ ] AdminPermissionController (Read-Only)
  - [ ] GET /api/admin/permissions (list all system permissions)
  - [ ] GET /api/admin/permissions/{permId} (get permission details)
  - [ ] GET /api/admin/roles/{roleId}/permissions (view role-permission mapping)
  - [ ] @PreAuthorize('hasPermission("PERMISSION_READ")')
  
- [ ] UserRoleManagementController (Assign/Remove Only)
  - [ ] POST /api/admin/users/{userId}/assign-role (assign platform role to user)
  - [ ] DELETE /api/admin/users/{userId}/roles/{roleId} (remove platform role from user)
  - [ ] GET /api/admin/users/{userId}/roles (view user's platform roles)
  - [ ] GET /api/admin/users/{userId}/permissions (view user's effective permissions)
  - [ ] @PreAuthorize('hasPermission("ROLE_ASSIGN_USER")')
  - [ ] Validation: Cannot assign ADMIN role without protection
  - [ ] Validation: Cannot remove last ADMIN user
  - [ ] Validation: Cannot assign/remove system roles (they are immutable)
  - [ ] Audit: Log all role assignments/removals
  
- [ ] RoleManagementService
  - [ ] getRole(roleId) - returns system role details
  - [ ] getAllRoles() - returns all system roles
  - [ ] assignRoleToUser(userId, roleId) - assigns platform role
  - [ ] removeRoleFromUser(userId, roleId) - removes platform role
  - [ ] getUserRoles(userId) - returns user's platform roles
  - [ ] getEffectivePermissions(userId) - returns all permissions for user's roles
  - [ ] Validation: Last admin check, system role immutability check
  - [ ] Cache invalidation: Clear user's permission cache on role change
  
- [ ] PermissionService (Read-Only)
  - [ ] getPermission(permissionId)
  - [ ] getAllPermissions()
  - [ ] getPermissionsByRole(roleId)
  - [ ] getPermissionsByUser(userId)
  - [ ] Note: Permission creation/modification is deferred to Phase 3.2+
  
- [ ] DTOs
  - [ ] RoleDTO (id, name, description, type, permissions_list)
  - [ ] PermissionDTO (id, name, description, resource, action, scope)
  - [ ] UserRoleDTO (userId, roleId, assignedAt, assignedBy)
  - [ ] AssignRoleRequest (roleId, reason optional)
  - [ ] UserPermissionsDTO (userId, effectivePermissions[])

**Testing**:
- [ ] Unit: Validation (last admin check, system role immutability)
- [ ] Unit: Cache invalidation triggered on role change
- [ ] Integration: User role assignment workflow
- [ ] Integration: Permission enforcement after role assignment
- [ ] Integration: Audit logged for all role changes
- [ ] Negative: Cannot assign ADMIN without special handling
- [ ] Negative: Cannot modify system role permissions
- [ ] Negative: Cannot create custom roles

**DoD**: Admin can view roles and permissions. Admin can safely assign/remove platform roles. System roles protected. Permissions cached. Ready to defer custom roles to Phase 3.2+.

**Note**: All permission-assignment, permission-removal, and custom-role operations are explicitly deferred to Phase 3.2+ per the final design decisions.

---

### Block 7: Admin Employee Management APIs (Days 10-12)

**Objective**: Admin creates and manages employees.

**Deliverables**:
- [ ] AdminEmployeeController
  - [ ] POST /api/admin/employees (create with optional role)
  - [ ] GET /api/admin/employees (list with filters)
  - [ ] GET /api/admin/employees/{empId}
  - [ ] PUT /api/admin/employees/{empId} (update allowed fields)
  - [ ] PUT /api/admin/employees/{empId}/rmg (change RMG)
  - [ ] PUT /api/admin/employees/{empId}/deactivate (business lifecycle)
  - [ ] @PreAuthorize for each endpoint
  
- [ ] EmployeeManagementService
  - [ ] createEmployee(dto) → applies RMG assignment, optional role
  - [ ] updateEmployee(id, dto) → updates allowed fields only
  - [ ] changeRmg(employeeId, newRmgId) → separate, audited operation
  - [ ] deactivateEmployee(employeeId, reason) → business lifecycle
    - [ ] Set status to INACTIVE
    - [ ] End active allocations (event: EmployeeDeactivated)
    - [ ] Remove from Resource Pool (event: RMGAssignmentRemoved)
    - [ ] Cancel pending interviews (event: InterviewCancelled)
    - [ ] Close/cancel pending opportunities
    - [ ] Disable login access (event: UserDisabled)
    - [ ] Preserve historical records
    - [ ] Atomic transaction
  - [ ] getEmployee(id)
  - [ ] getEmployees(filters, pagination)
  - [ ] Validation: unique emp_id, valid email, valid department
  
- [ ] DTOs
  - [ ] CreateEmployeeRequest (name, email, designation, dept, rmg, optionalRoleId)
  - [ ] UpdateEmployeeRequest (allowed fields only)
  - [ ] ChangeRmgRequest (newRmgId, reason optional)
  - [ ] DeactivateEmployeeRequest (reason, effectiveDate)
  - [ ] EmployeeDTO (response)
  
- [ ] Search/Filtering
  - [ ] Filters: role, department, rmg, status, location, skills
  - [ ] Pagination: page, size
  - [ ] Sort: by name, emp_id, designation

**Testing**:
- [ ] Unit: Validation (unique emp_id, valid email)
- [ ] Unit: Deactivation logic (ends allocations, removes from pool)
- [ ] Integration: Employee created with role
- [ ] Integration: RMG change audited
- [ ] Integration: Deactivation cascades correctly
- [ ] Integration: Authorization (only Admin can create)
- [ ] Integration: Audit logged for all operations

**DoD**: Admin can manage employees. Deactivation handles business lifecycle correctly. All operations audited and authorized.

---

### Block 8: Admin Project Management APIs (Days 12-14)

**Objective**: Admin creates and manages projects.

**Deliverables**:
- [ ] AdminProjectController
  - [ ] POST /api/admin/projects (create with optional manager)
  - [ ] GET /api/admin/projects (list with filters)
  - [ ] GET /api/admin/projects/{projId}
  - [ ] PUT /api/admin/projects/{projId} (update allowed fields)
  - [ ] PUT /api/admin/projects/{projId}/manager (change manager)
  - [ ] PUT /api/admin/projects/{projId}/close (business lifecycle)
  - [ ] @PreAuthorize for each endpoint
  
- [ ] ProjectManagementService
  - [ ] createProject(dto) → applies manager assignment, optional
  - [ ] updateProject(id, dto) → updates allowed fields only
  - [ ] changeManager(projectId, newManagerId) → separate, audited operation
  - [ ] closeProject(projectId, reason) → business lifecycle
    - [ ] Close open requirements (event: RequirementClosed)
    - [ ] Archive candidate pipelines (event: PipelineArchived)
    - [ ] Release project members (event: MemberRemoved)
    - [ ] End allocations (event: AllocationEnded)
    - [ ] Preserve historical records
    - [ ] Atomic transaction
  - [ ] getProject(id)
  - [ ] getProjects(filters, pagination)
  - [ ] Validation: unique project_id, valid manager, valid domain
  
- [ ] DTOs
  - [ ] CreateProjectRequest (project_id, name, domain, location, optionalManagerId)
  - [ ] UpdateProjectRequest (allowed fields only)
  - [ ] ChangeManagerRequest (newManagerId, reason optional)
  - [ ] CloseProjectRequest (reason, effectiveDate)
  - [ ] ProjectDTO (response)
  
- [ ] Search/Filtering
  - [ ] Filters: domain, manager, location, status, team_size
  - [ ] Pagination: page, size
  - [ ] Sort: by name, project_id, domain

**Testing**:
- [ ] Unit: Validation (unique project_id, valid manager)
- [ ] Unit: Close project logic (closes requirements, archives pipelines)
- [ ] Integration: Project created with manager
- [ ] Integration: Manager change audited
- [ ] Integration: Project closure cascades correctly
- [ ] Integration: Authorization (only Admin can create)
- [ ] Integration: Audit logged for all operations

**DoD**: Admin can manage projects. Closure handles business lifecycle correctly. All operations audited and authorized.

---

### Block 9: Search & RMG Dashboard APIs (Days 14-15)

**Objective**: Admin discovers employees, projects, and RMG information.

**Deliverables**:
- [ ] AdminSearchController
  - [ ] POST /api/admin/search/employees (complex filters)
  - [ ] POST /api/admin/search/projects (complex filters)
  - [ ] @PreAuthorize('hasPermission("EMPLOYEE_SEARCH")') / PROJECT_SEARCH
  
- [ ] EmployeeSearchService
  - [ ] searchEmployees(filters, pagination)
  - [ ] Filters: role, designation, department, rmg, location, skills, status
  - [ ] Search fields: emp_id, name, email
  - [ ] Pagination + sort
  
- [ ] ProjectSearchService
  - [ ] searchProjects(filters, pagination)
  - [ ] Filters: domain, manager, location, status, team_size
  - [ ] Search fields: project_id, name
  - [ ] Pagination + sort
  
- [ ] AdminRmgController
  - [ ] GET /api/admin/rmg-dashboard (view all RMGs with counts)
  - [ ] GET /api/admin/rmg/{rmgId}/associates (employees under RMG)
  - [ ] POST /api/admin/rmg/filter (advanced filtering)
  - [ ] @PreAuthorize('hasPermission("RMG_VIEW")')
  
- [ ] RmgDashboardService
  - [ ] getAllRmgs() → list with associate count
  - [ ] filterRmgs(filters) → department, location, status
  - [ ] getAssociatesForRmg(rmgId) → active employees
  - [ ] Calculation: COUNT(*) WHERE rmg_id = ? AND status = 'ACTIVE'
  - [ ] **CLARIFICATION**: Capacity/workload NOT included in MVP
  
- [ ] DTOs
  - [ ] EmployeeSearchRequest, EmployeeSearchResultDTO
  - [ ] ProjectSearchRequest, ProjectSearchResultDTO
  - [ ] RmgDashboardDTO, RmgDetailDTO
  - [ ] Associate count, department, location, skills

**Testing**:
- [ ] Unit: Filter builders (all combinations)
- [ ] Integration: Search returns correct results with correct visibility
- [ ] Integration: Pagination works correctly
- [ ] Integration: RMG associate count accurate
- [ ] Integration: Authorization - role-scoped results:
  - [ ] Admin sees all employees, all projects
  - [ ] Manager sees employees/projects in authorized scope only
  - [ ] RMG sees assigned employees and relevant projects
  - [ ] Associate sees permitted records only
- [ ] Integration: Unauthorized records NOT returned in any results or filters

**DoD**: Search works with role-based visibility. RMG dashboard shows accurate associate counts. All filters functional. Authorization prevents unauthorized data access.

---

### Block 10: Manager/RMG Assignment Replacement APIs (Days 15-17)

**Objective**: Admin centrally replaces departing Manager/RMG assignments.

**Deliverables**:
- [ ] AdminAssignmentController
  - [ ] GET /api/admin/assignments/departing/{userId} (preview all affected assignments)
  - [ ] POST /api/admin/assignments/replace-manager/{departingManagerId} (execute manager replacement)
  - [ ] POST /api/admin/assignments/replace-rmg/{departingRmgId} (execute RMG replacement)
  - [ ] @PreAuthorize('hasPermission("ASSIGNMENT_VIEW")') / ASSIGNMENT_REPLACE_MANAGER / ASSIGNMENT_REPLACE_RMG
  
- [ ] AssignmentReplacementService
  - [ ] **For Manager**:
    - [ ] getManagerAssignments(managerId)
      - [ ] All projects where manager_id = managerId
      - [ ] **Only requirements directly owned by departing manager** (owner_id = managerId, NOT project association)
      - [ ] Responsibilities assigned to departing manager:
        - [ ] SOURCER responsibilities
        - [ ] INTERVIEWER responsibilities
        - [ ] COORDINATOR responsibilities
      - [ ] All project team memberships
      - [ ] Return: preview with separate categories (not auto-selected)
    - [ ] replaceManager(departingManagerId, newManagerId, selectedAssignments)
      - [ ] Validate: departingManagerId has MANAGER role
      - [ ] Validate: newManagerId has MANAGER role
      - [ ] BEGIN TRANSACTION
      - [ ] **For each selected project**:
        - [ ] Update project.manager_id = newManagerId
        - [ ] Emit event: ProjectManagerChanged
        - [ ] Audit: log transfer
      - [ ] **For each selected owned requirement**:
        - [ ] Update requirement.owner_id = newManagerId (ONLY if directly owned, not inferred)
        - [ ] Emit event: RequirementOwnerChanged
        - [ ] Audit: log transfer
      - [ ] **For each selected responsibility**:
        - [ ] Update requirement.sourcer_id OR interviewer_id OR coordinator_id = newManagerId
        - [ ] Emit event: ResponsibilityTransferred
        - [ ] Audit: log transfer
      - [ ] Recalculate access: Remove departing manager from projects, add new manager
      - [ ] COMMIT or ROLLBACK (atomic: all or nothing)
  
  - [ ] **For RMG**:
    - [ ] getRmgAssignments(rmgId)
      - [ ] All employees where rmg_id = rmgId
      - [ ] All pool responsibilities
      - [ ] Return: list of affected assignments
    - [ ] replaceRmg(departingRmgId, newRmgId, employeeIds)
      - [ ] Validate: departingRmgId has RMG role
      - [ ] Validate: newRmgId has RMG role
      - [ ] BEGIN TRANSACTION
      - [ ] For each employee:
        - [ ] Update employee.rmg_id = newRmgId
        - [ ] Emit event: RMGAssignmentChanged
      - [ ] Recalculate pool ownership
      - [ ] Audit each transfer
      - [ ] COMMIT or ROLLBACK
  
- [ ] DTOs
  - [ ] AssignmentPreviewDTO
    - [ ] Manager: projects, owned_requirements, responsibilities, project_memberships
    - [ ] RMG: employees, pool_responsibilities, other_assignments
    - [ ] Each category shown separately with counts, NOT auto-selected
  - [ ] ReplaceManagerRequest
    - [ ] newManagerId (required)
    - [ ] selectedProjectIds[] (which projects to transfer manager_id)
    - [ ] selectedOwnedRequirementIds[] (which owned requirements to transfer owner_id)
    - [ ] selectedResponsibilities[] ({requirementId, responsibility: SOURCER|INTERVIEWER|COORDINATOR})
  - [ ] ReplaceRmgRequest
    - [ ] newRmgId (required)
    - [ ] selectedEmployeeIds[] (which employees to transfer rmg_id)
  - [ ] ReplacementResultDTO (success, affected_counts_by_type, errors if any)
  
- [ ] Validation
  - [ ] Cannot replace with inactive user
  - [ ] Must select at least one assignment
  - [ ] New replacement must have correct role
  - [ ] Atomic transaction: all or nothing

**Testing**:
- [ ] Unit: Assignment preview query
- [ ] Unit: Validation (role checks, selection)
- [ ] Integration: Manager replacement updates projects atomically
- [ ] Integration: RMG replacement updates employees atomically
- [ ] Integration: Access recalculation works
- [ ] Integration: Audit logged for each transfer
- [ ] Integration: Rollback on error preserves data

**DoD**: Admin can preview and execute replacements safely. All assignments transferred atomically. Audit complete.

---

### Block 11: Audit & Reporting APIs (Days 17-18)

**Objective**: Admin views and exports audit history and reports.

**Deliverables**:
- [ ] AdminAuditController
  - [ ] GET /api/admin/audit (list with filters/pagination)
  - [ ] GET /api/admin/audit/export (download as file)
  - [ ] @PreAuthorize('hasPermission("AUDIT_READ")') / AUDIT_EXPORT
  
- [ ] AdminReportController
  - [ ] GET /api/admin/reports (list available reports)
  - [ ] POST /api/admin/reports/generate (create custom report)
  - [ ] GET /api/admin/reports/{reportId}/download (download)
  - [ ] @PreAuthorize('hasPermission("REPORT_GENERATE")')
  
- [ ] AuditQueryService
  - [ ] getAuditEvents(filters, pagination)
  - [ ] Filters:
    - [ ] Date range (startDate, endDate)
    - [ ] Entity type (EMPLOYEE, PROJECT, ROLE, etc.)
    - [ ] Action (CREATE, UPDATE, DEACTIVATE, etc.)
    - [ ] Actor (userId)
  - [ ] Sort: by timestamp (desc)
  - [ ] Response: AuditLogDTO (timestamp, actor, action, entity, before/after)
  
- [ ] AuditExportService
  - [ ] exportAuditAsCsv(filters)
  - [ ] exportAuditAsJson(filters)
  - [ ] Columns: timestamp, actor, action, entity_type, entity_id, before, after
  - [ ] Download via response headers (Content-Disposition)
  
- [ ] ReportGenerationService
  - [ ] generateEmployeeActivityReport(dateRange)
    - [ ] Employees created/deactivated
    - [ ] RMG changes
    - [ ] Role changes
  
  - [ ] generateProjectActivityReport(dateRange)
    - [ ] Projects created/closed
    - [ ] Manager changes
  
  - [ ] generateAdminActionReport(dateRange)
    - [ ] All admin actions
    - [ ] By admin (actor)
  
  - [ ] generateUserAccessReport(dateRange)
    - [ ] Role assignments
    - [ ] Permission changes
  
  - [ ] Save to database for download
  - [ ] Generate async (long-running)
  
- [ ] DTOs
  - [ ] AuditLogDTO (with before/after serialized)
  - [ ] ReportRequestDTO (reportType, dateRange, format)
  - [ ] ReportDTO (id, type, generatedAt, status, downloadUrl)

**Testing**:
- [ ] Integration: Audit query with all filter combinations
- [ ] Integration: Export creates file (CSV, JSON)
- [ ] Integration: Report generation works
- [ ] Integration: Authorization (only Admin exports)

**DoD**: Admin can view, filter, and export audit. Reports generate successfully.

---

### Block 12: RBAC Security & Protection Tests (Days 18-19)

**Objective**: Validate security constraints and prevent privilege escalation.

**Deliverables**:
- [ ] System Role Protection Tests
  - [ ] ✓ Admin CANNOT delete ADMIN role
  - [ ] ✓ Admin CANNOT delete MANAGER/RMG/ASSOCIATE roles
  - [ ] ✓ Admin CANNOT modify permissions of system roles
  - [ ] ✓ Admin CANNOT remove all permissions from ADMIN role
  - [ ] ✓ Admin CANNOT remove last ADMIN user
  - [ ] ✓ Admin CANNOT disable ADMIN role
  
- [ ] Permission Enforcement Tests
  - [ ] ✓ Admin CAN perform all actions
  - [ ] ✓ Manager CANNOT create employee
  - [ ] ✓ Manager CANNOT create project
  - [ ] ✓ Manager CANNOT assign roles
  - [ ] ✓ RMG CANNOT create employee
  - [ ] ✓ RMG CANNOT create project
  - [ ] ✓ Associate CANNOT create employee
  - [ ] ✓ Associate CANNOT view admin panel
  
- [ ] User Self-Escalation Tests
  - [ ] ✓ User CANNOT assign role to self
  - [ ] ✓ User CANNOT modify own permissions
  - [ ] ✓ User CANNOT promote own role
  
- [ ] Access Control Tests
  - [ ] ✓ Deactivated user loses access
  - [ ] ✓ Disabled user loses access
  - [ ] ✓ Removed role revokes access immediately
  - [ ] ✓ Changed RMG updates employee's capabilities
  - [ ] ✓ Replaced manager loses project access
  
- [ ] Permission Cache Tests
  - [ ] ✓ Permission changes take effect immediately for new logins
  - [ ] ⚠️  JWT-embedded permissions may persist until expiry (document)
  - [ ] ✓ Cache invalidated on role assignment
  - [ ] ✓ Cache invalidated on permission change
  
- [ ] Audit Tests
  - [ ] ✓ Sensitive operations audited (role assign, deactivate, replace)
  - [ ] ✓ Audit captures before/after state
  - [ ] ✓ Audit captures actor and timestamp

**Testing Framework**:
- [ ] @DataJpaTest for database tests
- [ ] @SpringBootTest for integration tests
- [ ] Mock SecurityContext for permission tests
- [ ] Parameterized tests for role/permission combinations

**DoD**: No security gaps. All privilege escalation paths blocked. Audit complete.

---

### Block 13: Integration & Regression Testing (Days 19-20)

**Objective**: Verify complete workflows and no breakage to existing features.

**Deliverables**:
- [ ] **Complete Workflows**
  - [ ] Employee lifecycle: create → assign rmg → change rmg → deactivate
  - [ ] Project lifecycle: create → assign manager → change manager → close
  - [ ] Role assignment: assign → revoke → reassign
  - [ ] Manager replacement: preview → select → execute
  - [ ] RMG replacement: preview → select → execute
  
- [ ] **Search Functionality**
  - [ ] Employee search returns correct results with all filters
  - [ ] Project search returns correct results with all filters
  - [ ] Pagination works correctly
  - [ ] Results ordered by sort fields
  
- [ ] **RMG Dashboard**
  - [ ] Shows all RMGs with accurate associate counts
  - [ ] Filtering by department/location works
  - [ ] Associate list loads for each RMG
  
- [ ] **Audit Trail**
  - [ ] All admin actions logged
  - [ ] Audit queryable by all filters
  - [ ] Export produces valid file
  
- [ ] **Authentication Integration**
  - [ ] Login still works
  - [ ] Roles resolved correctly
  - [ ] Permissions evaluated correctly
  - [ ] Logout still works
  
- [ ] **Existing Module Regression**
  - [ ] Employee module (if separate) still works
  - [ ] Project module (if separate) still works
  - [ ] Candidate module (if exists) unaffected
  - [ ] Allocation module (if exists) unaffected
  - [ ] No schema breaking changes
  - [ ] No data loss

**Testing**:
- [ ] End-to-end test cases
- [ ] Load testing: performance acceptable
- [ ] Concurrent access: race conditions avoided

**DoD**: All workflows tested. No regressions. Performance acceptable.

---

### Block 14: Documentation (Days 20-21)

**Objective**: Document system for future maintainers.

**Deliverables**:
- [ ] **RBAC_ARCHITECTURE.md**
  - [ ] Multi-level authorization model
  - [ ] Permission evaluation flow
  - [ ] Cache strategy
  - [ ] Security assumptions
  
- [ ] **RBAC_ADMIN_PERMISSION_MATRIX.md**
  - [ ] Table: Admin actions → required permissions
  - [ ] Security constraints
  - [ ] System role protection
  - [ ] Last admin protection
  
- [ ] **RBAC_API_DOCUMENTATION.md**
  - [ ] All endpoints with request/response
  - [ ] Permissions required for each
  - [ ] Example requests/responses
  - [ ] Error cases
  
- [ ] **RBAC_SETUP_GUIDE.md**
  - [ ] Prerequisite: existing Role, UserAccount, Employee entities
  - [ ] Database migration steps
  - [ ] Spring Security configuration
  - [ ] System data seeding
  - [ ] Initial admin setup
  - [ ] Testing checklist
  
- [ ] **RBAC_INTEGRATION_NOTES.md**
  - [ ] Assumptions about authentication
  - [ ] JWT vs database permission fetch strategy
  - [ ] Events emitted (EmployeeDeactivated, ProjectClosed, etc.)
  - [ ] How other modules consume authorization
  
- [ ] **Swagger/OpenAPI**
  - [ ] All admin endpoints documented
  - [ ] Security schemes (Bearer token)
  - [ ] Schemas for all DTOs
  - [ ] Example responses

**DoD**: Documentation complete, accurate, and maintainable.

---

## ESTIMATED TIMELINE

| Phase                    | Days     | Blocks |
| ------------------------ | -------- | ------ |
| Prerequisites & Prep     | 0.5      | 0      |
| Foundations              | 6        | 1-2    |
| Authorization & Audit    | 4        | 3-5    |
| Role/Permission Mgmt     | 2        | 6      |
| Business APIs (Emp/Proj) | 4        | 7-8    |
| Search/RMG/Replacement   | 4        | 9-10   |
| Audit/Reports            | 2        | 11     |
| Security Testing         | 2        | 12     |
| Integration Testing      | 2        | 13     |
| Documentation            | 2        | 14     |
| **Total**                | **~28-30 days** | **14 blocks** |

### Notes
- **Not 20 days**: Previous estimate was optimistic. 28-30 days is realistic for production-quality RBAC.
- **Parallel streams possible**: Blocks 7-8 can start while 6 finishes if team size allows.
- **Dependent path**: Prerequisites → Foundations → Authorization → Business APIs.
- **Quality gates**: Security testing (Block 12) cannot be skipped or rushed.

---

## KEY DELIVERABLES AT PHASE END

✅ **Foundation**
- Permission database with all 28 Phase 3.1 system-defined permissions
- Role entity with system role protection and immutability for ADMIN/MANAGER/RMG/ASSOCIATE
- UserRole with one-platform-role-per-user (MVP)
- AuditLog with complete before/after state and atomic transaction guarantees

✅ **Authorization**
- Permission evaluation engine (PermissionEvaluator)
- @PreAuthorize annotation integration
- Permission cache with invalidation strategy
- Spring Security configuration

✅ **Admin Management**
- Role & permission management APIs
- Employee management APIs (create, update, deactivate)
- Project management APIs (create, update, close)
- RMG assignment and dashboard

✅ **Admin Operations**
- Manager/RMG replacement (atomic, transactional)
- Search employees and projects
- Audit history viewing/export
- Basic reporting

✅ **Security**
- System roles protected
- Last admin cannot be removed
- User cannot self-escalate
- Deactivation and project closure handle lifecycle correctly
- All actions audited

✅ **Documentation**
- Architecture guide
- API documentation
- Setup guide
- Integration guide

---

## WHAT'S NOT IN PHASE 3.1 (Explicitly Deferred)

❌ Custom role creation (requires additional design)
❌ Dynamic permission creation (requires governance)
❌ RMG workload/capacity balancing (requires business definition)
❌ Project-level role overrides (Phase 3.2+)
❌ Workflow-level authorization (Phase 3.2+)
❌ Contextual workflow actions (Phase 3.2+)
❌ Multi-platform-role per user (Phase 4+)

---

## SUCCESS CRITERIA

- [ ] All 14 blocks completed
- [ ] All security tests passing
- [ ] No privilege escalation vulnerabilities
- [ ] System roles protected
- [ ] Audit trail complete
- [ ] Performance acceptable (< 200ms for API responses)
- [ ] All documentation reviewed and approved
- [ ] Code reviewed by architect
- [ ] Ready for Manager/RMG role implementation (Phase 3.2)
