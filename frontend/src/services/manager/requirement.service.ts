import { MANAGER_REQUIREMENT_API } from '../apis'
import type { PageResponse } from '../common.types'
import { httpClient } from '../httpClient'

export interface RequirementDTO {
  id: number
  requirementId: string
  projectId: string
  projectName?: string
  positionTitle: string
  description?: string
  requiredSkills?: string
  minExperience?: number
  maxExperience?: number
  requiredCertifications?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string
  status: string
  allocationStartDate?: string
  allocationEndDate?: string
  createdByEmployeeId?: string
  createdByName?: string
  updatedByName?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateRequirementRequest {
  projectId: string
  positionTitle: string
  description?: string
  requiredSkills?: string
  minExperience?: number
  maxExperience?: number
  requiredCertifications?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  allocationStartDate?: string
  allocationEndDate?: string
}

export interface RequirementStatusChangeRequest {
  reason: string
}

export interface RequirementListFilters {
  projectId?: string
  status?: string
  priority?: string
  positionTitle?: string
  page?: number
  size?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'requirementId' | 'positionTitle' | 'priority' | 'status'
  sortDirection?: 'ASC' | 'DESC'
}

async function create(payload: CreateRequirementRequest): Promise<RequirementDTO> {
  const { data } = await httpClient.post<RequirementDTO>(MANAGER_REQUIREMENT_API.create, payload)
  return data
}

async function list(filters: RequirementListFilters = {}): Promise<PageResponse<RequirementDTO>> {
  const { data } = await httpClient.get<PageResponse<RequirementDTO>>(MANAGER_REQUIREMENT_API.list, {
    params: filters,
  })
  return data
}

async function byId(requirementId: string): Promise<RequirementDTO> {
  const { data } = await httpClient.get<RequirementDTO>(MANAGER_REQUIREMENT_API.byId(requirementId))
  return data
}

async function update(requirementId: string, payload: CreateRequirementRequest): Promise<RequirementDTO> {
  const { data } = await httpClient.put<RequirementDTO>(MANAGER_REQUIREMENT_API.update(requirementId), payload)
  return data
}

async function publish(requirementId: string, payload: RequirementStatusChangeRequest): Promise<RequirementDTO> {
  const { data } = await httpClient.put<RequirementDTO>(MANAGER_REQUIREMENT_API.publish(requirementId), payload)
  return data
}

async function hold(requirementId: string, payload: RequirementStatusChangeRequest): Promise<RequirementDTO> {
  const { data } = await httpClient.put<RequirementDTO>(MANAGER_REQUIREMENT_API.hold(requirementId), payload)
  return data
}

async function resume(requirementId: string, payload: RequirementStatusChangeRequest): Promise<RequirementDTO> {
  const { data } = await httpClient.put<RequirementDTO>(MANAGER_REQUIREMENT_API.resume(requirementId), payload)
  return data
}

async function close(requirementId: string, payload: RequirementStatusChangeRequest): Promise<RequirementDTO> {
  const { data } = await httpClient.put<RequirementDTO>(MANAGER_REQUIREMENT_API.close(requirementId), payload)
  return data
}

async function cancel(requirementId: string, payload: RequirementStatusChangeRequest): Promise<RequirementDTO> {
  const { data } = await httpClient.put<RequirementDTO>(MANAGER_REQUIREMENT_API.cancel(requirementId), payload)
  return data
}

export const managerRequirementService = { create, list, byId, update, publish, hold, resume, close, cancel }
