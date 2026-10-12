import { RMG_DEMAND_SUPPLY_API } from '../apis'
import { httpClient } from '../httpClient'

export interface SkillDemandSupplyDTO {
  skillName: string
  category?: string
  demand: number
  supply: number
  gap: number
  /** True when demand exceeds supply - the "High Demand + Low Supply" shortage signal. */
  shortage: boolean
}

export interface DemandSupplySummaryDTO {
  openRequirements: number
  availableEmployees: number
  bySkill: SkillDemandSupplyDTO[]
}

async function get(): Promise<DemandSupplySummaryDTO> {
  const { data } = await httpClient.get<DemandSupplySummaryDTO>(RMG_DEMAND_SUPPLY_API.get)
  return data
}

export const rmgDemandSupplyService = { get }
