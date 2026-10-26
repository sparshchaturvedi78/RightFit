import { RMG_RECOMMENDATION_API } from '../apis'
import type { CandidateDTO, IdentifyCandidateRequest } from '../manager/candidate.service'
import type { PoolEntryDTO } from './pool.service'
import { httpClient } from '../httpClient'

/** A published requirement an RMG can recommend people to. */
export interface OpenRequirementDTO {
  requirementId: string
  positionTitle: string
  projectName: string
  priority?: string
  requiredSkills?: string
  minExperience?: number
  maxExperience?: number
  allocationStartDate?: string
}

async function recommend(requirementId: string, payload: IdentifyCandidateRequest): Promise<CandidateDTO> {
  const { data } = await httpClient.post<CandidateDTO>(RMG_RECOMMENDATION_API.recommend(requirementId), payload)
  return data
}

async function openRequirements(): Promise<OpenRequirementDTO[]> {
  const { data } = await httpClient.get<OpenRequirementDTO[]>(RMG_RECOMMENDATION_API.openRequirements)
  return data
}

/** Pool people who can still be recommended to the requirement: anyone already in its pipeline is left out. */
async function poolCandidates(requirementId: string, filters: { q?: string; grade?: string }): Promise<PoolEntryDTO[]> {
  const { data } = await httpClient.get<PoolEntryDTO[]>(RMG_RECOMMENDATION_API.poolCandidates(requirementId), { params: filters })
  return data
}

export const rmgRecommendationService = { recommend, openRequirements, poolCandidates }
