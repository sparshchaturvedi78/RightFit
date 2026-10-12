import { ADMIN_REPORT_API } from '../apis'
import { httpClient } from '../httpClient'

export interface ReportDTO {
  report: string
  generatedAt: string
  rowCount: number
  rows: Record<string, unknown>[]
}

async function availableTypes(): Promise<string[]> {
  const { data } = await httpClient.get<string[]>(ADMIN_REPORT_API.types)
  return data
}

async function get(type: string): Promise<ReportDTO> {
  const { data } = await httpClient.get<ReportDTO>(ADMIN_REPORT_API.byType(type))
  return data
}

export const adminReportService = { availableTypes, get }
