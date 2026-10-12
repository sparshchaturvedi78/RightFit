import { MANAGER_TEAM_API } from '../apis'
import { httpClient } from '../httpClient'

export interface AllocationDTO {
  id: number
  allocationId: string
  projectId: string
  projectName?: string
  employeeId: string
  employeeName?: string
  requirementId?: string
  startDate: string
  endDate?: string
  hoursPerDay: number
  status: string
  endReason?: string
  createdByName?: string
  endedByName?: string
  endedAt?: string
  createdAt?: string
}

export interface AllocationEventDTO {
  allocationId: string
  employeeId: string
  eventType: string
  details?: string
  performedByName?: string
  createdAt?: string
}

export interface TeamMemberDTO {
  employeeId: string
  name?: string
  designation?: string
  role?: string
  joinedAt?: string
  allocationId?: string
  hoursPerDay?: number
  allocationStartDate?: string
  allocationEndDate?: string
  requirementId?: string
}

export interface TeamDTO {
  projectId: string
  projectName?: string
  managerName?: string
  memberCount: number
  totalHoursPerDay?: number
  members: TeamMemberDTO[]
}

export interface AddTeamMemberRequest {
  employeeId: string
  role?: string
  hoursPerDay: number
  startDate?: string
  endDate?: string
}

export interface CapacityDTO {
  employeeId: string
  name?: string
  workingHoursPerDay?: number
  allocatedHoursPerDay?: number
  availableHoursPerDay?: number
  allocationStatus?: string
  activeAllocations?: AllocationDTO[]
}

export interface MoveAllocationRequest {
  fromProjectId: string
  toProjectId: string
  /** Defaults to the hours currently allocated on the source project. */
  hoursPerDay?: number
  effectiveDate?: string
  reason: string
}

export interface SplitEntry {
  projectId: string
  hoursPerDay: number
}

export interface SplitAllocationRequest {
  allocations: SplitEntry[]
  reason: string
}

async function getTeam(projectId: string): Promise<TeamDTO> {
  const { data } = await httpClient.get<TeamDTO>(MANAGER_TEAM_API.team(projectId))
  return data
}

async function addMember(projectId: string, payload: AddTeamMemberRequest): Promise<TeamMemberDTO> {
  const { data } = await httpClient.post<TeamMemberDTO>(MANAGER_TEAM_API.team(projectId), payload)
  return data
}

async function removeMember(projectId: string, employeeId: string, reason: string): Promise<void> {
  await httpClient.delete(MANAGER_TEAM_API.removeMember(projectId, employeeId), { data: { reason } })
}

async function projectAllocations(projectId: string): Promise<AllocationDTO[]> {
  const { data } = await httpClient.get<AllocationDTO[]>(MANAGER_TEAM_API.allocations(projectId))
  return data
}

async function projectHistory(projectId: string): Promise<AllocationEventDTO[]> {
  const { data } = await httpClient.get<AllocationEventDTO[]>(MANAGER_TEAM_API.allocationsHistory(projectId))
  return data
}

async function capacity(employeeId: string): Promise<CapacityDTO> {
  const { data } = await httpClient.get<CapacityDTO>(MANAGER_TEAM_API.employeeCapacity(employeeId))
  return data
}

async function employeeAllocations(employeeId: string): Promise<AllocationDTO[]> {
  const { data } = await httpClient.get<AllocationDTO[]>(MANAGER_TEAM_API.employeeAllocations(employeeId))
  return data
}

async function moveAllocation(employeeId: string, payload: MoveAllocationRequest): Promise<CapacityDTO> {
  const { data } = await httpClient.post<CapacityDTO>(MANAGER_TEAM_API.moveAllocation(employeeId), payload)
  return data
}

async function splitAllocation(employeeId: string, payload: SplitAllocationRequest): Promise<CapacityDTO> {
  const { data } = await httpClient.post<CapacityDTO>(MANAGER_TEAM_API.splitAllocation(employeeId), payload)
  return data
}

export const managerTeamService = {
  getTeam,
  addMember,
  removeMember,
  projectAllocations,
  projectHistory,
  capacity,
  employeeAllocations,
  moveAllocation,
  splitAllocation,
}
