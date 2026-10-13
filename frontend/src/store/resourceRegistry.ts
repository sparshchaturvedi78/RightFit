import { adminAuditService } from '../services/admin/audit.service'
import { adminDashboardService } from '../services/admin/dashboard.service'
import { adminRmgService } from '../services/admin/rmg.service'

/** Every page-level dataset kept in the Redux store, and how to load it. Add new pages here. */
export const RESOURCE_FETCHERS = {
  'admin/dashboard': () => adminDashboardService.get(),
  'admin/rmg-roster': () => adminRmgService.dashboard(),
  // A page large enough for the hero's 24-hour chart; the timeline shows the newest few.
  'admin/recent-activity': () => adminAuditService.list(0, 100),
} as const

export type ResourceKey = keyof typeof RESOURCE_FETCHERS

export type ResourceData<K extends ResourceKey> = Awaited<ReturnType<(typeof RESOURCE_FETCHERS)[K]>>
