import { RMG_AVAILABILITY_API } from '../apis'
import { httpClient } from '../httpClient'

export interface EmployeeAvailabilityDTO {
  id: number
  employeeId: string
  availabilityStatus: string
  expectedReturnDate?: string
  reason?: string
  verificationStatus: string
  verifiedByName?: string
  verifiedAt?: string
  verificationComment?: string
  createdAt?: string
}

async function pending(): Promise<EmployeeAvailabilityDTO[]> {
  const { data } = await httpClient.get<EmployeeAvailabilityDTO[]>(RMG_AVAILABILITY_API.list)
  return data
}

async function approve(id: number): Promise<EmployeeAvailabilityDTO> {
  const { data } = await httpClient.put<EmployeeAvailabilityDTO>(RMG_AVAILABILITY_API.approve(id))
  return data
}

async function reject(id: number, reason: string): Promise<EmployeeAvailabilityDTO> {
  const { data } = await httpClient.put<EmployeeAvailabilityDTO>(RMG_AVAILABILITY_API.reject(id), { reason })
  return data
}

export const rmgAvailabilityService = { pending, approve, reject }
