import { ADMIN_REPORT_API } from '../apis'
import { httpClient } from '../httpClient'

export interface ReportDTO {
  report: string
  generatedAt: string
  rowCount: number
  /** Whose rows these are, from the server: everyone, your projects, or your associates. */
  scope?: string
  rows: Record<string, unknown>[]
}

/** Which filters a report supports. A report without a date has no date filter, and so on. */
export interface ReportFiltersDTO {
  date: boolean
  department: boolean
}

export interface ReportFilters {
  from?: string
  to?: string
  department?: string
}

async function availableTypes(): Promise<string[]> {
  const { data } = await httpClient.get<string[]>(ADMIN_REPORT_API.types)
  return data
}

async function filtersFor(type: string): Promise<ReportFiltersDTO> {
  const { data } = await httpClient.get<ReportFiltersDTO>(ADMIN_REPORT_API.filters(type))
  return data
}

async function get(type: string, filters: ReportFilters): Promise<ReportDTO> {
  const { data } = await httpClient.get<ReportDTO>(ADMIN_REPORT_API.byType(type), { params: filters })
  return data
}

/** The CSV for exactly the filters given. */
async function csv(type: string, filters: ReportFilters): Promise<Blob> {
  const { data } = await httpClient.get<Blob>(ADMIN_REPORT_API.csv(type), { params: filters, responseType: 'blob' })
  return data
}

/** The Excel workbook for exactly the filters given. */
async function xlsx(type: string, filters: ReportFilters): Promise<Blob> {
  const { data } = await httpClient.get<Blob>(ADMIN_REPORT_API.xlsx(type), { params: filters, responseType: 'blob' })
  return data
}

export interface ReportDepartment {
  name: string
  /** Active people in the department who can be put on projects. */
  people: number
}

/** Departments and their head count, for the department filter. */
async function departments(): Promise<ReportDepartment[]> {
  const { data } = await httpClient.get<ReportDepartment[]>(ADMIN_REPORT_API.departments)
  return data
}

export const adminReportService = { availableTypes, filtersFor, get, csv, xlsx, departments }
