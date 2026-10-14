import { adminDashboardService } from '../services/admin/dashboard.service'
import { adminLookupService } from '../services/admin/lookup.service'
import { adminRmgService } from '../services/admin/rmg.service'
import { adminRoleService } from '../services/admin/role.service'
import { adminUserAccountService } from '../services/admin/userAccount.service'
import { adminSkillCatalogService } from '../services/admin/skillCatalog.service'
import { adminBenchConfigurationService } from '../services/admin/benchConfiguration.service'
import { adminAuditService } from '../services/admin/audit.service'
import { adminReportService } from '../services/admin/report.service'

/** Every page-level dataset kept in the Redux store, and how to load it. Add new pages here. */
export const RESOURCE_FETCHERS = {
  'admin/dashboard': () => adminDashboardService.get(),
  'admin/rmg-roster': () => adminRmgService.dashboard(),
  // A page large enough for the hero's 24-hour chart; the timeline shows the newest few.
  'admin/recent-activity': () => adminAuditService.list(0, 100),
  // Reference data for forms and filters.
  'admin/lookups': () => adminLookupService.get(),
  'admin/roles': () => adminRoleService.list(),
  // Users page header: totals, attention counts and the 14-day sign-in series.
  'admin/user-summary': () => adminUserAccountService.summary(),
  // Skills page: every skill (retired ones too) and every category, each with its holder counts.
  'admin/skills': () => adminSkillCatalogService.listSkills(false),
  'admin/skill-categories': () => adminSkillCatalogService.listCategories(),
  // Bench policy page: the policy in effect, and every earlier one.
  'admin/bench-policy': () => adminBenchConfigurationService.current(),
  'admin/bench-history': () => adminBenchConfigurationService.history(),
  // Audit log filter: every action name that has been logged.
  'admin/audit-actions': () => adminAuditService.actions(),
  // Department names for the Reports filter. Reports permission, so Manager and RMG can load it.
  'admin/report-departments': () => adminReportService.departments(),
} as const

export type ResourceKey = keyof typeof RESOURCE_FETCHERS

export type ResourceData<K extends ResourceKey> = Awaited<ReturnType<(typeof RESOURCE_FETCHERS)[K]>>
