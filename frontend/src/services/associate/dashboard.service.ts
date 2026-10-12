import { ASSOCIATE_DASHBOARD_API } from '../apis'
import { httpClient } from '../httpClient'

export interface CurrentAllocationDTO {
  allocationId: string
  projectId: string
  projectName?: string
  hoursPerDay?: number
  startDate?: string
}

export interface AssociateDashboardDTO {
  employmentStatus: string
  allocationStatus: string
  availabilityStatus: string
  poolStatus?: string
  pendingInvitations: number
  openOpportunities: number
  upcomingInterviews: number
  currentAllocations: CurrentAllocationDTO[]
  totalOpportunityHistory: number
  activeTrainingAssignments: number
  unreadNotifications: number
}

async function get(): Promise<AssociateDashboardDTO> {
  const { data } = await httpClient.get<AssociateDashboardDTO>(ASSOCIATE_DASHBOARD_API.get)
  return data
}

export const associateDashboardService = { get }
