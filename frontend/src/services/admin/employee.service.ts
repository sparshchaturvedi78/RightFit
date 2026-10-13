import { ADMIN_EMPLOYEE_API } from '../apis'
import type { PageResponse } from '../common.types'
import { httpClient } from '../httpClient'

export interface EmployeeDTO {
  id: number
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  grade?: string
  designation: string
  domain?: string
  yearsOfExperience?: number
  dateOfJoining?: string
  poolStatus?: string
  workingHoursPerDay?: number
  departmentId?: number
  departmentName?: string
  locationId?: number
  locationName?: string
  rmgId?: number
  rmgName?: string
  employmentStatus: string
  allocationStatus: string
  availabilityStatus: string
  availableFromDate?: string
  userId?: number
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  updatedBy?: string
  roles?: string[]
}

export interface CreateEmployeeRequest {
  employeeId: string
  firstName: string
  lastName: string
  email: string
  password: string
  designation: string
  departmentId: number
  /** Required unless the new employee is an Admin (optionalRoleId = the Admin role). */
  rmgId?: number
  phone?: string
  grade?: string
  domain?: string
  yearsOfExperience?: number
  dateOfJoining?: string
  workingHoursPerDay?: number
  locationId?: number
  optionalRoleId?: number
  employmentStatus?: string
  allocationStatus?: string
  availabilityStatus?: string
}

export type UpdateEmployeeRequest = Partial<
  Pick<
    EmployeeDTO,
    | 'firstName'
    | 'lastName'
    | 'email'
    | 'designation'
    | 'grade'
    | 'domain'
    | 'phone'
    | 'yearsOfExperience'
    | 'dateOfJoining'
    | 'workingHoursPerDay'
    | 'poolStatus'
    | 'employmentStatus'
    | 'allocationStatus'
    | 'availabilityStatus'
    | 'availableFromDate'
    | 'departmentId'
    | 'locationId'
    | 'rmgId'
  >
>

export interface ChangeRmgRequest {
  newRmgId?: number
  newRmgEmployeeId?: string
  reason?: string
}

export interface DeactivateEmployeeRequest {
  reason: string
  effectiveDate?: string
}

export interface EmployeeListFilters {
  /** Free text: matches employee ID, name or email. */
  q?: string
  employeeId?: string
  firstName?: string
  lastName?: string
  email?: string
  status?: string
  designation?: string
  departmentId?: number
  locationId?: number
  rmgId?: number
  /** Role code: ADMIN | MANAGER | RMG | ASSOCIATE. */
  role?: string
  /** IN_PROJECT | ON_BENCH | IN_TRAINING | UNASSIGNED — the dashboard's workforce buckets. */
  workforce?: string
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
}

async function create(payload: CreateEmployeeRequest): Promise<EmployeeDTO> {
  const { data } = await httpClient.post<EmployeeDTO>(ADMIN_EMPLOYEE_API.create, payload)
  return data
}

async function list(filters: EmployeeListFilters = {}): Promise<PageResponse<EmployeeDTO>> {
  const { data } = await httpClient.get<PageResponse<EmployeeDTO>>(ADMIN_EMPLOYEE_API.list, { params: filters })
  return data
}

async function byId(employeeId: string): Promise<EmployeeDTO> {
  const { data } = await httpClient.get<EmployeeDTO>(ADMIN_EMPLOYEE_API.byId(employeeId))
  return data
}

async function update(employeeId: string, payload: UpdateEmployeeRequest): Promise<EmployeeDTO> {
  const { data } = await httpClient.put<EmployeeDTO>(ADMIN_EMPLOYEE_API.update(employeeId), payload)
  return data
}

async function changeRmg(employeeId: string, payload: ChangeRmgRequest): Promise<EmployeeDTO> {
  const { data } = await httpClient.put<EmployeeDTO>(ADMIN_EMPLOYEE_API.assignRmg(employeeId), payload)
  return data
}

async function deactivate(employeeId: string, payload: DeactivateEmployeeRequest): Promise<EmployeeDTO> {
  const { data } = await httpClient.put<EmployeeDTO>(ADMIN_EMPLOYEE_API.deactivate(employeeId), payload)
  return data
}

async function reactivate(employeeId: string, payload: DeactivateEmployeeRequest): Promise<EmployeeDTO> {
  const { data } = await httpClient.put<EmployeeDTO>(ADMIN_EMPLOYEE_API.reactivate(employeeId), payload)
  return data
}

export const adminEmployeeService = { create, list, byId, update, changeRmg, deactivate, reactivate }
