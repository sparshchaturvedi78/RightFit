import { RMG_REJECTION_API } from '../apis'
import { httpClient } from '../httpClient'

export interface RejectionDTO {
  rejectionId: string
  applicationId?: string
  employeeId: string
  employeeName?: string
  projectId?: string
  projectName?: string
  requirementId?: string
  positionTitle?: string
  reasonName?: string
  reasonCategory?: string
  rejectedByName?: string
  rejectionDate: string
  rejectionComment?: string
}

export interface EmployeeRejectionHistoryDTO {
  employeeId: string
  employeeName?: string
  totalRejections: number
  byReason: Record<string, number>
  history: RejectionDTO[]
}

async function list(): Promise<RejectionDTO[]> {
  const { data } = await httpClient.get<RejectionDTO[]>(RMG_REJECTION_API.list)
  return data
}

async function employeeHistory(employeeId: string): Promise<EmployeeRejectionHistoryDTO> {
  const { data } = await httpClient.get<EmployeeRejectionHistoryDTO>(RMG_REJECTION_API.byEmployee(employeeId))
  return data
}

export const rmgRejectionService = { list, employeeHistory }
