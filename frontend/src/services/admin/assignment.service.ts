import { ADMIN_ASSIGNMENT_API } from '../apis'
import type { ProjectDTO } from './project.service'
import { httpClient } from '../httpClient'

export interface ResponsibilityDTO {
  requirementId: number
  requirementBusinessId: string
  positionTitle: string
  responsibilityType: string
}

export interface AssignmentPreviewDTO {
  departingId: number
  departingEmployeeId: string
  departingName: string
  departingRole: string
  projects?: ProjectDTO[]
  projectCount: number
  ownedRequirementIds?: number[]
  ownedRequirementCount: number
  responsibilities?: ResponsibilityDTO[]
  responsibilityCount: number
  employeeIds?: number[]
  employeeCount: number
  message?: string
}

export interface ResponsibilitySelectionDTO {
  requirementId: number
  responsibilityType: string
}

export interface ReplaceManagerRequest {
  newManagerId?: number
  newManagerEmployeeId?: string
  selectedProjectIds?: number[]
  selectedProjectBusinessIds?: string[]
  selectedOwnedRequirementIds?: number[]
  selectedResponsibilities?: ResponsibilitySelectionDTO[]
}

export interface ReplaceRmgRequest {
  newRmgId?: number
  newRmgEmployeeId?: string
  selectedEmployeeIds?: number[]
  selectedEmployeeBusinessIds?: string[]
}

export interface ReplacementResultDTO {
  success: boolean
  message: string
  affectedCounts?: Record<string, number>
  error?: string
}

async function departingManagerAssignments(managerId: string): Promise<AssignmentPreviewDTO> {
  const { data } = await httpClient.get<AssignmentPreviewDTO>(ADMIN_ASSIGNMENT_API.departingManager(managerId))
  return data
}

async function departingRmgAssignments(rmgId: string): Promise<AssignmentPreviewDTO> {
  const { data } = await httpClient.get<AssignmentPreviewDTO>(ADMIN_ASSIGNMENT_API.departingRmg(rmgId))
  return data
}

async function replaceManager(departingManagerId: string, payload: ReplaceManagerRequest): Promise<ReplacementResultDTO> {
  const { data } = await httpClient.post<ReplacementResultDTO>(
    ADMIN_ASSIGNMENT_API.replaceManager(departingManagerId),
    payload,
  )
  return data
}

async function replaceRmg(departingRmgId: string, payload: ReplaceRmgRequest): Promise<ReplacementResultDTO> {
  const { data } = await httpClient.post<ReplacementResultDTO>(ADMIN_ASSIGNMENT_API.replaceRmg(departingRmgId), payload)
  return data
}

export const adminAssignmentService = {
  departingManagerAssignments,
  departingRmgAssignments,
  replaceManager,
  replaceRmg,
}
