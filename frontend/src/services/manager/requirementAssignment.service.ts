import { MANAGER_REQUIREMENT_ASSIGNMENT_API } from '../apis'
import { httpClient } from '../httpClient'

export interface RequirementAssignmentDTO {
  id: number
  requirementId: string
  employeeId: string
  employeeName?: string
  responsibilityType: 'SOURCER' | 'INTERVIEWER' | 'COORDINATOR' | string
  assignedAt: string
  assignedBy?: number
  isActive: boolean
}

export interface AssignResponsibilityRequest {
  employeeId: string
  responsibilityType: 'SOURCER' | 'INTERVIEWER' | 'COORDINATOR'
}

async function assign(requirementId: string, payload: AssignResponsibilityRequest): Promise<RequirementAssignmentDTO> {
  const { data } = await httpClient.post<RequirementAssignmentDTO>(
    MANAGER_REQUIREMENT_ASSIGNMENT_API.assign(requirementId),
    payload,
  )
  return data
}

async function list(requirementId: string, responsibilityType?: string): Promise<RequirementAssignmentDTO[]> {
  const { data } = await httpClient.get<RequirementAssignmentDTO[]>(
    MANAGER_REQUIREMENT_ASSIGNMENT_API.list(requirementId),
    { params: { responsibilityType } },
  )
  return data
}

async function remove(
  requirementId: string,
  employeeId: string,
  responsibilityType?: string,
): Promise<RequirementAssignmentDTO[]> {
  const { data } = await httpClient.delete<RequirementAssignmentDTO[]>(
    MANAGER_REQUIREMENT_ASSIGNMENT_API.remove(requirementId, employeeId),
    { params: { responsibilityType } },
  )
  return data
}

export const managerRequirementAssignmentService = { assign, list, remove }
