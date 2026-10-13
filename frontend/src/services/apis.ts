export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'https://rightfit-zt87.onrender.com'

// ---------------------------------------------------------------------------
// Auth — AuthController (/api/auth)
// ---------------------------------------------------------------------------
export const AUTH_API = {
  login: '/api/auth/login',
  verifyLoginOtp: '/api/auth/verify-login-otp',
  refreshToken: '/api/auth/refresh-token',
  logout: '/api/auth/logout',
  verifyEmailOtp: '/api/auth/verify-email-otp',
  forgotPasswordStep1: '/api/auth/forgot-password/step1',
  forgotPasswordStep2: '/api/auth/forgot-password/step2',
  forgotPasswordStep3: '/api/auth/forgot-password/step3',
  resetPassword: '/api/auth/reset-password',
  me: '/api/auth/me',
}

// ---------------------------------------------------------------------------
// Notifications — NotificationController (/api/notifications)
// ---------------------------------------------------------------------------
export const NOTIFICATION_API = {
  list: '/api/notifications',
  unreadCount: '/api/notifications/unread-count',
  markRead: (notificationId: string | number) => `/api/notifications/${notificationId}/read`,
  markAllRead: '/api/notifications/read-all',
}

// ---------------------------------------------------------------------------
// Admin — Employees — AdminEmployeeController (/api/admin/employees)
// ---------------------------------------------------------------------------
export const ADMIN_EMPLOYEE_API = {
  create: '/api/admin/employees',
  list: '/api/admin/employees',
  byId: (employeeId: string) => `/api/admin/employees/${employeeId}`,
  update: (employeeId: string) => `/api/admin/employees/${employeeId}`,
  assignRmg: (employeeId: string) => `/api/admin/employees/${employeeId}/rmg`,
  projects: (employeeId: string) => `/api/admin/employees/${employeeId}/projects`,
  role: (employeeId: string) => `/api/admin/employees/${employeeId}/role`,
  deactivate: (employeeId: string) => `/api/admin/employees/${employeeId}/deactivate`,
  reactivate: (employeeId: string) => `/api/admin/employees/${employeeId}/reactivate`,
}

// ---------------------------------------------------------------------------
// Admin — Lookups (departments, locations, designations) — AdminLookupController (/api/admin/lookups)
// ---------------------------------------------------------------------------
export const ADMIN_LOOKUP_API = {
  get: '/api/admin/lookups',
}

// ---------------------------------------------------------------------------
// Admin — Projects — AdminProjectController (/api/admin/projects)
// ---------------------------------------------------------------------------
export const ADMIN_PROJECT_API = {
  create: '/api/admin/projects',
  list: '/api/admin/projects',
  byId: (projectId: string) => `/api/admin/projects/${projectId}`,
  update: (projectId: string) => `/api/admin/projects/${projectId}`,
  assignManager: (projectId: string) => `/api/admin/projects/${projectId}/manager`,
  team: (projectId: string) => `/api/admin/projects/${projectId}/team`,
  close: (projectId: string) => `/api/admin/projects/${projectId}/close`,
  reopen: (projectId: string) => `/api/admin/projects/${projectId}/reopen`,
}

// ---------------------------------------------------------------------------
// Admin — RMG roster — AdminRmgController (/api/admin/rmg)
// ---------------------------------------------------------------------------
export const ADMIN_RMG_API = {
  dashboard: '/api/admin/rmg/dashboard',
  byId: (rmgId: string) => `/api/admin/rmg/${rmgId}`,
  associates: (rmgId: string) => `/api/admin/rmg/${rmgId}/associates`,
  associateCount: (rmgId: string) => `/api/admin/rmg/${rmgId}/associate-count`,
}

// ---------------------------------------------------------------------------
// Admin — Assignment replacement — AdminAssignmentController (/api/admin/assignments)
// ---------------------------------------------------------------------------
export const ADMIN_ASSIGNMENT_API = {
  departingManager: (managerId: string) => `/api/admin/assignments/departing/manager/${managerId}`,
  departingRmg: (rmgId: string) => `/api/admin/assignments/departing/rmg/${rmgId}`,
  replaceManager: (departingManagerId: string) => `/api/admin/assignments/replace-manager/${departingManagerId}`,
  replaceRmg: (departingRmgId: string) => `/api/admin/assignments/replace-rmg/${departingRmgId}`,
}

// ---------------------------------------------------------------------------
// Admin — Users — AdminUserController (/api/admin/users)
// ---------------------------------------------------------------------------
export const ADMIN_USER_API = {
  list: '/api/admin/users',
}

// ---------------------------------------------------------------------------
// Admin — Roles — AdminRoleController (/api/admin/roles)
// ---------------------------------------------------------------------------
export const ADMIN_ROLE_API = {
  list: '/api/admin/roles',
  system: '/api/admin/roles/system',
  custom: '/api/admin/roles/custom',
  byId: (roleId: string | number) => `/api/admin/roles/${roleId}`,
  permissions: (roleId: string | number) => `/api/admin/roles/${roleId}/permissions`,
}

// ---------------------------------------------------------------------------
// Admin — Permissions — AdminPermissionController (/api/admin/permissions)
// ---------------------------------------------------------------------------
export const ADMIN_PERMISSION_API = {
  list: '/api/admin/permissions',
  system: '/api/admin/permissions/system',
  custom: '/api/admin/permissions/custom',
  byId: (permissionId: string | number) => `/api/admin/permissions/${permissionId}`,
  byName: (permissionName: string) => `/api/admin/permissions/name/${permissionName}`,
  byResource: (resource: string) => `/api/admin/permissions/resource/${resource}`,
}

// ---------------------------------------------------------------------------
// Admin — Role <-> Permission mapping — RolePermissionManagementController (/api/admin/role-permissions)
// ---------------------------------------------------------------------------
export const ADMIN_ROLE_PERMISSION_API = {
  byRole: (roleId: string | number) => `/api/admin/role-permissions/role/${roleId}`,
  rolesByPermission: (permissionId: string | number) => `/api/admin/role-permissions/permission/${permissionId}/roles`,
  check: (roleId: string | number, permissionId: string | number) =>
    `/api/admin/role-permissions/role/${roleId}/permission/${permissionId}`,
}

// ---------------------------------------------------------------------------
// Admin — User <-> Role assignment — UserRoleManagementController (/api/admin/user-roles)
// ---------------------------------------------------------------------------
export const ADMIN_USER_ROLE_API = {
  byUser: (userId: string | number) => `/api/admin/user-roles/user/${userId}`,
  assign: '/api/admin/user-roles/assign',
  remove: '/api/admin/user-roles/remove',
  deactivate: '/api/admin/user-roles/deactivate',
  reactivate: '/api/admin/user-roles/reactivate',
}

// ---------------------------------------------------------------------------
// Admin — Audit log — AdminAuditController (/api/admin/audit)
// ---------------------------------------------------------------------------
export const ADMIN_AUDIT_API = {
  list: '/api/admin/audit',
  byEntity: (entityType: string) => `/api/admin/audit/entity/${entityType}`,
  byAction: (action: string) => `/api/admin/audit/action/${action}`,
  dateRange: '/api/admin/audit/date-range',
  export: '/api/admin/audit/export',
  filter: '/api/admin/audit/filter',
}

// ---------------------------------------------------------------------------
// Admin — Search — AdminSearchController (/api/admin/search)
// ---------------------------------------------------------------------------
export const ADMIN_SEARCH_API = {
  employees: '/api/admin/search/employees',
  projects: '/api/admin/search/projects',
}

// ---------------------------------------------------------------------------
// Admin — Skill catalog — AdminSkillCatalogController (/api/admin/skills)
// ---------------------------------------------------------------------------
export const ADMIN_SKILL_CATALOG_API = {
  list: '/api/admin/skills',
  create: '/api/admin/skills',
  update: (id: string | number) => `/api/admin/skills/${id}`,
  retire: (id: string | number) => `/api/admin/skills/${id}/retire`,
}

// ---------------------------------------------------------------------------
// Admin — Certification catalog — AdminCertificationCatalogController (/api/admin/certifications)
// ---------------------------------------------------------------------------
export const ADMIN_CERTIFICATION_CATALOG_API = {
  list: '/api/admin/certifications',
  create: '/api/admin/certifications',
  update: (id: string | number) => `/api/admin/certifications/${id}`,
  retire: (id: string | number) => `/api/admin/certifications/${id}/retire`,
}

// ---------------------------------------------------------------------------
// Admin — Bench configuration — AdminBenchConfigurationController (/api/admin/bench-configuration)
// ---------------------------------------------------------------------------
export const ADMIN_BENCH_CONFIGURATION_API = {
  current: '/api/admin/bench-configuration',
  history: '/api/admin/bench-configuration/history',
  create: '/api/admin/bench-configuration',
}

// ---------------------------------------------------------------------------
// Admin — Dashboard — AdminDashboardController (/api/admin/dashboard)
// ---------------------------------------------------------------------------
export const ADMIN_DASHBOARD_API = {
  get: '/api/admin/dashboard',
}

// ---------------------------------------------------------------------------
// Admin — Reports — AdminReportController (/api/admin/reports)
// ---------------------------------------------------------------------------
export const ADMIN_REPORT_API = {
  types: '/api/admin/reports',
  byType: (type: string) => `/api/admin/reports/${type}`,
}

// ---------------------------------------------------------------------------
// Manager — Projects — ManagerProjectController (/api/manager/projects)
// ---------------------------------------------------------------------------
export const MANAGER_PROJECT_API = {
  list: '/api/manager/projects',
  search: '/api/manager/projects/search',
  responsibilityCandidates: (projectId: string) => `/api/manager/projects/${projectId}/responsibility-candidates`,
  responsibilityRoster: (projectId: string) => `/api/manager/projects/${projectId}/responsibility-roster`,
  claim: (projectId: string) => `/api/manager/projects/${projectId}/claim`,
}

// ---------------------------------------------------------------------------
// Manager — Requirements — ManagerRequirementController (/api/manager/requirements)
// ---------------------------------------------------------------------------
export const MANAGER_REQUIREMENT_API = {
  create: '/api/manager/requirements',
  list: '/api/manager/requirements',
  byId: (requirementId: string) => `/api/manager/requirements/${requirementId}`,
  update: (requirementId: string) => `/api/manager/requirements/${requirementId}`,
  publish: (requirementId: string) => `/api/manager/requirements/${requirementId}/publish`,
  hold: (requirementId: string) => `/api/manager/requirements/${requirementId}/hold`,
  resume: (requirementId: string) => `/api/manager/requirements/${requirementId}/resume`,
  close: (requirementId: string) => `/api/manager/requirements/${requirementId}/close`,
  cancel: (requirementId: string) => `/api/manager/requirements/${requirementId}/cancel`,
}

// ---------------------------------------------------------------------------
// Manager — Requirement responsibility assignment — ManagerRequirementAssignmentController
// (/api/manager/requirements/{requirementId}/assignments)
// ---------------------------------------------------------------------------
export const MANAGER_REQUIREMENT_ASSIGNMENT_API = {
  assign: (requirementId: string) => `/api/manager/requirements/${requirementId}/assignments`,
  list: (requirementId: string) => `/api/manager/requirements/${requirementId}/assignments`,
  remove: (requirementId: string, employeeId: string) =>
    `/api/manager/requirements/${requirementId}/assignments/${employeeId}`,
}

// ---------------------------------------------------------------------------
// Manager — Candidate pipeline — ManagerCandidateController (/api/manager)
// ---------------------------------------------------------------------------
export const MANAGER_CANDIDATE_API = {
  add: (requirementId: string) => `/api/manager/requirements/${requirementId}/candidates`,
  listByRequirement: (requirementId: string) => `/api/manager/requirements/${requirementId}/candidates`,
  pipeline: (requirementId: string) => `/api/manager/requirements/${requirementId}/pipeline`,
  byId: (applicationId: string) => `/api/manager/candidates/${applicationId}`,
  history: (applicationId: string) => `/api/manager/candidates/${applicationId}/history`,
  shortlist: (applicationId: string) => `/api/manager/candidates/${applicationId}/shortlist`,
  withdraw: (applicationId: string) => `/api/manager/candidates/${applicationId}/withdraw`,
}

// ---------------------------------------------------------------------------
// Manager — Invitations — ManagerInvitationController (/api/manager)
// ---------------------------------------------------------------------------
export const MANAGER_INVITATION_API = {
  send: (applicationId: string) => `/api/manager/candidates/${applicationId}/invitations`,
  listByRequirement: (requirementId: string) => `/api/manager/requirements/${requirementId}/invitations`,
  byId: (invitationId: string) => `/api/manager/invitations/${invitationId}`,
  withdraw: (invitationId: string) => `/api/manager/invitations/${invitationId}/withdraw`,
}

// ---------------------------------------------------------------------------
// Manager — Candidate decision — ManagerDecisionController (/api/manager/candidates/{applicationId})
// ---------------------------------------------------------------------------
export const MANAGER_DECISION_API = {
  review: (applicationId: string) => `/api/manager/candidates/${applicationId}/review`,
  decision: (applicationId: string) => `/api/manager/candidates/${applicationId}/decision`,
  resume: (applicationId: string) => `/api/manager/candidates/${applicationId}/resume`,
}

// ---------------------------------------------------------------------------
// Manager/Associate — Interviews — ManagerInterviewController (explicit full paths)
// ---------------------------------------------------------------------------
export const INTERVIEW_API = {
  schedule: (applicationId: string) => `/api/manager/candidates/${applicationId}/interviews`,
  listForApplication: (applicationId: string) => `/api/manager/candidates/${applicationId}/interviews`,
  mine: '/api/manager/interviews/mine',
  byId: (interviewId: string) => `/api/manager/interviews/${interviewId}`,
  cancel: (interviewId: string) => `/api/manager/interviews/${interviewId}/cancel`,
  feedback: (interviewId: string) => `/api/manager/interviews/${interviewId}/feedback`,
  associateList: '/api/associate/interviews',
  associateRespond: (interviewId: string) => `/api/associate/interviews/${interviewId}/respond`,
}

// ---------------------------------------------------------------------------
// Manager — Team & allocations — ManagerTeamController (/api/manager)
// ---------------------------------------------------------------------------
export const MANAGER_TEAM_API = {
  team: (projectId: string) => `/api/manager/projects/${projectId}/team`,
  removeMember: (projectId: string, employeeId: string) => `/api/manager/projects/${projectId}/team/${employeeId}`,
  allocations: (projectId: string) => `/api/manager/projects/${projectId}/allocations`,
  allocationsHistory: (projectId: string) => `/api/manager/projects/${projectId}/allocations/history`,
  employeeCapacity: (employeeId: string) => `/api/manager/employees/${employeeId}/capacity`,
  employeeAllocations: (employeeId: string) => `/api/manager/employees/${employeeId}/allocations`,
  moveAllocation: (employeeId: string) => `/api/manager/employees/${employeeId}/allocations/move`,
  splitAllocation: (employeeId: string) => `/api/manager/employees/${employeeId}/allocations/split`,
}

// ---------------------------------------------------------------------------
// Manager — Employee directory — ManagerEmployeeController (/api/manager/employees)
// ---------------------------------------------------------------------------
export const MANAGER_EMPLOYEE_API = {
  search: '/api/manager/employees/search',
  byId: (employeeId: string) => `/api/manager/employees/${employeeId}`,
  contact: (employeeId: string) => `/api/manager/employees/${employeeId}/contact`,
}

// ---------------------------------------------------------------------------
// Manager — Dashboard & reports — ManagerDashboardController (/api/manager)
// ---------------------------------------------------------------------------
export const MANAGER_DASHBOARD_API = {
  get: '/api/manager/dashboard',
  report: (report: string) => `/api/manager/reports/${report}`,
  requirementHistory: (requirementId: string) => `/api/manager/requirements/${requirementId}/history`,
}

// ---------------------------------------------------------------------------
// Allocation requests (Manager requests, RMG approves) — AllocationRequestController
// ---------------------------------------------------------------------------
export const ALLOCATION_API = {
  managerCreate: (applicationId: string) => `/api/manager/candidates/${applicationId}/allocation-requests`,
  managerList: '/api/manager/allocation-requests',
  managerById: (requestId: string) => `/api/manager/allocation-requests/${requestId}`,
  managerCancel: (requestId: string) => `/api/manager/allocation-requests/${requestId}/cancel`,
  rmgList: '/api/rmg/allocation-requests',
  rmgById: (requestId: string) => `/api/rmg/allocation-requests/${requestId}`,
  rmgApprove: (requestId: string) => `/api/rmg/allocation-requests/${requestId}/approve`,
  rmgReject: (requestId: string) => `/api/rmg/allocation-requests/${requestId}/reject`,
}

// ---------------------------------------------------------------------------
// RMG — Resource pool — RmgResourcePoolController (/api/rmg/pool)
// ---------------------------------------------------------------------------
export const RMG_POOL_API = {
  list: '/api/rmg/pool',
  byId: (employeeId: string) => `/api/rmg/pool/${employeeId}`,
}

// ---------------------------------------------------------------------------
// RMG — Bench tracking — RmgBenchController (/api/rmg/bench)
// ---------------------------------------------------------------------------
export const RMG_BENCH_API = {
  list: '/api/rmg/bench',
  summary: '/api/rmg/bench/summary',
  byId: (employeeId: string) => `/api/rmg/bench/${employeeId}`,
}

// ---------------------------------------------------------------------------
// RMG — Availability verification — RmgAvailabilityVerificationController (/api/rmg/availability-requests)
// ---------------------------------------------------------------------------
export const RMG_AVAILABILITY_API = {
  list: '/api/rmg/availability-requests',
  approve: (id: string | number) => `/api/rmg/availability-requests/${id}/approve`,
  reject: (id: string | number) => `/api/rmg/availability-requests/${id}/reject`,
}

// ---------------------------------------------------------------------------
// RMG — Candidate recommendations — RmgRecommendationController
// (/api/rmg/requirements/{requirementId}/recommendations)
// ---------------------------------------------------------------------------
export const RMG_RECOMMENDATION_API = {
  recommend: (requirementId: string) => `/api/rmg/requirements/${requirementId}/recommendations`,
}

// ---------------------------------------------------------------------------
// RMG — Rejection management — RmgRejectionController (/api/rmg/rejections)
// ---------------------------------------------------------------------------
export const RMG_REJECTION_API = {
  list: '/api/rmg/rejections',
  byEmployee: (employeeId: string) => `/api/rmg/rejections/employee/${employeeId}`,
}

// ---------------------------------------------------------------------------
// RMG/Associate — Training — RmgTrainingController (explicit full paths)
// ---------------------------------------------------------------------------
export const TRAINING_API = {
  listPrograms: '/api/rmg/training-programs',
  createProgram: '/api/rmg/training-programs',
  updateProgram: (programId: string | number) => `/api/rmg/training-programs/${programId}`,
  retireProgram: (programId: string | number) => `/api/rmg/training-programs/${programId}/retire`,
  assign: (programId: string | number) => `/api/rmg/training-programs/${programId}/assign`,
  listAssignments: '/api/rmg/training-assignments',
  updateAssignment: (assignmentId: string | number) => `/api/rmg/training-assignments/${assignmentId}`,
  associateAssignments: '/api/associate/training-assignments',
}

// ---------------------------------------------------------------------------
// RMG — Demand & supply analytics — RmgDemandSupplyController (/api/rmg/demand-supply)
// ---------------------------------------------------------------------------
export const RMG_DEMAND_SUPPLY_API = {
  get: '/api/rmg/demand-supply',
}

// ---------------------------------------------------------------------------
// RMG — Dashboard — RmgWorkforceDashboardController (/api/rmg/dashboard)
// ---------------------------------------------------------------------------
export const RMG_DASHBOARD_API = {
  get: '/api/rmg/dashboard',
}

// ---------------------------------------------------------------------------
// Associate — Self-service profile — AssociateProfileController (/api/associate)
// ---------------------------------------------------------------------------
export const ASSOCIATE_PROFILE_API = {
  profile: '/api/associate/profile',
  skills: '/api/associate/skills',
  updateSkill: (skillName: string) => `/api/associate/skills/${skillName}`,
  removeSkill: (skillName: string) => `/api/associate/skills/${skillName}`,
  certifications: '/api/associate/certifications',
  updateCertification: (id: string | number) => `/api/associate/certifications/${id}`,
  certificationDocument: (id: string | number) => `/api/associate/certifications/${id}/document`,
  removeCertification: (id: string | number) => `/api/associate/certifications/${id}`,
  preferences: '/api/associate/preferences',
  availability: '/api/associate/availability',
  requestUnavailability: '/api/associate/availability/request-unavailability',
  cancelUnavailabilityRequest: (id: string | number) => `/api/associate/availability/${id}/cancel-request`,
  returnEarly: '/api/associate/availability/return-early',
}

// ---------------------------------------------------------------------------
// Associate — Opportunities & invitations — AssociateOpportunityController (/api/associate)
// ---------------------------------------------------------------------------
export const ASSOCIATE_OPPORTUNITY_API = {
  invitations: '/api/associate/invitations',
  invitationById: (invitationId: string) => `/api/associate/invitations/${invitationId}`,
  respondInvitation: (invitationId: string) => `/api/associate/invitations/${invitationId}/respond`,
  opportunities: '/api/associate/opportunities',
  confirmOpportunity: (applicationId: string) => `/api/associate/opportunities/${applicationId}/confirmation`,
}

// ---------------------------------------------------------------------------
// Associate — Dashboard — AssociateDashboardController (/api/associate/dashboard)
// ---------------------------------------------------------------------------
export const ASSOCIATE_DASHBOARD_API = {
  get: '/api/associate/dashboard',
}
