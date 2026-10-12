import { ADMIN_USER_API } from '../apis'
import type { PageResponse } from '../common.types'
import type { EmployeeDTO } from './employee.service'
import { httpClient } from '../httpClient'

export interface AdminUserListFilters {
  query?: string
  role?: string
  minExperience?: number
  maxExperience?: number
  employmentStatus?: string
  allocationStatus?: string
  availabilityStatus?: string
  poolStatus?: string
  departmentId?: number
  locationId?: number
  designation?: string
  domain?: string
  grade?: string
  rmgId?: number
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
}

async function list(filters: AdminUserListFilters = {}): Promise<PageResponse<EmployeeDTO>> {
  const { data } = await httpClient.get<PageResponse<EmployeeDTO>>(ADMIN_USER_API.list, { params: filters })
  return data
}

export const adminUserService = { list }
