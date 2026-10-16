import { MANAGER_DASHBOARD_API } from '../apis'
import type { AuditLogDTO } from '../admin/audit.service'
import type { ReportDTO } from '../admin/report.service'
import type { PageResponse } from '../common.types'
import { httpClient } from '../httpClient'

export interface ProjectStaffingDTO {
  projectId: string
  projectName: string
  status: string
  claimed: boolean
  activeMembers: number
  allocatedHoursPerDay?: number
  openRequirements: number
  /** Candidates still in the process across the project's requirements. */
  candidates: number
}

/** Candidate stages on the dashboard, in order. */
export type PipelineStage = 'identified' | 'shortlisted' | 'invited' | 'interviewing' | 'selected'

/** One open requirement: where its candidates are, and who holds each responsibility. */
export interface RequirementCardDTO {
  requirementId: string
  projectId: string
  projectName: string
  positionTitle: string
  status: string
  priority?: string
  createdAt?: string
  candidates: number
  stages: Record<PipelineStage, number>
  sourcers: string[]
  interviewers: string[]
  coordinators: string[]
}

/** A candidate whose interviews are done and who is waiting for the manager's decision. */
export interface DecisionCardDTO {
  applicationId: string
  employeeId: string
  employeeName: string
  requirementId: string
  positionTitle: string
  projectName: string
  waitingSince?: string
}

export interface ManagerDashboardDTO {
  totalProjects: number
  claimedProjects: number
  pendingClaimProjects: number
  requirementsByStatus: Record<string, number>
  candidatePipeline: Record<string, number>
  pendingInvitations: number
  upcomingInterviews: number
  pendingDecisions: number
  allocationRequestsByStatus: Record<string, number>
  teamMembers: number
  totalAllocatedHoursPerDay?: number
  unreadNotifications: number
  projectStaffing: ProjectStaffingDTO[]
  openRequirements: RequirementCardDTO[]
  decisionQueue: DecisionCardDTO[]
}

async function get(): Promise<ManagerDashboardDTO> {
  const { data } = await httpClient.get<ManagerDashboardDTO>(MANAGER_DASHBOARD_API.get)
  return data
}

async function report(report: string): Promise<ReportDTO> {
  const { data } = await httpClient.get<ReportDTO>(MANAGER_DASHBOARD_API.report(report))
  return data
}

async function requirementHistory(requirementId: string, page = 0, size = 20): Promise<PageResponse<AuditLogDTO>> {
  const { data } = await httpClient.get<PageResponse<AuditLogDTO>>(
    MANAGER_DASHBOARD_API.requirementHistory(requirementId),
    { params: { page, size } },
  )
  return data
}

/** Every requirement of one project (any status) with its pipeline and who holds each responsibility. */
async function projectRequirementCards(projectId: string): Promise<RequirementCardDTO[]> {
  const { data } = await httpClient.get<RequirementCardDTO[]>(MANAGER_DASHBOARD_API.projectRequirementCards(projectId))
  return data
}

/** Every requirement across the manager's claimed projects, as cards. */
async function allRequirementCards(): Promise<RequirementCardDTO[]> {
  const { data } = await httpClient.get<RequirementCardDTO[]>(MANAGER_DASHBOARD_API.allRequirementCards)
  return data
}

/** One requirement with its pipeline and who holds each responsibility. */
async function requirementCard(requirementId: string): Promise<RequirementCardDTO> {
  const { data } = await httpClient.get<RequirementCardDTO>(MANAGER_DASHBOARD_API.requirementCard(requirementId))
  return data
}

export const managerDashboardService = { get, report, requirementHistory, projectRequirementCards, allRequirementCards, requirementCard }
