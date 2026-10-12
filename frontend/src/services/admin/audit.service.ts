import { ADMIN_AUDIT_API } from '../apis'
import type { PageResponse } from '../common.types'
import { httpClient } from '../httpClient'

export interface AuditLogDTO {
  id: number
  auditId: string
  userId?: number
  performedByEmail?: string
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

export const adminAuditService = { list, byEntity, byAction, byDateRange, filter, exportCsv }
