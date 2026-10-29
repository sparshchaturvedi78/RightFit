import { ADMIN_ASSIGNMENT_API } from '../apis'
import type { ProjectDTO } from './project.service'
import { httpClient } from '../httpClient'

export interface ResponsibilityDTO {
  requirementId: number
  /** "REQ-1001 - Java Developer". */
  requirementTitle: string
  /** SOURCER, INTERVIEWER or COORDINATOR. */
  responsibility: string
  /** Employee ID of who holds it now. */
  currentOwnerId: string
}

export interface HandoverPerson {
  id: number
  employeeId: string
  name: string
  designation?: string
  grade?: string
}

export interface AssignmentPreviewDTO {
  departingId: number
  departingEmployeeId: string
  departingName: string
  departingRole?: string
  /** ACTIVE / INACTIVE. */
  departingStatus?: string
  /** Manager handover: every project they manage (any status). */
  projects?: ProjectDTO[]
  projectCount: number
  ownedRequirementIds?: number[]
  ownedRequirementCount: number
  responsibilities?: ResponsibilityDTO[]
  responsibilityCount: number
  employeeIds?: number[]
  employeeCount: number
  /** RMG handover: the active people reporting to them. */
  people?: HandoverPerson[]
  message?: string
}

export interface PendingHandoverItem {
  id: number
  employeeId: string
  name: string
  designation?: string
  /** Active projects (managers) or active people reporting to them (RMGs). */
  count: number
}

export interface PendingHandovers {
  managers: PendingHandoverItem[]
  rmgs: PendingHandoverItem[]
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
  /** Manager: projects, requirementsUnderNewManager. RMG: employees. */
  affectedCounts?: Record<string, number>
  error?: string
}

export type HandoverKind = 'manager' | 'rmg'

async function pending(): Promise<PendingHandovers> {
  const { data } = await httpClient.get<PendingHandovers>(ADMIN_ASSIGNMENT_API.pending)
  return data
}

async function departingManagerAssignments(managerId: string): Promise<AssignmentPreviewDTO> {
  const { data } = await httpClient.get<AssignmentPreviewDTO>(ADMIN_ASSIGNMENT_API.departingManager(managerId))
  return data
}

async function departingRmgAssignments(rmgId: string): Promise<AssignmentPreviewDTO> {
  const { data } = await httpClient.get<AssignmentPreviewDTO>(ADMIN_ASSIGNMENT_API.departingRmg(rmgId))
  return data
}

function preview(kind: HandoverKind, employeeId: string): Promise<AssignmentPreviewDTO> {
  return kind === 'manager' ? departingManagerAssignments(employeeId) : departingRmgAssignments(employeeId)
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
  pending,
  preview,
  departingManagerAssignments,
  departingRmgAssignments,
  replaceManager,
  replaceRmg,
}
