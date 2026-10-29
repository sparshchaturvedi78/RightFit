import { ADMIN_DASHBOARD_API } from '../apis'
import { httpClient } from '../httpClient'

export interface AdminDashboardDTO {
  totalEmployees: number
  activeEmployees: number
  inactiveEmployees: number
  totalProjects: number
  activeProjects: number
  totalManagers: number
  totalRmgs: number
  pendingManagerReplacements: number
  pendingRmgReplacements: number
  totalAuditEntries: number
  auditEntriesLast24h: number
  unreadNotifications: number
  // Workforce distribution, bench aging, requirements and interviews. Optional so the page still renders
  // against a backend deployed before these fields existed.
  inProjectEmployees?: number
  inTrainingEmployees?: number
  onBenchEmployees?: number
  unassignedEmployees?: number
  benchGreen?: number
  benchAmber?: number
  benchRed?: number
  openRequirements?: number
  upcomingInterviews?: UpcomingInterviewDTO[]
}

export interface UpcomingInterviewDTO {
  interviewId: string
  candidateName?: string
  candidateEmployeeId?: string
  positionTitle?: string
  projectName?: string
  interviewerName?: string
  scheduledAt: string
  roundNumber?: number
  mode?: string
  status: string
}

async function get(): Promise<AdminDashboardDTO> {
  const { data } = await httpClient.get<AdminDashboardDTO>(ADMIN_DASHBOARD_API.get)
  return data
}

export const adminDashboardService = { get }
