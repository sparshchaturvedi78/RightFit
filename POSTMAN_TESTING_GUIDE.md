# RightFit Admin RBAC - Postman Testing Guide

**Phase 3.1 Complete Implementation - Admin Role Testing**  
**Date**: 2026-09-15  
**Collection**: `RIGHTFIT_ADMIN_RBAC_API.postman_collection.json`

---

## 📋 Table of Contents

1. [Setup Instructions](#setup-instructions)
2. [API Endpoints Overview](#api-endpoints-overview)
3. [Testing Workflow](#testing-workflow)
4. [Expected Responses](#expected-responses)
5. [Error Handling](#error-handling)
6. [Success Validation Checklist](#success-validation-checklist)

---

## 🚀 Setup Instructions

### Step 1: Import Postman Collection
1. Open Postman
2. Click **"Import"** in top left
3. Select **`RIGHTFIT_ADMIN_RBAC_API.postman_collection.json`**
4. Click **"Import"**

### Step 2: Configure Environment Variables
In Postman, set the following variables:

```
baseURL: http://localhost:8080
adminToken: [Will be set automatically after login]
employeeId: [Will be set automatically after employee creation]
projectId: [Will be set automatically after project creation]
```

### Step 3: Update Test Credentials
Before running tests, ensure your database has:
- **Admin User**: `admin@rightfit.com` / `Admin@123`
- **RMG User**: At least one employee with RMG role
- **Departments**: At least 1 department (ID: 1)
- **Locations**: At least 1 location (ID: 1)

---

## 📡 API Endpoints Overview

### Total Endpoints: 35+

| Category | Endpoints | Status |
|----------|-----------|--------|
| Authentication | 1 | ✅ |
| Role Management | 4 | ✅ |
| Permission Management | 4 | ✅ |
| User Roles | 5 | ✅ |
| Employee Management | 7 | ✅ |
| Project Management | 7 | ✅ |
| Search APIs | 2 | ✅ |
| RMG Dashboard | 4 | ✅ |
| Assignment Replacement | 4 | ✅ |
| Audit & Reporting | 7 | ✅ |

---

## 🧪 Testing Workflow

### Recommended Test Order

#### **Phase 1: Authentication & Authorization**

1. **Login - Get Admin Token**
   - **Request**: POST `/api/auth/login`
   - **Body**:
     ```json
     {
       "email": "admin@rightfit.com",
       "password": "Admin@123"
     }
     ```
   - **Expected Response** (200 OK):
     ```json
     {
       "accessToken": "eyJhbGc...",
       "tokenType": "Bearer",
       "userId": 1,
       "email": "admin@rightfit.com"
     }
     ```
   - **Action**: Copy the `accessToken` value and set it as `adminToken` variable

---

#### **Phase 2: View System Roles & Permissions**

2. **Get All Roles**
   - **Request**: GET `/api/admin/roles`
   - **Expected Response** (200 OK):
     ```json
     [
       {
         "id": 1,
         "name": "ADMIN",
         "roleType": "SYSTEM",
         "isModifiable": false,
         "description": "Administrator role with all permissions"
       },
       {
         "id": 2,
         "name": "MANAGER",
         "roleType": "SYSTEM",
         "isModifiable": false
       },
       {
         "id": 3,
         "name": "RMG",
         "roleType": "SYSTEM",
         "isModifiable": false
       },
       {
         "id": 4,
         "name": "ASSOCIATE",
         "roleType": "SYSTEM",
         "isModifiable": false
       }
     ]
     ```

3. **Get System Permissions**
   - **Request**: GET `/api/admin/permissions/system`
   - **Expected Response** (200 OK):
     ```json
     [
       {
         "id": 1,
         "name": "EMPLOYEE_CREATE",
         "resource": "EMPLOYEE",
         "action": "CREATE",
         "scope": "GLOBAL",
         "isSystem": true,
         "isActive": true
       },
       // ... 27 more system permissions
     ]
     ```

---

#### **Phase 3: Employee Management Workflow**

4. **Create Employee**
   - **Request**: POST `/api/admin/employees`
   - **Body**:
     ```json
     {
       "employeeId": "EMP001",
       "firstName": "John",
       "lastName": "Doe",
       "email": "john.doe@rightfit.com",
       "designation": "Senior Developer",
       "departmentId": 1,
       "rmgId": 1,
       "yearsOfExperience": 5.5,
       "workingHoursPerDay": 8.0,
       "optionalRoleId": 2
     }
     ```
   - **Expected Response** (201 Created):
     ```json
     {
       "id": 10,
       "employeeId": "EMP001",
       "firstName": "John",
       "lastName": "Doe",
       "email": "john.doe@rightfit.com",
       "designation": "Senior Developer",
       "employmentStatus": "ACTIVE",
       "allocationStatus": "AVAILABLE",
       "availabilityStatus": "AVAILABLE",
       "userId": null,
       "rmgId": 1,
       "rmgName": "RMG Manager",
       "departmentId": 1,
       "createdAt": "2026-09-15T10:30:00",
       "updatedAt": "2026-09-15T10:30:00"
     }
     ```
   - **Action**: Copy `id` and set as `employeeId` variable

5. **Get Employee Details**
   - **Request**: GET `/api/admin/employees/{{employeeId}}`
   - **Expected Response** (200 OK): Employee object with all details

6. **Update Employee**
   - **Request**: PUT `/api/admin/employees/{{employeeId}}`
   - **Body**:
     ```json
     {
       "firstName": "Jonathan",
       "designation": "Lead Developer",
       "yearsOfExperience": 6.0
     }
     ```
   - **Expected Response** (200 OK): Updated employee object

7. **Change Employee RMG**
   - **Request**: PUT `/api/admin/employees/{{employeeId}}/rmg`
   - **Body**:
     ```json
     {
       "newRmgId": 2,
       "reason": "Employee moved to new team"
     }
     ```
   - **Expected Response** (204 No Content)

8. **Search Employees**
   - **Request**: GET `/api/admin/employees?firstName=John&status=ACTIVE&page=0&size=20`
   - **Expected Response** (200 OK):
     ```json
     {
       "content": [
         // Employee objects
       ],
       "pageNumber": 0,
       "pageSize": 20,
       "totalElements": 1,
       "totalPages": 1,
       "isFirst": true,
       "isLast": true,
       "hasNext": false,
       "hasPrevious": false
     }
     ```

---

#### **Phase 4: Project Management Workflow**

9. **Create Project**
   - **Request**: POST `/api/admin/projects`
   - **Body**:
     ```json
     {
       "projectId": "PROJ001",
       "projectName": "Mobile App Development",
       "description": "New mobile application",
       "managerId": 2,
       "clientName": "Tech Innovations Inc",
       "startDate": "2026-10-01",
       "endDate": "2027-03-31",
       "status": "ACTIVE"
     }
     ```
   - **Expected Response** (201 Created):
     ```json
     {
       "id": 5,
       "projectId": "PROJ001",
       "projectName": "Mobile App Development",
       "managerId": 2,
       "managerName": "Manager Name",
       "status": "ACTIVE",
       "startDate": "2026-10-01",
       "endDate": "2027-03-31",
       "createdAt": "2026-09-15T10:35:00"
     }
     ```
   - **Action**: Copy `id` and set as `projectId` variable

10. **Get Project Details**
    - **Request**: GET `/api/admin/projects/{{projectId}}`
    - **Expected Response** (200 OK): Project object

11. **Update Project**
    - **Request**: PUT `/api/admin/projects/{{projectId}}`
    - **Body**:
      ```json
      {
        "projectName": "Mobile App - Phase 2",
        "endDate": "2027-06-30"
      }
      ```
    - **Expected Response** (200 OK): Updated project

12. **Change Project Manager**
    - **Request**: PUT `/api/admin/projects/{{projectId}}/manager`
    - **Body**:
      ```json
      {
        "newManagerId": 3,
        "reason": "Manager transition"
      }
      ```
    - **Expected Response** (204 No Content)

13. **Search Projects**
    - **Request**: GET `/api/admin/projects?projectName=Mobile&status=ACTIVE&page=0&size=20`
    - **Expected Response** (200 OK): Paginated project list

---

#### **Phase 5: User Role Management**

14. **Get User Roles**
    - **Request**: GET `/api/admin/user-roles/user/1`
    - **Expected Response** (200 OK):
      ```json
     [
       {
         "id": 1,
         "userId": 1,
         "roleId": 1,
         "roleName": "ADMIN",
         "assignedBy": 1,
         "isActive": true,
         "createdAt": "2026-01-01T00:00:00"
       }
     ]
     ```

15. **Assign Role to User**
    - **Request**: POST `/api/admin/user-roles/assign?userId=2&roleId=2`
    - **Expected Response** (201 Created): Role assignment confirmation

16. **Deactivate User Roles**
    - **Request**: POST `/api/admin/user-roles/deactivate?userId=2`
    - **Expected Response** (204 No Content): All user roles deactivated

---

#### **Phase 6: RMG Dashboard**

17. **Get RMG Dashboard**
    - **Request**: GET `/api/admin/rmg/dashboard`
    - **Expected Response** (200 OK):
      ```json
      [
        {
          "rmgId": 1,
          "rmgName": "RMG Manager",
          "email": "rmg@rightfit.com",
          "department": "Sales",
          "designation": "Resource Manager",
          "associateCount": 5,
          "status": "ACTIVE"
        }
      ]
      ```

18. **Get RMG Associates**
    - **Request**: GET `/api/admin/rmg/1/associates?page=0&size=20`
    - **Expected Response** (200 OK):
      ```json
      {
        "content": [
          {
            "id": 10,
            "employeeId": "EMP001",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john.doe@rightfit.com",
            "designation": "Developer",
            "employmentStatus": "ACTIVE"
          }
        ],
        "pageNumber": 0,
        "pageSize": 20,
        "totalElements": 5,
        "totalPages": 1
      }
      ```

---

#### **Phase 7: Assignment Replacement (Critical)**

19. **Preview Manager Assignments**
    - **Request**: GET `/api/admin/assignments/departing/manager/2`
    - **Expected Response** (200 OK):
      ```json
      {
        "departingId": 2,
        "departingName": "Old Manager",
        "departingRole": "MANAGER",
        "projectCount": 3,
        "ownedRequirementCount": 0,
        "responsibilityCount": 0,
        "message": "Manager has 3 projects assigned"
      }
      ```

20. **Replace Manager**
    - **Request**: POST `/api/admin/assignments/replace-manager/2`
    - **Body**:
      ```json
      {
        "newManagerId": 3,
        "selectedProjectIds": [1, 2, 3],
        "selectedOwnedRequirementIds": [],
        "selectedResponsibilities": []
      }
      ```
    - **Expected Response** (200 OK):
      ```json
      {
        "success": true,
        "message": "Manager replacement completed successfully",
        "affectedCounts": {
          "projects": 3,
          "requirements": 0
        }
      }
      ```

21. **Preview RMG Assignments**
    - **Request**: GET `/api/admin/assignments/departing/rmg/1`
    - **Expected Response** (200 OK): RMG assignment preview

22. **Replace RMG**
    - **Request**: POST `/api/admin/assignments/replace-rmg/1`
    - **Body**:
      ```json
      {
        "newRmgId": 2,
        "selectedEmployeeIds": [1, 2, 3, 4, 5]
      }
      ```
    - **Expected Response** (200 OK):
      ```json
      {
        "success": true,
        "message": "RMG replacement completed successfully",
        "affectedCounts": {
          "employees": 5
        }
      }
      ```

---

#### **Phase 8: Audit & Reporting**

23. **Get All Audit Logs**
    - **Request**: GET `/api/admin/audit?page=0&size=20&sortBy=createdAt&sortDirection=DESC`
    - **Expected Response** (200 OK):
      ```json
      {
        "content": [
          {
            "id": 100,
            "auditId": "AUD-2026-001",
            "userId": 1,
            "performedByEmail": "admin@rightfit.com",
            "action": "CREATE",
            "entityType": "EMPLOYEE",
            "entityId": 10,
            "oldValue": null,
            "newValue": "{\"employeeId\":\"EMP001\",...}",
            "changeSummary": "Employee created",
            "ipAddress": "127.0.0.1",
            "userAgent": "PostmanRuntime/7.x",
            "timestamp": "2026-09-15T10:30:00"
          }
        ],
        "pageNumber": 0,
        "pageSize": 20,
        "totalElements": 50,
        "totalPages": 3
      }
      ```

24. **Get Audit by Entity Type**
    - **Request**: GET `/api/admin/audit/entity/EMPLOYEE?page=0&size=20`
    - **Expected Response** (200 OK): Audit logs filtered by entity

25. **Get Audit by Date Range**
    - **Request**: GET `/api/admin/audit/date-range?startDate=2026-09-01&endDate=2026-09-30`
    - **Expected Response** (200 OK): Audit logs within date range

26. **Get Available Reports**
    - **Request**: GET `/api/admin/reports`
    - **Expected Response** (200 OK):
      ```json
      [
        "EMPLOYEE_ACTIVITY",
        "PROJECT_ACTIVITY",
        "ADMIN_ACTION",
        "USER_ACCESS"
      ]
      ```

27. **Generate Report**
    - **Request**: POST `/api/admin/reports/generate`
    - **Body**:
      ```json
      {
        "reportType": "EMPLOYEE_ACTIVITY",
        "startDate": "2026-09-01",
        "endDate": "2026-09-30",
        "format": "PDF"
      }
      ```
    - **Expected Response** (200 OK):
      ```json
      {
        "id": 1,
        "reportType": "EMPLOYEE_ACTIVITY",
        "status": "PROCESSING",
        "generatedAt": "2026-09-15T10:45:00",
        "format": "PDF",
        "message": "Report generation started"
      }
      ```

---

## 📊 Expected Responses

### Success Responses (HTTP 200, 201, 204)

**200 OK**: GET requests, successful retrieval
- Returns entity or paginated list
- Body contains data

**201 Created**: POST requests (create operations)
- New resource created
- Body contains created entity with generated ID

**204 No Content**: PUT/DELETE requests (updates/deletions)
- Operation successful
- Empty body

### Error Responses

**400 Bad Request**: Invalid input
```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "First name is required",
  "details": ["firstName cannot be blank"],
  "path": "/api/admin/employees",
  "timestamp": "2026-09-15T10:00:00",
  "status": 400
}
```

**403 Forbidden**: Insufficient permissions
```json
{
  "errorCode": "PERMISSION_DENIED",
  "message": "User does not have permission: EMPLOYEE_CREATE",
  "path": "/api/admin/employees",
  "timestamp": "2026-09-15T10:00:00",
  "status": 403
}
```

**404 Not Found**: Resource not found
```json
{
  "errorCode": "NOT_FOUND",
  "message": "Employee not found with id: 999",
  "path": "/api/admin/employees/999",
  "timestamp": "2026-09-15T10:00:00",
  "status": 404
}
```

**409 Conflict**: Business logic violation
```json
{
  "errorCode": "SYSTEM_ROLE_MODIFICATION",
  "message": "Cannot delete system role: ADMIN",
  "details": "System roles are immutable",
  "path": "/api/admin/roles/1",
  "timestamp": "2026-09-15T10:00:00",
  "status": 409
}
```

**500 Internal Server Error**: Server error
```json
{
  "errorCode": "INTERNAL_ERROR",
  "message": "An unexpected error occurred",
  "path": "/api/admin/employees",
  "timestamp": "2026-09-15T10:00:00",
  "status": 500
}
```

---

## ✅ Success Validation Checklist

After running all tests, verify:

### Authentication
- [ ] Login returns valid JWT token
- [ ] Token can be used for subsequent requests

### Roles & Permissions
- [ ] 4 system roles exist (ADMIN, MANAGER, RMG, ASSOCIATE)
- [ ] 28 system permissions are active
- [ ] System roles cannot be modified

### Employee Management
- [ ] Employee created with ACTIVE status
- [ ] Employee can be updated (partial fields)
- [ ] RMG can be changed
- [ ] Search works with multiple filters
- [ ] Employee can be deactivated

### Project Management
- [ ] Project created with ACTIVE status
- [ ] Project can be updated
- [ ] Project manager can be changed
- [ ] Projects can be closed
- [ ] Search works with filters

### User Roles
- [ ] Roles can be assigned to users
- [ ] User roles can be deactivated
- [ ] User roles can be reactivated

### RMG Dashboard
- [ ] Dashboard lists all RMGs with associate counts
- [ ] Associate count is accurate
- [ ] Associates can be listed with pagination

### Assignment Replacement
- [ ] Manager replacement is atomic (all projects updated)
- [ ] RMG replacement is atomic (all employees updated)
- [ ] Audit logs manager/RMG changes

### Audit & Reporting
- [ ] Audit logs all CRUD operations
- [ ] Audit captures before/after state
- [ ] Audit can be filtered by date, entity, action
- [ ] Reports can be generated

---

## 🔍 Common Testing Issues & Solutions

### Issue: 401 Unauthorized
**Solution**: 
- Verify token is set in `adminToken` variable
- Re-run "Login - Get Admin Token" request
- Check token hasn't expired (usually 1 hour)

### Issue: 403 Permission Denied
**Solution**:
- Verify user has ADMIN role
- Check permission name is correct
- Ensure permission is active in database

### Issue: 404 Not Found
**Solution**:
- Verify resource ID exists
- Check you're using correct ID variable (employeeId, projectId)
- Retry after creating the resource

### Issue: 409 Conflict
**Solution**:
- System roles cannot be modified
- Last admin cannot be removed
- Duplicate employee IDs/emails rejected
- Deactivated users cannot get new roles

### Issue: 500 Internal Server Error
**Solution**:
- Check backend logs
- Verify database connection
- Ensure all required fields are provided
- Restart backend service

---

## 📝 Additional Notes

### Pagination
All list endpoints support pagination:
```
?page=0&size=20&sortBy=fieldName&sortDirection=ASC|DESC
```

### Date Formats
All dates in ISO 8601 format:
```
"2026-09-15T10:30:00"
```

### Authentication
All endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <token>
```

### Atomic Operations
Manager/RMG replacements are atomic:
- All affected records updated together
- Rollback if any failure
- Audit trail includes all changes

---

## 🎯 Quick Test Scenarios

### Scenario 1: Complete Employee Lifecycle
1. Create employee
2. Update employee details
3. Assign manager role
4. Change RMG
5. Deactivate employee
6. Verify audit trail

### Scenario 2: Project & Manager Setup
1. Create project
2. Assign manager
3. Add team members
4. Change manager
5. Verify all assignments transferred

### Scenario 3: RMG Management
1. View RMG dashboard
2. View associates under RMG
3. Replace RMG
4. Verify all employees updated
5. Check associate counts

### Scenario 4: Audit & Compliance
1. Perform multiple operations
2. Query audit logs
3. Filter by date range
4. Generate report
5. Verify all changes logged

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review error response details
3. Check backend logs
4. Verify database state

---

**End of Testing Guide**
