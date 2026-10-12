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

export const managerDashboardService = { get, report, requirementHistory }
