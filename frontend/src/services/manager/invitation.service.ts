import { MANAGER_INVITATION_API } from '../apis'
import { httpClient } from '../httpClient'

export interface InvitationDTO {
  id: number
  invitationId: string
  applicationId: string
  requirementId: string
  projectId?: string
  employeeId: string
  employeeName?: string
  status: string
  message?: string
  requiresInterview?: boolean
  invitedByName?: string
  invitedAt?: string
  responseDeadline?: string
  viewedAt?: string
  respondedAt?: string
  responseComment?: string
}

export interface SendInvitationRequest {
  message?: string
  responseDeadline?: string
  /** false = direct joining (the employee may respond JOIN). Defaults to true. */
  requiresInterview?: boolean
}

async function send(applicationId: string, payload: SendInvitationRequest): Promise<InvitationDTO> {
  const { data } = await httpClient.post<InvitationDTO>(MANAGER_INVITATION_API.send(applicationId), payload)
  return data
}

async function listByRequirement(requirementId: string): Promise<InvitationDTO[]> {
  const { data } = await httpClient.get<InvitationDTO[]>(MANAGER_INVITATION_API.listByRequirement(requirementId))
  return data
}

async function byId(invitationId: string): Promise<InvitationDTO> {
  const { data } = await httpClient.get<InvitationDTO>(MANAGER_INVITATION_API.byId(invitationId))
  return data
}

async function withdraw(invitationId: string): Promise<InvitationDTO> {
  const { data } = await httpClient.put<InvitationDTO>(MANAGER_INVITATION_API.withdraw(invitationId))
  return data
}

export const managerInvitationService = { send, listByRequirement, byId, withdraw }
