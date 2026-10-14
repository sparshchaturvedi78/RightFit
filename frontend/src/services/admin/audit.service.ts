import { ADMIN_AUDIT_API } from '../apis'
import type { PageResponse } from '../common.types'
import { httpClient } from '../httpClient'

export interface AuditLogDTO {
  id: number
  auditId: string
  userId?: number
  performedByEmail?: string
  /** The performer's name and employee ID, when the entry is linked to an employee. */
  performedByName?: string
  performedByEmployeeId?: string
  action: string
  entityType: string
  entityId?: number
  oldValue?: string
  newValue?: string
  changeSummary?: string
  ipAddress?: string
  userAgent?: string
  status: string
  timestamp: string
}

export interface AuditFilters {
  userId?: number
  entityType?: string
  action?: string
  year?: number
  month?: number
  startDate?: string
  endDate?: string
  page?: number
  size?: number
}

async function list(page = 0, size = 20, sortBy = 'createdAt', sortDirection: 'ASC' | 'DESC' = 'DESC') {
  const { data } = await httpClient.get<PageResponse<AuditLogDTO>>(ADMIN_AUDIT_API.list, {
    params: { page, size, sortBy, sortDirection },
  })
  return data
}

async function byEntity(entityType: string, page = 0, size = 20) {
  const { data } = await httpClient.get<PageResponse<AuditLogDTO>>(ADMIN_AUDIT_API.byEntity(entityType), {
    params: { page, size },
  })
  return data
}

async function byAction(action: string, page = 0, size = 20) {
  const { data } = await httpClient.get<PageResponse<AuditLogDTO>>(ADMIN_AUDIT_API.byAction(action), {
    params: { page, size },
  })
  return data
}

async function byDateRange(startDate: string, endDate: string, page = 0, size = 20) {
  const { data } = await httpClient.get<PageResponse<AuditLogDTO>>(ADMIN_AUDIT_API.dateRange, {
    params: { startDate, endDate, page, size },
  })
  return data
}

async function filter(filters: AuditFilters = {}) {
  const { data } = await httpClient.get<PageResponse<AuditLogDTO>>(ADMIN_AUDIT_API.filter, { params: filters })
  return data
}

async function exportCsv(filters: Omit<AuditFilters, 'page' | 'size'> = {}): Promise<Blob> {
  const { data } = await httpClient.get(ADMIN_AUDIT_API.export, { params: filters, responseType: 'blob' })
  return data
}

/** The Audit log page: entries for the filters, one page at a time (filters are required: start and end date). */
async function filterList(filters: AuditFilters): Promise<PageResponse<AuditLogDTO>> {
  const { data } = await httpClient.get<PageResponse<AuditLogDTO>>(ADMIN_AUDIT_API.filter, { params: filters })
  return data
}

/** Every action name that has been logged, for the action search. */
async function actions(): Promise<string[]> {
  const { data } = await httpClient.get<string[]>(ADMIN_AUDIT_API.actions)
  return data
}

/** Entries per day for the same filters. */
async function dailyCounts(filters: AuditFilters): Promise<{ date: string; count: number }[]> {
  const { data } = await httpClient.get<{ date: string; count: number }[]>(ADMIN_AUDIT_API.dailyCounts, { params: filters })
  return data
}

/** Header numbers for the same filters: people involved and the most common action. */
async function summary(filters: AuditFilters): Promise<{ people: number; topAction: string | null }> {
  const { data } = await httpClient.get<{ people: number; topAction: string | null }>(ADMIN_AUDIT_API.summary, { params: filters })
  return data
}

export const adminAuditService = {
  filterList,
  actions,
  dailyCounts,
  summary,
  exportCsv,
  list,
  byEntity,
  byAction,
  byDateRange,
  filter,
}
