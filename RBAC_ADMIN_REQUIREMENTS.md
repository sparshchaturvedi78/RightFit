# RBAC Implementation - Admin Role Requirements
## Extracted from BRD v2.0 | Revised per Architecture Review

---

## ⚠️ CRITICAL DESIGN DECISION

**NO SIMPLE ROLE INHERITANCE**

The BRD defines authorization across **four distinct levels**:

1. **Platform Role** (ADMIN, MANAGER, RMG, ASSOCIATE)
2. **Project Membership** (Project-specific access)
3. **Requirement Responsibility** (SOURCER, INTERVIEWER, COORDINATOR)
4. **Workflow Actions** (Stage-specific permissions)

**Authorization evaluates ALL FOUR levels together. NOT a simple hierarchy.**

Example:
```
Can User X perform Action Y on Resource Z?
  ├─ Check Platform Role permissions
  ├─ Check Project Membership
  ├─ Check Requirement Responsibility
  └─ Check Workflow Stage
→ Grant access only if ALL applicable checks pass
```

---

## ADMIN ROLE PERMISSIONS

### 1. Employee Management
- `EMPLOYEE_CREATE` - Create new employees
- `EMPLOYEE_READ` - View employee records
- `EMPLOYEE_UPDATE` - Update employee information (allowed fields only)
- `EMPLOYEE_DEACTIVATE` - Deactivate employee (business lifecycle operation)
- `EMPLOYEE_ASSIGN_RMG` - Assign RMG during employee creation
- `EMPLOYEE_CHANGE_RMG` - Change employee's assigned RMG
- `EMPLOYEE_MANAGE_ADMINISTRATIVE` - Manage administrative information

### 2. Project Management
- `PROJECT_CREATE` - Create projects
- `PROJECT_READ` - View project information
- `PROJECT_UPDATE` - Update project details (allowed fields only)
- `PROJECT_ASSIGN_MANAGER` - Assign managers to projects
- `PROJECT_CHANGE_MANAGER` - Change project managers
- `PROJECT_CLOSE` - Close/archive project (business lifecycle operation)

### 3. User & Role Management
- `ROLE_READ` - View platform roles
- `ROLE_ASSIGN_USER` - Assign roles to users
- `ROLE_ASSIGN_PERMISSION` - Assign permissions to roles
- `PERMISSION_READ` - View available permissions
- `USER_ENABLE_DISABLE` - Enable/disable user accounts
- `SYSTEM_ROLE_PROTECT` - Prevent modification of system roles (implicit)

### 4. Manager/RMG Replacement & Assignment
- `ASSIGNMENT_VIEW` - View all assignments for departing person
  - Projects assigned (as Manager)
  - Requirements they own
  - Employees assigned (if RMG)
  - Project team memberships
  - Resource Pool responsibilities
  - All other relevant assignments
  
- `ASSIGNMENT_REPLACE_MANAGER` - Replace departing Manager assignments
- `ASSIGNMENT_REPLACE_RMG` - Replace departing RMG assignments

### 5. Audit & Reporting
- `AUDIT_READ` - View audit history (platform-wide)
- `AUDIT_EXPORT` - Download audit history files
- `AUDIT_FILTER` - Filter audit by date, actor, entity, action
- `REPORT_GENERATE` - Generate system reports
- `REPORT_DOWNLOAD` - Download generated reports

### 6. Search & Discovery
- `EMPLOYEE_SEARCH` - Search employees (with role-specific visibility)
- `PROJECT_SEARCH` - Search projects (with role-specific visibility)
- `RMG_VIEW` - View all RMGs with associate counts

---

## RBAC ARCHITECTURE (REVISED)

### Authorization Model
```
User
 └─ Has: Platform Role
     ├─ ADMIN / MANAGER / RMG / ASSOCIATE
     └─ Grant: Platform-level permissions
 
 └─ Has: Project Membership (optional)
     ├─ Project ID
     ├─ Role in Project
     └─ Grant: Project-specific access
 
 └─ Has: Requirement Responsibility (optional)
     ├─ SOURCER / INTERVIEWER / COORDINATOR
     └─ Grant: Requirement-specific actions
 
 └─ Has: Workflow Stage Access
     └─ Grant: Stage-specific actions
```

### Permission Model
```
Platform Role
  ↓
Permission (explicit list)
  ↓
Contextual checks (project, requirement, workflow)
  ↓
Authorization decision
```

### Platform Role Definitions

#### ADMIN
- **Responsibility**: Platform and organizational administration
- **Permissions**: All 16 permissions listed above
- **Scope**: Organization-wide
- **Special Rules**:
  - Cannot be deleted
  - Cannot have all permissions removed
  - Cannot be assigned to non-system users initially
  - Requires explicit Admin authorization to assign

#### MANAGER
- **Responsibility**: Project and team leadership
- **Permissions**: (Defined in Phase 3.2)
- **Scope**: Assigned projects
- **Special Rules**:
  - Cannot manage platform configuration
  - Can manage assignments within projects

#### RMG
- **Responsibility**: Resource pool governance and reviews
- **Permissions**: (Defined in Phase 3.3)
- **Scope**: Assigned employees and pool
- **Special Rules**:
  - Cannot manage projects
  - Cannot make final candidate decisions

#### ASSOCIATE
- **Responsibility**: Self-service profile and opportunity management
- **Permissions**: (Defined in Phase 3.4)
- **Scope**: Own records
- **Special Rules**:
  - Can view own data only
  - Can request reviews

### Requirement Responsibilities (Separate from Platform Roles)
```
SOURCER
  └─ Permission: Find and recommend candidates
  
INTERVIEWER
  └─ Permission: Conduct and rate interviews
  
COORDINATOR
  └─ Permission: Manage scheduling and logistics
```

These can be assigned to ANY platform role (Admin, Manager, Associate).

---

## DATABASE SCHEMA

### Permission Table
```sql
id (PK)
name (UNIQUE) -- e.g., EMPLOYEE_CREATE
description
resource -- e.g., EMPLOYEE, PROJECT, ROLE
action -- e.g., CREATE, READ, UPDATE, DEACTIVATE
scope -- GLOBAL, PROJECT, EMPLOYEE
is_system -- true for system-defined, false for custom
is_active
created_at
updated_at
```

### Role Table (Enhanced)
```sql
id (PK)
name (UNIQUE) -- e.g., ADMIN, MANAGER, RMG, ASSOCIATE
description
role_type -- SYSTEM, CUSTOM
is_modifiable -- false for ADMIN/MANAGER/RMG/ASSOCIATE
created_at
updated_at
```

### RolePermission Table
```sql
id (PK)
role_id (FK)
permission_id (FK)
created_at
UNIQUE(role_id, permission_id)
```

### UserRole Table
```sql
id (PK)
user_id (FK)
role_id (FK) -- Platform role only
assigned_at
assigned_by (user_id who assigned)
is_active -- true/false
created_at
updated_at
UNIQUE(user_id, role_id) -- One platform role per user (MVP)
```

### AuditLog Table
```sql
id (PK)
user_id (FK)
action -- CREATE, UPDATE, DELETE, DEACTIVATE, ASSIGN, etc.
entity_type -- EMPLOYEE, PROJECT, ROLE, PERMISSION, etc.
entity_id
before_state (JSON)
after_state (JSON)
timestamp
ip_address
user_agent
```

---

## ADMIN FEATURES TO IMPLEMENT (Phase 3.1)

### 3.1.1 Role & Permission Management (Foundation)
- View all system roles (ADMIN, MANAGER, RMG, ASSOCIATE)
- View all permissions
- Assign permissions to custom roles (future)
- Assign platform roles to users
- Remove platform roles from users
- View effective permissions for a user
- **Constraints**:
  - Cannot modify system roles
  - Cannot remove all permissions from ADMIN role
  - Cannot modify ADMIN role assignments except for adding new admins
  - Cannot remove the last active ADMIN user

### 3.1.2 Employee Management
- **Create employee**:
  - Provide: name, emp_id, email, designation, department, etc.
  - Option 1: Assign platform role at creation
  - Option 2: Assign platform role separately
  - Assign RMG during creation
  
- **View employees**:
  - List all employees
  - Filters: role, department, rmg, status, location, skills
  - Pagination
  
- **Update employee**:
  - Update: designation, department, skills, etc.
  - Does NOT change platform role (use role management)
  - Does NOT change RMG directly (use RMG change operation)
  
- **Change RMG**:
  - Separate operation: update employee's RMG
  - Updates Resource Pool ownership
  - Audit: log before/after RMG
  
- **Deactivate employee** (NOT DELETE):
  - Business lifecycle operation
  - Triggers:
    - Employee status → INACTIVE
    - End all active allocations
    - Remove from Resource Pool
    - Cancel pending interviews
    - Close/cancel pending opportunities
    - Disable login access
    - Preserve all historical records
  - Audit: log deactivation reason

### 3.1.3 Project Management
- **Create project**:
  - Provide: project_id (unique), name, domain, location, etc.
  - Assign Manager during creation or separately
  
- **View projects**:
  - List all projects
  - Filters: domain, manager, location, status, team_size
  - Pagination
  
- **Update project**:
  - Update: project details (name, domain, etc.)
  - Does NOT change Manager directly
  
- **Change Manager**:
  - Separate operation: update project's Manager
  - Audit: log before/after Manager
  
- **Close project** (NOT DELETE):
  - Business lifecycle operation
  - Triggers:
    - Close open requirements
    - Archive candidate pipelines
    - Release project members
    - End allocations
    - Preserve historical records
  - Audit: log closure reason

### 3.1.4 RMG Management & Dashboard
- **View RMG Dashboard**:
  - List all RMGs (employees with RMG role)
  - Show: name, department, location, associate count
  - Filter by: department, location, status
  
- **Associate Count Definition**:
  - Count of active employees assigned to this RMG
  
- **Workload/Capacity** (Future):
  - Requires business definition of "capacity"
  - Define: max associates per RMG, per department, per location
  - Admin can view utilization
  - **NOT implemented in MVP** unless explicitly approved
  
- **Quick Actions**:
  - View employees under RMG
  - Change employee's RMG (without leaving dashboard)

### 3.1.5 Search & Discovery (All Roles Can Search)
Admin accesses shared search infrastructure with admin-level visibility.

- **Employee Search**:
  - Search by: employee_id, name, email
  - Filters: role, designation, department, rmg, location, skills, status
  - Display: emp_id, name, designation, department, assigned_rmg, status, current_allocation
  - Returns: matching employees (admin sees all)
  
- **Project Search**:
  - Search by: project_id, name
  - Filters: domain, manager, location, status, team_size
  - Display: project_id, name, domain, manager, status, team_size
  - Returns: matching projects (admin sees all)

### 3.1.6 Manager/RMG Replacement (Centralized)
- **View Assignments for Departing User**:
  - Preview all affected assignments:
    - Projects (if Manager)
    - Requirements owned
    - Employees assigned (if RMG)
    - Project team memberships
    - Resource Pool responsibilities
  - Transaction-safe: all at once or none
  
- **Replace Manager**:
  - Select departing Manager
  - Select projects to transfer
  - Select new Manager
  - Execute replacement:
    - Update all projects' manager_id
    - Recalculate project team access
    - Remove departing Manager's project access
    - Audit each transfer
    - Atomic transaction
  
- **Replace RMG**:
  - Select departing RMG
  - Select employees to transfer
  - Select new RMG
  - Execute replacement:
    - Update all employees' rmg_id
    - Update Resource Pool ownership
    - Remove departing RMG's access
    - Audit each transfer
    - Atomic transaction

### 3.1.7 Audit & Reports
- **View Audit History**:
  - List all platform audit events
  - Filters: date range, entity type, actor, action
  - Display: timestamp, actor, action, entity, before/after
  - Pagination
  
- **Export Audit**:
  - CSV or JSON format
  - Date range selection
  - Filter options
  
- **Generate Reports**:
  - Employee activity report
  - Project activity report
  - Admin action report
  - User access report

---

## API ENDPOINTS

### Role Management
```
GET    /api/admin/roles                    -- List all roles
GET    /api/admin/roles/{roleId}           -- Get role details
POST   /api/admin/roles/{roleId}/assign-permission   -- Assign permission to role
DELETE /api/admin/roles/{roleId}/remove-permission   -- Remove permission from role
GET    /api/admin/roles/{roleId}/permissions        -- View role permissions
```

### User Role Assignment
```
POST   /api/admin/users/{userId}/assign-role        -- Assign platform role to user
DELETE /api/admin/users/{userId}/roles/{roleId}     -- Remove platform role from user
GET    /api/admin/users/{userId}/permissions        -- View user's effective permissions
GET    /api/admin/users/{userId}/roles              -- View user's roles
```

### Permission Management
```
GET    /api/admin/permissions              -- List all permissions
GET    /api/admin/permissions/{permId}     -- Get permission details
```

### Employee Management
```
POST   /api/admin/employees                -- Create employee (with optional role)
GET    /api/admin/employees                -- List employees (with filters/pagination)
GET    /api/admin/employees/{empId}        -- Get employee details
PUT    /api/admin/employees/{empId}        -- Update employee (allowed fields)
PUT    /api/admin/employees/{empId}/rmg    -- Change employee's RMG
PUT    /api/admin/employees/{empId}/deactivate -- Deactivate employee
```

### Project Management
```
POST   /api/admin/projects                 -- Create project (with optional manager)
GET    /api/admin/projects                 -- List projects (with filters/pagination)
GET    /api/admin/projects/{projId}        -- Get project details
PUT    /api/admin/projects/{projId}        -- Update project (allowed fields)
PUT    /api/admin/projects/{projId}/manager -- Change project manager
PUT    /api/admin/projects/{projId}/close  -- Close project
```

### RMG Dashboard
```
GET    /api/admin/rmg-dashboard            -- View all RMGs with associate counts
GET    /api/admin/rmg/{rmgId}/associates   -- View employees under specific RMG
POST   /api/admin/rmg/filter               -- Advanced RMG filtering
```

### Search
```
POST   /api/admin/search/employees         -- Search employees with filters
POST   /api/admin/search/projects          -- Search projects with filters
```

### Assignment Replacement
```
GET    /api/admin/assignments/departing/{userId}                    -- Preview assignments
POST   /api/admin/assignments/replace-manager/{departingManagerId}  -- Replace manager
POST   /api/admin/assignments/replace-rmg/{departingRmgId}         -- Replace RMG
```

### Audit
```
GET    /api/admin/audit                    -- List audit events (with filters)
GET    /api/admin/audit/export             -- Export audit as file
GET    /api/admin/reports                  -- List available reports
POST   /api/admin/reports/generate         -- Generate custom report
GET    /api/admin/reports/{reportId}/download -- Download report
```

---

## SECURITY CONSTRAINTS

### System Role Protection
- ✗ Cannot delete ADMIN, MANAGER, RMG, ASSOCIATE roles
- ✗ Cannot modify system role permissions
- ✗ Cannot remove all permissions from ADMIN role
- ✗ Cannot remove the last ADMIN user
- ✗ Cannot disable ADMIN role

### Permission Management
- ✓ System-defined permissions only (MVP)
- ✗ Cannot create arbitrary permissions (MVP)
- ✓ Permissions stored in database
- ✓ Permissions cached, invalidated on change
- ✓ Permission changes take effect immediately for new logins
- ⚠️  JWT-embedded permissions may persist until token expiry

### User Access
- ✓ One platform role per user (MVP)
- ✓ Multiple requirement responsibilities allowed
- ✓ Contextual authorization: role + membership + responsibility + workflow
- ✓ Access recalculation on role/assignment changes
- ✓ User cannot escalate own privileges
- ✓ User cannot modify their own platform role

### Audit & Compliance
- ✓ All admin actions audited: actor, action, entity, timestamp
- ✓ Before/after state captured for sensitive changes
- ✓ Audit trail immutable (no deletion)
- ✓ Audit available for admin export/review
- ✓ Employee deactivation captures: who, when, reason

### Session & Access
- ✓ Admin sessions subject to standard security
- ✓ Failed login attempts locked after 5 attempts
- ✓ Access denied if user disabled
- ✓ Access denied if user role removed
- ⚠️  Session timeout per application config

---

## IMPLEMENTATION NOTES

### Authentication Integration (Prerequisite)
- Confirm UserAccount / Employee relationship
- Confirm how authentication resolves roles
- Confirm JWT contains roles or fetches on each request
- Confirm permission cache invalidation strategy for multi-instance deployments

### Not in Scope (Phase 3.1)
- ✗ Custom role creation (future)
- ✗ Dynamic permission creation (future)
- ✗ RMG workload balancing (requires business definition)
- ✗ Workflow-level authorization (defined per workflow)
- ✗ Project-level role overrides (future)

---

## VALIDATION RULES

### Employee Creation
- emp_id: UNIQUE, non-null
- email: Valid email format, UNIQUE (if used for login)
- designation: Non-null
- department_id: Must reference existing department

### Project Creation
- project_id: UNIQUE, non-null
- name: Non-null
- manager_id: Must reference existing employee with MANAGER role

### RMG Assignment
- rmg_id: Must reference existing employee with RMG role
- employee_id: Must reference existing active employee
- Cannot assign employee to inactive RMG

### Role Assignment
- user_id: Must reference existing user account
- role_id: Must reference existing platform role (not system-protected)
- Cannot assign ADMIN role without explicit override

---

## TESTING STRATEGY

### Permission & Access Tests
```
✓ Admin CAN create employee
✓ Manager CANNOT create employee
✓ RMG CANNOT create employee
✓ Associate CANNOT create employee

✓ Admin CAN change RMG
✓ Manager CANNOT change RMG
✓ RMG CANNOT change RMG
✓ Associate CANNOT change RMG

✓ Admin CAN assign role to user
✓ Manager CANNOT assign role
✓ RMG CANNOT assign role
✓ Associate CANNOT assign role

✓ Admin CANNOT delete ADMIN role
✓ Admin CANNOT remove all permissions from ADMIN
✓ Admin CANNOT remove last ADMIN user
```

### Business Logic Tests
```
✓ Deactivating employee ends allocations
✓ Deactivating employee removes from pool
✓ Changing RMG updates pool ownership
✓ Closing project closes requirements
✓ Manager replacement updates all projects atomically
✓ RMG replacement updates all employees atomically
```

### Audit Tests
```
✓ Employee creation audited
✓ RMG change audited with before/after
✓ Employee deactivation audited with reason
✓ Project close audited
✓ Manager change audited
✓ Role assignment audited
```
