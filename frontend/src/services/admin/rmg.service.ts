import { ADMIN_RMG_API } from '../apis'
import type { PageResponse } from '../common.types'
import type { EmployeeDTO } from './employee.service'
import { httpClient } from '../httpClient'

/** Active associates per workforce bucket: IN_PROJECT, ON_BENCH, IN_TRAINING, UNASSIGNED. */
export type WorkforceSplit = Record<string, number>

export interface RmgDetailDTO {
  rmgId: number
  employeeId: string
  rmgName: string
  email: string
  department?: string
  designation?: string
  /** Active associates reporting to this RMG. */
  associateCount: number
  status: string
  // RMG page only (absent on the dashboard roster)
  grade?: string
  location?: string
  /** The Admin this RMG reports to. */
  reportsToName?: string
  reportsToEmployeeId?: string
  workforce?: WorkforceSplit
}

export interface RmgPage {
  content: RmgDetailDTO[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  /** Every RMG, ignoring the filters. */
  totalRmgs: number
  activeRmgs: number
  /** Active employees who report to an RMG. */
  associatesCovered: number
  /** Inactive RMGs that still have people reporting to them. */
  needReplacement: number
}

export interface RmgListFilters {
  /** Free text: employee ID, name or email. */
  q?: string
  status?: string
  /** WITH = has associates, NONE = has none. */
  team?: string
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
  page?: number
  size?: number
}

export interface RmgTeamMember {
  id: number
  employeeId: string
  firstName: string
  lastName: string
  email: string
  designation?: string
  grade?: string
  /** IN_PROJECT, ON_BENCH, IN_TRAINING or UNASSIGNED. */
  workforce: string
}

export interface RmgTeamPage {
  content: RmgTeamMember[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  /** Everyone reporting to the RMG, ignoring the filter. */
  teamSize: number
  workforce: WorkforceSplit
}

async function list(filters: RmgListFilters = {}): Promise<RmgPage> {
  const { data } = await httpClient.get<RmgPage>(ADMIN_RMG_API.list, { params: filters })
  return data
}

async function team(rmgId: string, workforce: string | undefined, page: number, size: number): Promise<RmgTeamPage> {
  const { data } = await httpClient.get<RmgTeamPage>(ADMIN_RMG_API.team(rmgId), {
    params: { workforce: workforce || undefined, page, size },
  })
  return data
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

export const adminRmgService = { list, team, dashboard, byId, associates, associateCount }
