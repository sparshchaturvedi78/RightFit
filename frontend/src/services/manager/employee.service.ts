import { MANAGER_EMPLOYEE_API } from '../apis'
import type { PageResponse } from '../common.types'
import { httpClient } from '../httpClient'

export interface SkillLevelDTO {
  skill: string
  proficiency?: number
  yearsOfExperience?: number
}

export interface PreferenceDTO {
  preferredTechnology?: string
  preferredDomain?: string
  preferredLocation?: string
  preferredWorkMode?: string
  preferredProjectType?: string
}

export interface EmployeeCandidateDTO {
  employeeId: string
  name: string
  email?: string
  phone?: string
  grade?: string
  designation?: string
  domain?: string
  yearsOfExperience?: number
  location?: string
  employmentStatus?: string
  allocationStatus?: string
  availabilityStatus?: string
  availableFromDate?: string
  poolStatus?: string
  benchDays?: number
  workingHoursPerDay?: number
  allocatedHoursPerDay?: number
  skills?: SkillLevelDTO[]
  certifications?: string[]
  preferences?: PreferenceDTO
  /** Where this person stands on requirements the caller runs (profile only). */
  pipeline?: { applicationId: string; requirementId: string; positionTitle?: string; projectName?: string; status: string }[]
  currentProjects?: string[]
  previousProjects?: string[]
}

export interface ContactRequest {
  subject: string
  message: string
  requirementId?: string
}

export interface ContactResultDTO {
  status: string
  fromEmployeeId?: string
  fromName?: string
  toEmployeeId?: string
  toName?: string
  subject?: string
  message?: string
  requirementId?: string
  sentAt?: string
}

export interface CandidateSearchFilters {
  q?: string
  employeeId?: string
  name?: string
  skills?: string[]
  minProficiency?: number
  minExperience?: number
  maxExperience?: number
  location?: string
  certification?: string
  grade?: string
  domain?: string
  technology?: string
  availabilityStatus?: string
  poolStatus?: string
  allocationStatus?: string
  availableOnly?: boolean
  preferredTechnology?: string
  preferredDomain?: string
  preferredWorkMode?: string
  preferredLocation?: string
  /** Leave out everyone on the caller's own projects (the directory is for finding people outside the team). */
  excludeMyTeam?: boolean
  /** Sourcing: leave out the caller, managers and anyone already allocated. */
  forSourcing?: boolean
  page?: number
  size?: number
  sortBy?: 'employeeId' | 'firstName' | 'lastName' | 'grade' | 'yearsOfExperience' | 'availabilityStatus' | 'poolStatus'
  sortDirection?: 'ASC' | 'DESC'
}

async function search(filters: CandidateSearchFilters = {}): Promise<PageResponse<EmployeeCandidateDTO>> {
  const { data } = await httpClient.get<PageResponse<EmployeeCandidateDTO>>(MANAGER_EMPLOYEE_API.search, {
    params: filters,
  })
  return data
}

async function byId(employeeId: string): Promise<EmployeeCandidateDTO> {
  const { data } = await httpClient.get<EmployeeCandidateDTO>(MANAGER_EMPLOYEE_API.byId(employeeId))
  return data
}

async function contact(employeeId: string, payload: ContactRequest): Promise<ContactResultDTO> {
  const { data } = await httpClient.post<ContactResultDTO>(MANAGER_EMPLOYEE_API.contact(employeeId), payload)
  return data
}

export const managerEmployeeService = { search, byId, contact }
