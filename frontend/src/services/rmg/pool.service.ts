import { RMG_POOL_API } from '../apis'
import type { PageResponse } from '../common.types'
import { httpClient } from '../httpClient'

export interface PoolEntryDTO {
  employeeId: string
  name: string
  designation?: string
  grade?: string
  departmentName?: string
  locationName?: string
  inPoolSince?: string
  entryReason?: string
}

export interface PoolHistoryEntryDTO {
  entryDate: string
  exitDate?: string
  entryReason?: string
  exitReason?: string
  isCurrent: boolean
}

export interface PoolDetailDTO {
  employeeId: string
  name: string
  poolStatus: string
  history: PoolHistoryEntryDTO[]
}

async function list(
  options: { q?: string; grade?: string; departmentId?: number; page?: number; size?: number } = {},
): Promise<PageResponse<PoolEntryDTO>> {
  const { data } = await httpClient.get<PageResponse<PoolEntryDTO>>(RMG_POOL_API.list, { params: options })
  return data
}

/** One candidacy of the person: where they stand in a selection, newest first. */
export interface SelectionDTO {
  applicationId: string
  requirementId: string
  positionTitle?: string
  projectName?: string
  status: string
  createdAt?: string
  updatedAt?: string
  confirmedAt?: string
}

async function detail(employeeId: string): Promise<PoolDetailDTO> {
  const { data } = await httpClient.get<PoolDetailDTO>(RMG_POOL_API.byId(employeeId))
  return data
}

async function selections(employeeId: string): Promise<SelectionDTO[]> {
  const { data } = await httpClient.get<SelectionDTO[]>(RMG_POOL_API.selections(employeeId))
  return data
}

export const rmgPoolService = { list, detail, selections }
