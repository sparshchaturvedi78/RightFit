import { ADMIN_RMG_API } from '../apis'
import type { PageResponse } from '../common.types'
import type { EmployeeDTO } from './employee.service'
import { httpClient } from '../httpClient'

export interface RmgDetailDTO {
  rmgId: number
  employeeId: string
  rmgName: string
  email: string
  department?: string
  designation?: string
  associateCount: number
  status: string
}

async function dashboard(): Promise<RmgDetailDTO[]> {
  const { data } = await httpClient.get<RmgDetailDTO[]>(ADMIN_RMG_API.dashboard)
  return data
}

async function byId(rmgId: string): Promise<RmgDetailDTO> {
  const { data } = await httpClient.get<RmgDetailDTO>(ADMIN_RMG_API.byId(rmgId))
  return data
}

async function associates(rmgId: string, page = 0, size = 20): Promise<PageResponse<EmployeeDTO>> {
  const { data } = await httpClient.get<PageResponse<EmployeeDTO>>(ADMIN_RMG_API.associates(rmgId), {
    params: { page, size },
  })
  return data
}

async function associateCount(rmgId: string): Promise<number> {
  const { data } = await httpClient.get<number>(ADMIN_RMG_API.associateCount(rmgId))
  return data
}

export const adminRmgService = { dashboard, byId, associates, associateCount }
