import { RMG_DASHBOARD_API } from '../apis'
import type { SkillDemandSupplyDTO } from './demandSupply.service'
import { httpClient } from '../httpClient'

export interface RmgDashboardDTO {
  greenBench: number
  amberBench: number
  redBench: number
  poolSize: number
  openRequirements: number
  /** Top 5 skills where demand exceeds supply, worst gap first. */
  topSkillShortages: SkillDemandSupplyDTO[]
  totalRejections: number
  rejectionsByReason: Record<string, number>
  activeTrainingPrograms: number
  trainingAssignmentsByStatus: Record<string, number>
  allocationRequestsByStatus: Record<string, number>
  unreadNotifications: number
}

async function get(): Promise<RmgDashboardDTO> {
  const { data } = await httpClient.get<RmgDashboardDTO>(RMG_DASHBOARD_API.get)
  return data
}

export const rmgDashboardService = { get }
