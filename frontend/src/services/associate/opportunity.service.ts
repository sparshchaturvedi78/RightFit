import { ASSOCIATE_OPPORTUNITY_API } from '../apis'
import type { InvitationDTO } from '../manager/invitation.service'
import { httpClient } from '../httpClient'

export interface TeamMemberInfo {
  employeeId: string
  name?: string
  designation?: string
  role?: string
}

export interface OpportunityDetailsDTO {
  invitation: InvitationDTO
  projectId?: string
  projectName?: string
  projectDescription?: string
  clientName?: string
  projectStatus?: string
  projectStartDate?: string
  projectEndDate?: string
  managerName?: string
  requirementId?: string
  positionTitle?: string
  requirementDescription?: string
  requiredSkills?: string
  minExperience?: number
  maxExperience?: number
  requiredCertifications?: string
  priority?: string
  allocationStartDate?: string
  allocationEndDate?: string
  team?: TeamMemberInfo[]
}

export interface OpportunityHistoryDTO {
  applicationId: string
  requirementId?: string
  projectId?: string
  projectName?: string
  positionTitle?: string
  status: string
  confirmed?: boolean
  confirmedAt?: string
  updatedAt?: string
}

export interface InvitationResponseRequest {
  response: 'ACCEPT' | 'REJECT' | 'JOIN'
  comment?: string
}

export interface ConfirmationRequest {
  decision: 'ACCEPT' | 'DECLINE'
  comment?: string
}

async function myInvitations(): Promise<InvitationDTO[]> {
  const { data } = await httpClient.get<InvitationDTO[]>(ASSOCIATE_OPPORTUNITY_API.invitations)
  return data
}

async function openInvitation(invitationId: string): Promise<OpportunityDetailsDTO> {
  const { data } = await httpClient.get<OpportunityDetailsDTO>(ASSOCIATE_OPPORTUNITY_API.invitationById(invitationId))
  return data
}

async function respond(invitationId: string, payload: InvitationResponseRequest): Promise<InvitationDTO> {
  const { data } = await httpClient.put<InvitationDTO>(
    ASSOCIATE_OPPORTUNITY_API.respondInvitation(invitationId),
    payload,
  )
  return data
}

async function myOpportunities(): Promise<OpportunityHistoryDTO[]> {
  const { data } = await httpClient.get<OpportunityHistoryDTO[]>(ASSOCIATE_OPPORTUNITY_API.opportunities)
  return data
}

async function confirm(applicationId: string, payload: ConfirmationRequest): Promise<OpportunityHistoryDTO> {
  const { data } = await httpClient.put<OpportunityHistoryDTO>(
    ASSOCIATE_OPPORTUNITY_API.confirmOpportunity(applicationId),
    payload,
  )
  return data
}

export const associateOpportunityService = { myInvitations, openInvitation, respond, myOpportunities, confirm }
