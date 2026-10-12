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
}

async function get(): Promise<AdminDashboardDTO> {
  const { data } = await httpClient.get<AdminDashboardDTO>(ADMIN_DASHBOARD_API.get)
  return data
}

export const adminDashboardService = { get }
