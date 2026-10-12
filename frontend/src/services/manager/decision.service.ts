import { MANAGER_DECISION_API } from '../apis'
import type { CandidateDTO } from './candidate.service'
import { httpClient } from '../httpClient'

export interface DecisionRequest {
  decision: 'SELECT' | 'REJECT' | 'HOLD'
  /** Required for REJECT: SKILL_GAP, EXPERIENCE_GAP, DOMAIN_MISMATCH, LOCATION_MISMATCH, WORK_MODE_MISMATCH, COMMUNICATION, PROJECT_FIT, OTHER */
  reasonCode?: string
  comment?: string
}

async function startReview(applicationId: string): Promise<CandidateDTO> {
  const { data } = await httpClient.put<CandidateDTO>(MANAGER_DECISION_API.review(applicationId))
  return data
}

async function decide(applicationId: string, payload: DecisionRequest): Promise<CandidateDTO> {
  const { data } = await httpClient.put<CandidateDTO>(MANAGER_DECISION_API.decision(applicationId), payload)
  return data
}

async function resume(applicationId: string, reason: string): Promise<CandidateDTO> {
  const { data } = await httpClient.put<CandidateDTO>(MANAGER_DECISION_API.resume(applicationId), { reason })
  return data
}

export const managerDecisionService = { startReview, decide, resume }
