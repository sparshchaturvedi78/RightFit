import { ALLOCATION_API } from './apis'
import { httpClient } from './httpClient'

export interface CreateAllocationRequestRequest {
  startDate?: string
  endDate?: string
  hoursPerDay: number
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

async function managerCancel(requestId: string): Promise<AllocationRequestDTO> {
  const { data } = await httpClient.put<AllocationRequestDTO>(ALLOCATION_API.managerCancel(requestId))
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

async function rmgReject(requestId: string, payload: ReviewRequest): Promise<AllocationRequestDTO> {
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
