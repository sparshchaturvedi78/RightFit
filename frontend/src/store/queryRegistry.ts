import { adminAssignmentService, type HandoverKind } from '../services/admin/assignment.service'
import { adminEmployeeService, type EmployeeListFilters } from '../services/admin/employee.service'
import { adminProjectService, type ProjectListFilters } from '../services/admin/project.service'
import { adminRmgService, type RmgListFilters } from '../services/admin/rmg.service'
import { adminUserAccountService, type UserAccountFilters } from '../services/admin/userAccount.service'
import { adminSkillCatalogService, type LevelBand } from '../services/admin/skillCatalog.service'
import { adminAuditService, type AuditFilters } from '../services/admin/audit.service'
import { adminReportService, type ReportFilters } from '../services/admin/report.service'
import { managerDashboardService } from '../services/manager/dashboard.service'
import { managerTeamService } from '../services/manager/team.service'
import { managerCandidateService } from '../services/manager/candidate.service'
import { managerEmployeeService, type CandidateSearchFilters } from '../services/manager/employee.service'
import { managerRequirementService } from '../services/manager/requirement.service'
import { managerRequirementAssignmentService } from '../services/manager/requirementAssignment.service'
import { allocationService } from '../services/allocation.service'
import { associateDashboardService } from '../services/associate/dashboard.service'
import { associateOpportunityService } from '../services/associate/opportunity.service'
import { associateProfileService } from '../services/associate/profile.service'
import { associateWorkService } from '../services/associate/work.service'
import { interviewService } from '../services/interview.service'

/**
 * Parameterised page data (lists with search / filters / paging) kept in the Redux store, one entry per distinct
 * set of parameters. Add new list pages here (e.g. projects) and read them with `useQuery`.
 */
export const QUERY_FETCHERS = {
  employees: (params: EmployeeListFilters) => adminEmployeeService.list(params),
  projects: (params: ProjectListFilters) => adminProjectService.list(params),
  /** One page of a project's team, optionally filtered by grade — shown in the project's details. */
  projectTeam: (params: { projectId: string; grade?: string; page: number; size: number }) =>
    adminProjectService.team(params.projectId, params.grade, params.page, params.size),
  /** Where one employee works (projects managed / allocated) — shown in their profile. */
  employeeProjects: (params: { employeeId: string }) => adminEmployeeService.projects(params.employeeId),
  rmgs: (params: RmgListFilters) => adminRmgService.list(params),
  /** One page of login accounts for a role lane, search or sign-in state (Users page). */
  userAccounts: (params: UserAccountFilters) => adminUserAccountService.list(params),
  /** Audit log: one page of entries for the filters, and the entries per day for the same filters. */
  auditEntries: (params: AuditFilters) => adminAuditService.filterList(params),
  auditDays: (params: AuditFilters) => adminAuditService.dailyCounts(params),
  auditSummary: (params: AuditFilters) => adminAuditService.summary(params),
  /** Reports: the rows of one report for its filters. */
  /** Which filters a report supports (date, department). */
  reportFilters: (params: { type: string }) => adminReportService.filtersFor(params.type),
  reportRows: (params: { type: string } & ReportFilters) =>
    adminReportService.get(params.type, { from: params.from, to: params.to, department: params.department }),
  /** Manager: a project's requirements with pipeline and responsibility holders, and its team. */
  managerProjectRequirements: (params: { projectId: string }) => managerDashboardService.projectRequirementCards(params.projectId),
  managerProjectTeam: (params: { projectId: string }) => managerTeamService.getTeam(params.projectId),
  /** Manager: every requirement across their projects (no parameters; the empty object only gives it a store key). */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  managerAllRequirements: (_params: Record<string, never>) => managerDashboardService.allRequirementCards(),
  /** Manager: everyone on their projects (no parameters; the empty object only gives it a store key). */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  managerPeople: (_params: Record<string, never>) => managerTeamService.people(),
  /** Manager: one employee's profile (skills, certifications, availability). */
  managerEmployee: (params: { employeeId: string }) => managerEmployeeService.byId(params.employeeId),
  /** Manager: every interview on their requirements (no parameters; the empty object only gives it a store key). */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  managerInterviews: (_params: Record<string, never>) => interviewService.managerList(),
  /** Manager: one interview with its feedback, for the detail panel. */
  managerInterview: (params: { interviewId: string }) => interviewService.byId(params.interviewId),
  /** Manager: every allocation request on their projects (no parameters; the empty object only gives it a store key). */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  managerAllocations: (_params: Record<string, never>) => allocationService.managerList(),
  /** Interviews on the requirements the signed-in person coordinates or interviews on. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dutyInterviews: (_params: Record<string, never>) => interviewService.dutyInterviews(),
  /** Interviews the signed-in person conducts (assigned as interviewer). */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interviewsToTake: (_params: Record<string, never>) => interviewService.mine(),
  /** Associate: their own dashboard numbers, duties, project, open work, training and profile (no parameters). */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  associateDashboard: (_params: Record<string, never>) => associateDashboardService.get(),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  associateDuties: (_params: Record<string, never>) => associateWorkService.duties(),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  associateProjects: (_params: Record<string, never>) => associateWorkService.myProjects(),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  associateRequirements: (_params: Record<string, never>) => associateWorkService.openRequirements(),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  associateInvitations: (_params: Record<string, never>) => associateOpportunityService.myInvitations(),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  associateOpportunities: (_params: Record<string, never>) => associateOpportunityService.myOpportunities(),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  associateInterviews: (_params: Record<string, never>) => interviewService.associateList(),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  associateTrainings: (_params: Record<string, never>) => associateWorkService.trainings(),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  associateTrainingAssignments: (_params: Record<string, never>) => associateWorkService.trainingAssignments(),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  associateProfile: (_params: Record<string, never>) => associateProfileService.getProfile(),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  associateSkills: (_params: Record<string, never>) => associateProfileService.listSkills(),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  associatePreferences: (_params: Record<string, never>) => associateProfileService.getPreferences(),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  associateCertifications: (_params: Record<string, never>) => associateProfileService.listCertifications(),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  associateAvailability: (_params: Record<string, never>) => associateProfileService.getAvailability(),
  /** Manager: one page of the employee directory for the filters (people outside the manager's own projects). */
  managerDirectory: (params: CandidateSearchFilters) => managerEmployeeService.search(params),
  /** Manager: a requirement's candidates, every stage, newest first. */
  managerCandidates: (params: { requirementId: string }) => managerCandidateService.list(params.requirementId),
  /** Manager: one requirement's details, its pipeline card, and who holds each responsibility. */
  managerRequirement: (params: { requirementId: string }) => managerRequirementService.byId(params.requirementId),
  managerRequirementCard: (params: { requirementId: string }) => managerDashboardService.requirementCard(params.requirementId),
  managerRequirementAssignments: (params: { requirementId: string }) => managerRequirementAssignmentService.list(params.requirementId),
  /** One page of a skill's active associates, optionally one proficiency band — Skills page detail. */
  skillHolders: (params: { skillId: number; level: LevelBand; page: number; size: number }) =>
    adminSkillCatalogService.holders(params.skillId, params.level, params.page, params.size),
  /** Assignments page: who has left but still holds projects / people. */
  // No parameters: the empty object only gives it a store key like every other entry.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  pendingHandovers: (_params: Record<string, never>) => adminAssignmentService.pending(),
  /** Assignments page: what one person would hand over (projects for a manager, people for an RMG). */
  handoverPreview: (params: { kind: HandoverKind; employeeId: string }) =>
    adminAssignmentService.preview(params.kind, params.employeeId),
  /** One page of the associates reporting to an RMG, optionally one workforce bucket — shown in the RMG's details. */
  rmgTeam: (params: { rmgId: string; workforce?: string; page: number; size: number }) =>
    adminRmgService.team(params.rmgId, params.workforce, params.page, params.size),
} as const

export type QueryNamespace = keyof typeof QUERY_FETCHERS
export type QueryParams<N extends QueryNamespace> = Parameters<(typeof QUERY_FETCHERS)[N]>[0]
export type QueryData<N extends QueryNamespace> = Awaited<ReturnType<(typeof QUERY_FETCHERS)[N]>>

/** Stable store key for a namespace + params (key order and empty values don't matter). */
export function queryKey(namespace: QueryNamespace, params: object): string {
  const clean = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
  return `${namespace}?${clean.map(([k, v]) => `${k}=${String(v)}`).join('&')}`
}
