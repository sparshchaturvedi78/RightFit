import { humanize } from '../../../utils/format'

/** The "What changed" chips. Each one maps to the entity type the backend records. */
export const AREAS: { key: string; label: string; entityType?: string }[] = [
  { key: 'all', label: 'Everything' },
  { key: 'employees', label: 'Employees', entityType: 'EMPLOYEE' },
  { key: 'projects', label: 'Projects', entityType: 'PROJECT' },
  { key: 'accounts', label: 'Accounts', entityType: 'USER' },
  { key: 'skills', label: 'Skills', entityType: 'SKILL' },
  { key: 'bench', label: 'Bench policy', entityType: 'BENCH_CONFIGURATION' },
  { key: 'requirements', label: 'Requirements', entityType: 'REQUIREMENT' },
]

/** Plain names for the actions the code records. Anything not listed reads as humanised text. */
const ACTION_LABELS: Record<string, string> = {
  ACCOUNT_BLOCKED: 'Account blocked',
  ACCOUNT_UNBLOCKED: 'Account unblocked',
  ACCOUNT_UNLOCKED: 'Account unlocked',
  EMPLOYEE_DEACTIVATED: 'Employee deactivated',
  EMPLOYEE_REACTIVATED: 'Employee reactivated',
  EMPLOYEE_PROFILE_UPDATED: 'Employee updated',
  EMPLOYEE_MOVED: 'Employee moved',
  MANAGER_CHANGED: 'Manager changed',
  RMG_CHANGED: 'RMG changed',
  PROJECT_CLOSED: 'Project closed',
  PROJECT_REOPENED: 'Project reopened',
  PROJECT_CLAIMED: 'Project claimed',
  REQUIREMENT_CREATED: 'Requirement created',
  REQUIREMENT_UPDATED: 'Requirement updated',
  SKILL_CREATED: 'Skill created',
  SKILL_UPDATED: 'Skill updated',
  SKILL_RETIRED: 'Skill retired',
  SKILL_RESTORED: 'Skill restored',
  SKILL_CATEGORY_CREATED: 'Category created',
  SKILL_CATEGORY_UPDATED: 'Category updated',
  BENCH_CONFIGURATION_CREATED: 'Bench policy set',
  ROLE_CHANGED: 'Role changed',
}

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? humanize(action)
}

/** Icon colour by kind of change: risky actions red, moves amber, creations green, the rest blue. */
export function actionTone(action: string): 'risk' | 'move' | 'create' | 'update' {
  if (/BLOCK|DEACTIVAT|RETIRE|CLOSED/.test(action)) return 'risk'
  if (/CHANGED|MOVED|REPLACED|CLAIMED/.test(action)) return 'move'
  if (/CREATED|ADDED|REQUESTED|SENT/.test(action)) return 'create'
  return 'update'
}

export const TONE_CLASS = {
  risk: 'bg-rose-500/12 text-rose-600 dark:text-rose-400',
  move: 'bg-amber-500/14 text-amber-700 dark:text-amber-400',
  create: 'bg-brand-500/12 text-brand-600 dark:text-brand-400',
  update: 'bg-sky-500/12 text-sky-700 dark:text-sky-400',
}

export function initials(action: string): string {
  return actionLabel(action)
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export const RANGE_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: '7', label: '7 days' },
  { key: '30', label: '30 days' },
  { key: 'custom', label: 'Custom' },
] as const

export function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** The start and end days for a range choice. Custom uses the dates the user picked. */
export function rangeDays(key: string, customFrom: string, customTo: string, anchor: Date): { start: string; end: string; label: string } {
  const today = anchor
  if (key === 'custom') return { start: customFrom, end: customTo, label: `${customFrom} to ${customTo}` }
  const back = key === 'today' ? 0 : key === '30' ? 29 : 6
  const from = new Date(today)
  from.setDate(today.getDate() - back)
  const label = key === 'today' ? 'today' : `the last ${back + 1} days`
  return { start: isoDay(from), end: isoDay(today), label }
}

/** Largest period one audit download may cover. Older entries: pick custom dates inside the limit. */
export const AUDIT_EXPORT_MAX_DAYS = 15
/** Largest date span one report download may cover. Matches AdminReportService.DOWNLOAD_MAX_DAYS. */
export const REPORT_DOWNLOAD_MAX_DAYS = 30

/** How many days a start..end range covers, both ends included. Dates are ISO yyyy-mm-dd. */
export function daySpan(start: string, end: string): number {
  const ms = Date.parse(end) - Date.parse(start)
  return Number.isFinite(ms) ? Math.round(ms / 864e5) + 1 : 0
}
