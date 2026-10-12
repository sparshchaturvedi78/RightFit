import { ADMIN_SEARCH_API } from '../apis'
import type { PageResponse } from '../common.types'
import type { EmployeeDTO } from './employee.service'
import type { ProjectDTO } from './project.service'
import { httpClient } from '../httpClient'

export interface EmployeeSearchRequest {
  query: string
  page?: number
  size?: number
}

export interface ProjectSearchRequest {
  query: string
  page?: number
  size?: number
}

async function employees(payload: EmployeeSearchRequest): Promise<PageResponse<EmployeeDTO>> {
  const { data } = await httpClient.post<PageResponse<EmployeeDTO>>(ADMIN_SEARCH_API.employees, payload)
  return data
}

async function projects(payload: ProjectSearchRequest): Promise<PageResponse<ProjectDTO>> {
  const { data } = await httpClient.post<PageResponse<ProjectDTO>>(ADMIN_SEARCH_API.projects, payload)
  return data
}

export const adminSearchService = { employees, projects }
