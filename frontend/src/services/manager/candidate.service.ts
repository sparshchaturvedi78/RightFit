import { MANAGER_CANDIDATE_API } from '../apis'
import { httpClient } from '../httpClient'

export interface CandidateDTO {
  id: number
  applicationId: string
  requirementId: string
  projectId?: string
  employeeId: string
  employeeName?: string
  grade?: string
  designation?: string
  status: string
  /** The last interview was declined and nothing is booked: reschedule or withdraw. */
  interviewDeclined?: boolean
  previousStatus?: string
  source?: string
  notes?: string
  identifiedByName?: string
  identifiedAt?: string
  shortlistedByName?: string
  shortlistedAt?: string
  requiresInterview?: boolean
  confirmedAt?: string
  decision?: string
  decisionByName?: string
  decisionAt?: string
  decisionReason?: string
  rejectionReasonCode?: string
  rejectionComment?: string
  rejectedAt?: string
  archived?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CandidateHistoryDTO {
  fromStatus?: string
  toStatus: string
  changedByName?: string
  reason?: string
  changedAt: string
}

export interface PipelineDTO {
  requirementId: string
  requirementStatus: string
  stageCounts: Record<string, number>
  candidates: CandidateDTO[]
}

export interface IdentifyCandidateRequest {
  employeeId: string
  notes?: string
}

async function identify(requirementId: string, payload: IdentifyCandidateRequest): Promise<CandidateDTO> {
  const { data } = await httpClient.post<CandidateDTO>(MANAGER_CANDIDATE_API.add(requirementId), payload)
  return data
}

async function list(requirementId: string, status?: string, includeArchived = false): Promise<CandidateDTO[]> {
  const { data } = await httpClient.get<CandidateDTO[]>(MANAGER_CANDIDATE_API.listByRequirement(requirementId), {
    params: { status, includeArchived },
  })
  return data
}

async function pipeline(requirementId: string): Promise<PipelineDTO> {
  const { data } = await httpClient.get<PipelineDTO>(MANAGER_CANDIDATE_API.pipeline(requirementId))
  return data
}

async function byId(applicationId: string): Promise<CandidateDTO> {
  const { data } = await httpClient.get<CandidateDTO>(MANAGER_CANDIDATE_API.byId(applicationId))
  return data
}

async function history(applicationId: string): Promise<CandidateHistoryDTO[]> {
  const { data } = await httpClient.get<CandidateHistoryDTO[]>(MANAGER_CANDIDATE_API.history(applicationId))
  return data
}

async function shortlist(applicationId: string): Promise<CandidateDTO> {
  const { data } = await httpClient.put<CandidateDTO>(MANAGER_CANDIDATE_API.shortlist(applicationId))
  return data
}

async function withdraw(applicationId: string, reason: string): Promise<CandidateDTO> {
  const { data } = await httpClient.put<CandidateDTO>(MANAGER_CANDIDATE_API.withdraw(applicationId), { reason })
  return data
}

export const managerCandidateService = { identify, list, pipeline, byId, history, shortlist, withdraw }
