# RBAC Phase 3.1 - Final Design Decisions
## Architecture Sign-Off Document

---

## 1. ADMIN PERMISSIONS - EXACT COUNT & SCOPE

### Phase 3.1 Permissions (28 total)

**Employee Management (7)**
- EMPLOYEE_CREATE
- EMPLOYEE_READ
- EMPLOYEE_UPDATE
- EMPLOYEE_DEACTIVATE
- EMPLOYEE_ASSIGN_RMG
- EMPLOYEE_CHANGE_RMG
- EMPLOYEE_MANAGE_ADMINISTRATIVE

**Project Management (6)**
- PROJECT_CREATE
- PROJECT_READ
- PROJECT_UPDATE
- PROJECT_ASSIGN_MANAGER
- PROJECT_CHANGE_MANAGER
- PROJECT_CLOSE

**Role Management (4) - READ ONLY in MVP**
- ROLE_READ
- ROLE_ASSIGN_USER
- PERMISSION_READ
- USER_ENABLE_DISABLE

**Assignment Management (3)**
- ASSIGNMENT_VIEW
- ASSIGNMENT_REPLACE_MANAGER
- ASSIGNMENT_REPLACE_RMG

**Audit & Reporting (5)**
- AUDIT_READ
- AUDIT_EXPORT
- AUDIT_FILTER
- REPORT_GENERATE
- REPORT_DOWNLOAD

**Search & Discovery (3)**
- EMPLOYEE_SEARCH
- PROJECT_SEARCH
- RMG_VIEW

### Total: 28 permissions

### Explicitly NOT in Phase 3.1
- ❌ ROLE_CREATE (custom roles deferred to Phase 3.2+)
- ❌ ROLE_UPDATE (custom roles deferred to Phase 3.2+)
- ❌ ROLE_DELETE (custom roles deferred to Phase 3.2+)
- ❌ PERMISSION_CREATE (custom permissions deferred to Phase 3.2+)
- ❌ PERMISSION_UPDATE (custom permissions deferred to Phase 3.2+)
- ❌ PERMISSION_DELETE (custom permissions deferred to Phase 3.2+)
- ❌ ROLE_ASSIGN_PERMISSION (deferred until custom roles exist)
- ❌ ROLE_REMOVE_PERMISSION (deferred until custom roles exist)

---

## 2. SYSTEM ROLE MANAGEMENT - READ-ONLY IN MVP

### What Admin CAN do in Phase 3.1:
```
✓ View all system roles (ADMIN, MANAGER, RMG, ASSOCIATE)
✓ View role details
✓ View all system permissions
✓ View permission details
✓ View role-permission mappings
✓ Assign system roles to users
✓ Remove system roles from users
✓ View user's effective permissions
```

### What Admin CANNOT do in Phase 3.1:
```
✗ Create custom roles
✗ Modify system role permissions
✗ Modify system role details
✗ Delete system roles
✗ Assign permissions to roles (that requires custom roles)
✗ Remove permissions from roles (that requires custom roles)
```

### API Implementation:
```
GET    /api/admin/roles                    -- List system roles only
GET    /api/admin/roles/{roleId}           -- Get role details
GET    /api/admin/permissions              -- List all permissions
GET    /api/admin/permissions/{permId}     -- Get permission details
GET    /api/admin/roles/{roleId}/permissions  -- View role-permission mapping

POST   /api/admin/users/{userId}/assign-role           -- Assign role to user
DELETE /api/admin/users/{userId}/roles/{roleId}        -- Remove role from user
GET    /api/admin/users/{userId}/permissions           -- View user permissions
GET    /api/admin/users/{userId}/roles                 -- View user roles
```

### Permission Assignment APIs (DEFERRED to Phase 3.2+):
```
DEFERRED:
POST   /api/admin/roles/{roleId}/assign-permission
DELETE /api/admin/roles/{roleId}/remove-permission
```

---

## 3. EMPLOYEE DEACTIVATION - EXACT STATE TRANSITIONS

### Trigger
Admin calls: `PUT /api/admin/employees/{empId}/deactivate`

### State Changes (Atomic Transaction)

| Record Type            | Current State      | New State           | Notes                                          |
| ---------------------- | ------------------ | ------------------- | ---------------------------------------------- |
| Employee               | ACTIVE             | INACTIVE            | Cannot be reactivated in MVP                   |
| User Account           | ACTIVE             | DISABLED            | Login disabled immediately                     |
| Active Allocations     | ACTIVE             | ENDED                | End date = deactivation date                   |
| Historical Allocations | (any)              | PRESERVED           | No changes, for audit trail                    |
| Resource Pool Record   | ACTIVE             | ENDED                | RMG no longer has ownership                    |
| Scheduled Interviews   | SCHEDULED          | CANCELLED            | Send cancellation notifications                |
| Interview Invitations  | PENDING            | EXPIRED              | Mark as cancelled due to employee deactivation |
| Active Candidates      | IN_POOL            | REMOVED              | Remove from all active pools                   |
| Pending Opportunities  | OPEN/IN_PROGRESS   | CLOSED              | Close with reason: "Employee deactivated"      |
| Requirement Ownership  | (owned)            | UNASSIGNED           | Only if employee was direct owner              |
| Project Membership     | ACTIVE             | REMOVED              | Remove from all project teams                  |
| Audit History          | (any)              | PRESERVED           | Keep all historical audit records              |

### Implementation
```java
@Transactional
public void deactivateEmployee(Long employeeId, DeactivateEmployeeRequest request) {
    // 1. Validate
    Employee emp = getEmployee(employeeId);
    if (emp.getStatus() == INACTIVE) throw new AlreadyInactiveException();
    
    // 2. Set status to INACTIVE
    emp.setStatus(INACTIVE);
    emp.setDeactivatedAt(now());
    emp.setDeactivationReason(request.getReason());
    employeeRepository.save(emp);
    
    // 3. Disable user account
    User user = emp.getUser();
    user.setStatus(DISABLED);
    userRepository.save(user);
    
    // 4. End active allocations
    List<Allocation> activeAllocations = allocationRepository.findByEmployeeIdAndStatus(employeeId, ACTIVE);
    for (Allocation alloc : activeAllocations) {
        alloc.setStatus(ENDED);
        alloc.setEndDate(now());
        allocationRepository.save(alloc);
        auditService.logAction("DEACTIVATE", "ALLOCATION", alloc.getId(), before, after, reason);
    }
    
    // 5. Remove from resource pool
    ResourcePoolAssignment poolAssign = poolAssignmentRepository.findByEmployeeId(employeeId);
    if (poolAssign != null && poolAssign.isActive()) {
        poolAssign.setActive(false);
        poolAssign.setRemovedAt(now());
        poolAssignmentRepository.save(poolAssign);
    }
    
    // 6. Cancel scheduled interviews (event-based)
    publishEvent(new EmployeeDeactivated(employeeId, reason));
    
    // 7. Audit the deactivation
    auditService.logAction(
        getCurrentUserId(),
        "DEACTIVATE",
        "EMPLOYEE",
        employeeId,
        beforeState,
        afterState,
        request.getReason()
    );
}
```

### Cascading Events
```
EmployeeDeactivated(employeeId, reason)
  └─ Listeners:
     ├─ InterviewService → Cancel scheduled interviews
     ├─ OpportunityService → Close pending opportunities
     ├─ ProjectService → Remove from project teams
     ├─ CandidateService → Remove from candidate pools
     └─ NotificationService → Notify managers, RMG
```

### What Is NOT Changed
- Historical records (allocations, interviews, candidates) are preserved
- Audit trail is preserved
- Employee profile data is preserved (name, emp_id, etc.)
- Department/location are preserved

---

## 4. PROJECT CLOSURE - EXACT STATE TRANSITIONS

### Trigger
Admin calls: `PUT /api/admin/projects/{projId}/close`

### State Changes (Atomic Transaction)

| Record Type            | Current State      | New State           | Notes                                          |
| ---------------------- | ------------------ | ------------------- | ---------------------------------------------- |
| Project                | ACTIVE             | CLOSED              | Closed date = closure date                     |
| Open Requirements      | OPEN/IN_PROGRESS   | CLOSED              | Close with reason: "Project closed"            |
| Draft Requirements     | DRAFT              | ARCHIVED            | Do not close draft requirements                |
| Scheduled Interviews   | SCHEDULED          | CANCELLED           | All scheduled interviews cancelled             |
| Active Allocations     | ACTIVE             | RELEASED            | Release all project team members               |
| Candidate Pipelines    | ACTIVE             | ARCHIVED            | Archive all pipelines for closed requirements  |
| Active Candidates      | SELECTED/IN_POOL   | ARCHIVED            | Archive candidates in project's pools          |
| Project Manager Access | (has access)       | REVOKED             | Manager loses project visibility               |
| Team Member Access     | (has access)       | REVOKED             | All team members lose project access           |
| Audit History          | (any)              | PRESERVED           | Keep all historical records                    |

### Implementation
```java
@Transactional
public void closeProject(Long projectId, CloseProjectRequest request) {
    // 1. Validate
    Project proj = getProject(projectId);
    if (proj.getStatus() == CLOSED) throw new AlreadyClosedException();
    
    // 2. Set project status to CLOSED
    proj.setStatus(CLOSED);
    proj.setClosedAt(now());
    proj.setClosureReason(request.getReason());
    projectRepository.save(proj);
    
    // 3. Close open requirements
    List<Requirement> openReqs = requirementRepository.findByProjectIdAndStatus(projectId, OPEN);
    for (Requirement req : openReqs) {
        req.setStatus(CLOSED);
        req.setClosedAt(now());
        requirementRepository.save(req);
        auditService.logAction("CLOSE", "REQUIREMENT", req.getId(), before, after, reason);
    }
    
    // 4. Archive draft requirements (do not close)
    List<Requirement> draftReqs = requirementRepository.findByProjectIdAndStatus(projectId, DRAFT);
    for (Requirement req : draftReqs) {
        req.setStatus(ARCHIVED);
        requirementRepository.save(req);
    }
    
    // 5. Release allocations
    List<Allocation> activeAllocs = allocationRepository.findByProjectIdAndStatus(projectId, ACTIVE);
    for (Allocation alloc : activeAllocs) {
        alloc.setStatus(RELEASED);
        alloc.setReleasedAt(now());
        allocationRepository.save(alloc);
    }
    
    // 6. Publish ProjectClosed event
    publishEvent(new ProjectClosed(projectId, reason));
    
    // 7. Audit the closure
    auditService.logAction(
        getCurrentUserId(),
        "CLOSE",
        "PROJECT",
        projectId,
        beforeState,
        afterState,
        request.getReason()
    );
}
```

### Cascading Events
```
ProjectClosed(projectId, reason)
  └─ Listeners:
     ├─ InterviewService → Cancel scheduled interviews
     ├─ CandidateService → Archive pipelines and candidates
     ├─ AllocationService → Release team members
     ├─ AccessService → Revoke manager and team member access
     └─ NotificationService → Notify manager and team
```

### What Is NOT Changed
- Historical records (requirements, allocations, interviews, candidates) are preserved
- Audit trail is preserved
- Project details (name, domain, budget) are preserved
- Manager assignment is preserved (for historical reference)

---

## 5. MANAGER REPLACEMENT - REQUIREMENT OWNERSHIP CLARITY

### CRITICAL: Requirements Are NOT Auto-Transferred

The current implementation plan says:

```
For each requirement:
    Update requirement.manager_id = newManagerId
```

**This is INCORRECT.**

### Corrected Logic

A project may have requirements with different ownership models:

```
Requirement (typically has):
  ├── project_id (which project)
  ├── owner_id (who created/owns it - may be project manager, may be someone else)
  ├── sourcer_id (assigned SOURCER responsibility)
  ├── interviewer_ids (assigned INTERVIEWER responsibilities)
  └── coordinator_id (assigned COORDINATOR responsibility)
```

**During Manager replacement:**

Only transfer requirements where the **departing manager is the direct owner**.

Do NOT auto-transfer just because they're in the same project.

### Correct Implementation

```
Preview:
  ├── Projects managed by departing manager
  ├── Requirements directly owned by departing manager (owner_id = departing_manager_id)
  ├── Responsibilities assigned to departing manager
  │   ├── SOURCER for requirement X
  │   ├── INTERVIEWER for requirement Y
  │   └── COORDINATOR for requirement Z
  └── Project team memberships

Execution (only transfer if explicitly selected):
  ├── For each selected project:
  │   └── Update project.manager_id = newManagerId
  │
  ├── For each selected requirement:
  │   └── Update requirement.owner_id = newManagerId (ONLY if they were the owner)
  │
  └── For each selected responsibility:
      ├── Update SOURCER = newManager (if required)
      ├── Update INTERVIEWER = newManager (if required)
      └── Update COORDINATOR = newManager (if required)
```

### API Contract

```json
GET /api/admin/assignments/departing/{departingManagerId}
Response: {
  "projects": [
    {"projectId": 1, "projectName": "ProjectA", "selected": true}
  ],
  "requirementsOwned": [
    {"reqId": 101, "reqName": "Req1", "selected": true},
    {"reqId": 102, "reqName": "Req2", "selected": false}
  ],
  "responsibilities": [
    {"reqId": 101, "responsibility": "SOURCER", "selected": true},
    {"reqId": 103, "responsibility": "INTERVIEWER", "selected": false}
  ],
  "projectMemberships": [...]
}

POST /api/admin/assignments/replace-manager/{departingManagerId}
Request: {
  "newManagerId": 5,
  "selectedProjects": [1],
  "selectedRequirements": [101],  // ONLY owned requirements
  "selectedResponsibilities": [
    {"reqId": 101, "responsibility": "SOURCER"}
  ]
}
```

---

## 6. JWT vs SERVER-SIDE PERMISSION RESOLUTION

### DECISION: SERVER-SIDE PERMISSION RESOLUTION (Recommended)

**JWT contains:**
- User ID
- Authentication claims (exp, iat, iss)
- Basic auth metadata

**JWT does NOT contain:**
- Permissions
- Roles (optional: platform role only, NOT permissions)
- Access scope

**Permission resolution:**
```
1. Extract user_id from JWT
2. Verify JWT signature and expiration
3. Load user's current roles from database
4. Load permissions for those roles from cache
5. Evaluate contextual access (project, requirement, workflow)
6. Grant or deny
```

### Why Server-Side?
- ✓ Permission changes take effect immediately
- ✓ Role removal is safe (no token hijacking with old permissions)
- ✓ User deactivation is immediate
- ✓ Security: centralized control
- ✗ Slightly higher latency (cache mitigates this)

### Implementation
```java
@RestController
@RequestMapping("/api/admin/...")
public class AdminController {
    
    @GetMapping("/employees")
    @PreAuthorize("hasPermission('EMPLOYEE_READ')")
    public List<Employee> listEmployees() {
        // At method entry, Spring Security evaluates:
        // 1. Is token valid?
        // 2. Load current user from JWT subject
        // 3. Load current roles from database
        // 4. Load permissions from cache
        // 5. Check: hasPermission('EMPLOYEE_READ')
        // ... proceed
    }
}
```

### Permission Cache Strategy
```
PermissionCache
  ├── Key: roleId
  ├── Value: Set<Permission>
  ├── TTL: 5 minutes (configurable)
  ├── Invalidation: On role-permission change
  └── Multi-instance: Event bus (Kafka/RabbitMQ) or polling
```

### JWT Content (Example)
```json
{
  "sub": "user:123",
  "email": "admin@company.com",
  "role": "ADMIN",
  "exp": 1234567890,
  "iat": 1234567800
}
```

NOT:
```json
{
  "sub": "user:123",
  "permissions": ["EMPLOYEE_CREATE", "EMPLOYEE_READ", ...],
  ...
}
```

---

## 7. AUDIT PERSISTENCE STRATEGY

### DECISION: SYNCHRONOUS AUDIT FOR CRITICAL OPERATIONS

**Critical operations** (must audit before committing):
- Employee deactivation
- Project closure
- Manager replacement
- RMG replacement
- Role assignment
- Admin promotion

**Non-critical operations** (can audit asynchronously):
- Employee creation
- Project creation
- Search queries
- View operations

### Implementation

```java
@Service
@Transactional
public class AdminEmployeeService {
    
    @Auditable(
        action = "DEACTIVATE",
        entity = "EMPLOYEE",
        critical = true  // Synchronous
    )
    public void deactivateEmployee(Long empId, DeactivateEmployeeRequest req) {
        // BEFORE: Load current state
        Employee emp = employeeRepository.findById(empId).orElseThrow();
        EmployeeSnapshot before = emp.snapshot();
        
        // CHANGE
        emp.setStatus(INACTIVE);
        emp.setDeactivationReason(req.getReason());
        
        // PERSIST in same transaction
        employeeRepository.save(emp);
        
        // AUDIT in same transaction (CRITICAL)
        auditService.logAction(
            getCurrentUserId(),
            "DEACTIVATE",
            "EMPLOYEE",
            empId,
            before,           // before state
            emp.snapshot(),    // after state
            req.getReason()    // context
        );
        
        // Both persist or both rollback
        // Transaction completes
        
        // AFTER commit: Publish event
        publishEvent(new EmployeeDeactivated(empId, req.getReason()));
    }
}
```

### Audit Service Implementation

```java
@Service
public class AuditService {
    
    @Autowired
    private AuditLogRepository auditRepository;
    
    @Transactional(propagation = Propagation.MANDATORY)
    public void logAction(
        Long actorUserId,
        String action,
        String entityType,
        Long entityId,
        Object beforeState,
        Object afterState,
        String context  // reason, comment, etc.
    ) {
        AuditLog log = AuditLog.builder()
            .userId(actorUserId)
            .action(action)
            .entityType(entityType)
            .entityId(entityId)
            .beforeState(serialize(beforeState))  // JSON
            .afterState(serialize(afterState))    // JSON
            .context(context)
            .timestamp(now())
            .ipAddress(getClientIp())
            .userAgent(getUserAgent())
            .build();
        
        auditRepository.save(log);  // Same transaction
    }
}
```

### Propagation Rules
- MANDATORY: Audit must be in same transaction as business operation
- REQUIRES_NEW: Not allowed (would decouple audit from change)
- NESTED: Use only if database supports savepoints
- SUPPORTS: Use only for read-only queries

### Failure Handling
```
If audit fails:
  ├── TransactionManager rolls back EVERYTHING
  ├── Business change is NOT persisted
  ├── Audit is NOT persisted
  └── Client sees error: "Operation failed. No changes made."
  
This is acceptable because:
  - Either business + audit succeed together
  - Or both fail together
  - No orphaned audit records
  - No unaudited business changes
```

---

## 8. IMPORTANT CLARIFICATIONS

### One Platform Role per User (Confirmed)

Each user has exactly ONE platform role:
- ADMIN
- MANAGER
- RMG
- ASSOCIATE

A user may ALSO have:
- Multiple project memberships (with their platform role applied per project)
- Multiple requirement responsibilities (SOURCER, INTERVIEWER, COORDINATOR)
- Multiple workflow responsibilities

But platform role is singular per user in Phase 3.1. This is an intentional MVP constraint.

If future business requires a user to be both "Manager" and "RMG" simultaneously, that would require Phase 4+ enhancement.

### Transaction vs Post-Commit Events (Clarified)

**Synchronous (must complete in main transaction):**
- Employee status change (ACTIVE → INACTIVE)
- User account disable
- Allocation ending
- RMG assignment removal
- Requirement ownership update
- Resource pool record updates
- Access recalculation
- Audit log persistence for critical operations

**Asynchronous (after transaction commit):**
- Email notifications
- Cancellation notifications
- External system updates
- Search index refreshes
- Non-critical reporting updates
- Event publishing to other services

**Rule**: All required database state transitions must complete WITHIN the main transaction. Events are for post-commit side effects only, not as replacements for mandatory state changes.

### Search Visibility Rules (By Role)

Search infrastructure is shared across all roles. Visibility is controlled by contextual authorization:

- **Admin**: All employees, all projects, full visibility
- **Manager**: Employees in managed projects, assigned projects only
- **RMG**: Assigned employees, projects with assigned employees
- **Associate**: Self only, peers in shared requirements

Unauthorized records must not appear through filters, pagination, or sorting.

---

## 9. COMPLETE AUTHORIZATION MATRIX

### All Roles & Platform Permissions

| Action                 | ADMIN   | MANAGER | RMG     | ASSOCIATE | Context                      |
| ---------------------- | ------- | ------- | ------- | --------- | ---------------------------- |
| **EMPLOYEE MGMT**      |         |         |         |           |                              |
| Create employee        | ✓       | ✗       | ✗       | ✗         | Global                      |
| Read employee          | ✓ ALL   | ✓ Scoped | ✓ Scoped | ✓ Own      | Admin=all, Manager=project, RMG=assigned, Associate=own |
| Update employee        | ✓       | ✓       | ✓       | ✓         | Admin=all fields, Others=limited |
| Deactivate employee    | ✓       | ✗       | ✗       | ✗         | Global, lifecycle operation |
| Assign RMG             | ✓       | ✗       | ✗       | ✗         | At creation or change       |
| Change RMG             | ✓       | ✗       | ✗       | ✗         | Global, lifecycle operation |
| **PROJECT MGMT**       |         |         |         |           |                              |
| Create project         | ✓       | ✓       | ✗       | ✗         | Admin=global, Manager=own   |
| Read project           | ✓ ALL   | ✓ Scoped | ✓ Scoped | ✓ Scoped   | Admin=all, Manager=managed, RMG=team, Associate=assigned |
| Update project         | ✓       | ✓       | ✗       | ✗         | Admin=all, Manager=owned    |
| Assign Manager         | ✓       | ✗       | ✗       | ✗         | At creation or change       |
| Change Manager         | ✓       | ✗       | ✗       | ✗         | Global, lifecycle operation |
| Close project          | ✓       | ✗       | ✗       | ✗         | Global, lifecycle operation |
| **ROLE MGMT (MVP)**    |         |         |         |           |                              |
| View roles             | ✓       | ✓       | ✓       | ✓         | All can view (Phase 3.2+)   |
| Assign role to user    | ✓       | ✗       | ✗       | ✗         | System roles only in MVP    |
| Remove role from user  | ✓       | ✗       | ✗       | ✗         | System roles only in MVP    |
| View permissions       | ✓       | ✓       | ✓       | ✓         | All can view (Phase 3.2+)   |
| **ASSIGNMENTS**        |         |         |         |           |                              |
| View departing assign  | ✓       | ✗       | ✗       | ✗         | Global, internal operation |
| Replace Manager        | ✓       | ✗       | ✗       | ✗         | Global, lifecycle operation |
| Replace RMG            | ✓       | ✗       | ✗       | ✗         | Global, lifecycle operation |
| **AUDIT & REPORTS**    |         |         |         |           |                              |
| View audit             | ✓       | ✓       | ✓       | ✗         | Admin=all, Manager=own actions, RMG=own actions |
| Export audit           | ✓       | ✗       | ✗       | ✗         | Global, requires audit read |
| Generate report        | ✓       | ✗       | ✗       | ✗         | Global                      |
| Download report        | ✓       | ✗       | ✗       | ✗         | Global                      |
| **SEARCH**             |         |         |         |           |                              |
| Search employees       | ✓ ALL   | ✓ Scoped | ✓ Assigned | ✓ Peers   | Scoped by contextual access |
| Search projects        | ✓ ALL   | ✓ Assigned | ✗ | ✗         | Manager=assigned, RMG=projects with assigned employees |
| View RMG dashboard     | ✓       | ✗       | ✓       | ✗         | RMG can view all RMGs in org |

### Contextual Conditions

**Manager scope:**
- Can only see employees in their projects
- Can only see projects they manage
- Can only see requirements in their projects

**RMG scope:**
- Can see employees assigned to them
- Can see projects with assigned employees
- Can update own pool (Phase 3.2+)

**Associate scope:**
- Can see own profile
- Can see projects they're assigned to
- Cannot see other associates (except in requirement workflows)

---

## FINAL APPROVAL CHECKLIST

- [x] 28 permissions defined and counted correctly
- [x] System role management read-only in MVP (no permission assignment)
- [x] Employee deactivation state transitions defined
- [x] Project closure state transitions defined
- [x] Manager replacement does NOT auto-transfer requirements
- [x] JWT strategy: server-side permission resolution (not embedded)
- [x] Audit strategy: synchronous for critical operations
- [x] Complete authorization matrix defined
- [x] All cascading events documented
- [x] All validation rules specified
- [x] All failure scenarios addressed
- [x] All scopes and contextual access defined

---

## NEXT STEP

Proceed with Phase 3.1 development using these final design decisions as the authoritative source of truth.

If any ambiguity arises during implementation, reference this document first before making assumptions.
