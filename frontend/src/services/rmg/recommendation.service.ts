import { RMG_RECOMMENDATION_API } from '../apis'
import type { CandidateDTO, IdentifyCandidateRequest } from '../manager/candidate.service'
import { httpClient } from '../httpClient'

async function recommend(requirementId: string, payload: IdentifyCandidateRequest): Promise<CandidateDTO> {
  const { data } = await httpClient.post<CandidateDTO>(RMG_RECOMMENDATION_API.recommend(requirementId), payload)
  return data
}

export const rmgRecommendationService = { recommend }
