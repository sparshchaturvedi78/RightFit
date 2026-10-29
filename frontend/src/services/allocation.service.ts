import { ALLOCATION_API } from './apis'
import { httpClient } from './httpClient'

export interface CreateAllocationRequestRequest {
  startDate?: string
  endDate?: string
  /** Not used any more: every allocation is the full working day. Kept optional for older callers. */
  hoursPerDay?: number
}

export interface ReviewRequest {
  comments?: string
}

export interface AllocationRequestDTO {
  id: number
  requestId: string
  applicationId: string
  requirementId: string
  projectId: string
  projectName: string
  employeeId: string
  employeeName: string
  submittedByName: string
  requestedStartDate: string
  requestedEndDate?: string
  requestedHoursPerDay: number
  status: string
  submittedAt: string
  reviewedByName?: string
  reviewedAt?: string
  reviewComments?: string
  rejectionReason?: string
  employeeWorkingHoursPerDay?: number
  employeeAllocatedHoursPerDay?: number
}

// Manager side — request allocation, track own requests
async function create(applicationId: string, payload: CreateAllocationRequestRequest): Promise<AllocationRequestDTO> {
  const { data } = await httpClient.post<AllocationRequestDTO>(ALLOCATION_API.managerCreate(applicationId), payload)
  return data
}

async function managerList(): Promise<AllocationRequestDTO[]> {
  const { data } = await httpClient.get<AllocationRequestDTO[]>(ALLOCATION_API.managerList)
  return data
}

async function managerById(requestId: string): Promise<AllocationRequestDTO> {
  const { data } = await httpClient.get<AllocationRequestDTO>(ALLOCATION_API.managerById(requestId))
  return data
}

async function managerCancel(requestId: string, reason: string): Promise<AllocationRequestDTO> {
  const { data } = await httpClient.put<AllocationRequestDTO>(ALLOCATION_API.managerCancel(requestId), { reason })
  return data
}

// RMG side — review and approve/reject
async function rmgList(): Promise<AllocationRequestDTO[]> {
  const { data } = await httpClient.get<AllocationRequestDTO[]>(ALLOCATION_API.rmgList)
  return data
}

async function rmgById(requestId: string): Promise<AllocationRequestDTO> {
  const { data } = await httpClient.get<AllocationRequestDTO>(ALLOCATION_API.rmgById(requestId))
  return data
}

async function rmgApprove(requestId: string, payload: ReviewRequest): Promise<AllocationRequestDTO> {
  const { data } = await httpClient.put<AllocationRequestDTO>(ALLOCATION_API.rmgApprove(requestId), payload)
  return data
}

/** The server asks for a reason on reject (it is shown to the manager). */
async function rmgReject(requestId: string, payload: { reason: string }): Promise<AllocationRequestDTO> {
  const { data } = await httpClient.put<AllocationRequestDTO>(ALLOCATION_API.rmgReject(requestId), payload)
  return data
}

export const allocationService = {
  create,
  managerList,
  managerById,
  managerCancel,
  rmgList,
  rmgById,
  rmgApprove,
  rmgReject,
}
