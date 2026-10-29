import { MANAGER_PROJECT_API } from '../apis'
import type { ProjectDTO } from '../admin/project.service'
import type { PageResponse } from '../common.types'
import { httpClient } from '../httpClient'

export interface MyProjectsResponse {
  claimed: ProjectDTO[]
  pendingClaim: ProjectDTO[]
}

export interface ProjectLookupDTO {
  id: number
  projectId: string
  projectName: string
}

export interface ResponsibilityWorkload {
  sourcer: number
  interviewer: number
  coordinator: number
  total: number
}

export interface ResponsibilityDirectoryDTO {
  employeeId: string
  name: string
  email?: string
  designation?: string
  grade?: string
  workload: ResponsibilityWorkload
  projectWorkload: ResponsibilityWorkload
  heldOnRequirement?: string[]
}

export interface ResponsibilityHolder {
  employeeId: string
  name: string
  requirementIds: string[]
}

export interface ResponsibilityRosterDTO {
  sourcer: ResponsibilityHolder[]
  interviewer: ResponsibilityHolder[]
  coordinator: ResponsibilityHolder[]
}

async function myProjects(): Promise<MyProjectsResponse> {
  const { data } = await httpClient.get<MyProjectsResponse>(MANAGER_PROJECT_API.list)
  return data
}

async function search(projectId?: string): Promise<ProjectLookupDTO[]> {
  const { data } = await httpClient.get<ProjectLookupDTO[]>(MANAGER_PROJECT_API.search, { params: { projectId } })
  return data
}

async function responsibilityCandidates(
  projectId: string,
  options: { requirementId?: string; q?: string; page?: number; size?: number } = {},
): Promise<PageResponse<ResponsibilityDirectoryDTO>> {
  const { data } = await httpClient.get<PageResponse<ResponsibilityDirectoryDTO>>(
    MANAGER_PROJECT_API.responsibilityCandidates(projectId),
    { params: options },
  )
  return data
}

async function responsibilityRoster(projectId: string, requirementId?: string): Promise<ResponsibilityRosterDTO> {
  const { data } = await httpClient.get<ResponsibilityRosterDTO>(
    MANAGER_PROJECT_API.responsibilityRoster(projectId),
    { params: { requirementId } },
  )
  return data
}

async function claim(projectId: string): Promise<ProjectDTO> {
  const { data } = await httpClient.put<ProjectDTO>(MANAGER_PROJECT_API.claim(projectId))
  return data
}

export const managerProjectService = { myProjects, search, responsibilityCandidates, responsibilityRoster, claim }
