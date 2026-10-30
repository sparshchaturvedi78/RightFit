import { ADMIN_PROJECT_API } from '../apis'
import type { PageResponse } from '../common.types'
import { httpClient } from '../httpClient'

export interface ProjectDTO {
  id: number
  projectId: string
  projectName: string
  description?: string
  managerId?: number
  managerName?: string
  /** Business ID of the manager, e.g. EMP003. */
  managerEmployeeId?: string
  /** ACTIVE / INACTIVE — an inactive manager means the project needs a replacement. */
  managerEmploymentStatus?: string
  status: string
  startDate?: string
  endDate?: string
  clientName?: string
  managerClaimed?: boolean
  claimedAt?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  updatedBy?: string
}

export interface ProjectTeamMember {
  id: number
  employeeId: string
  name: string
  designation?: string
  grade?: string
  role?: string
  manager: boolean
  employmentStatus: string
  hoursPerDay?: number
  since?: string
}

export interface ProjectTeamPage {
  content: ProjectTeamMember[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  /** Everyone on the team, ignoring the grade filter. */
  teamSize: number
  /** Distinct grades on the team, highest first. */
  grades: string[]
}

export interface CreateProjectRequest {
  projectId: string
  projectName: string
  description?: string
  /** Optional: a project can be created without a manager. */
  managerId?: number
  clientName?: string
  startDate?: string
  endDate?: string
  status?: string
}

export type UpdateProjectRequest = Partial<
  Pick<ProjectDTO, 'projectName' | 'description' | 'managerId' | 'clientName' | 'status' | 'startDate' | 'endDate'>
>

export interface ChangeManagerRequest {
  newManagerId?: number
  newManagerEmployeeId?: string
  reason?: string
}

export interface CloseProjectRequest {
  reason: string
  effectiveDate?: string
}

export interface ProjectListFilters {
  /** Free text: matches project ID, name, client, or the manager's name / employee ID. */
  q?: string
  /** true = the manager has claimed the project, false = still pending. */
  claimed?: boolean
  /** ACTIVE or INACTIVE: only projects whose manager is in that state. */
  managerStatus?: string
  projectId?: string
  projectName?: string
  status?: string
  managerId?: number
  clientName?: string
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
}

async function create(payload: CreateProjectRequest): Promise<ProjectDTO> {
  const { data } = await httpClient.post<ProjectDTO>(ADMIN_PROJECT_API.create, payload)
  return data
}

async function list(filters: ProjectListFilters = {}): Promise<PageResponse<ProjectDTO>> {
  const { data } = await httpClient.get<PageResponse<ProjectDTO>>(ADMIN_PROJECT_API.list, { params: filters })
  return data
}

async function team(projectId: string, grade: string | undefined, page: number, size: number): Promise<ProjectTeamPage> {
  const { data } = await httpClient.get<ProjectTeamPage>(ADMIN_PROJECT_API.team(projectId), {
    params: { grade: grade || undefined, page, size },
  })
  return data
}

async function byId(projectId: string): Promise<ProjectDTO> {
  const { data } = await httpClient.get<ProjectDTO>(ADMIN_PROJECT_API.byId(projectId))
  return data
}

async function update(projectId: string, payload: UpdateProjectRequest): Promise<ProjectDTO> {
  const { data } = await httpClient.put<ProjectDTO>(ADMIN_PROJECT_API.update(projectId), payload)
  return data
}

async function changeManager(projectId: string, payload: ChangeManagerRequest): Promise<ProjectDTO> {
  const { data } = await httpClient.put<ProjectDTO>(ADMIN_PROJECT_API.assignManager(projectId), payload)
  return data
}

async function close(projectId: string, payload: CloseProjectRequest): Promise<ProjectDTO> {
  const { data } = await httpClient.put<ProjectDTO>(ADMIN_PROJECT_API.close(projectId), payload)
  return data
}

async function reopen(projectId: string, payload: CloseProjectRequest): Promise<ProjectDTO> {
  const { data } = await httpClient.put<ProjectDTO>(ADMIN_PROJECT_API.reopen(projectId), payload)
  return data
}

export const adminProjectService = { create, list, team, byId, update, changeManager, close, reopen }
