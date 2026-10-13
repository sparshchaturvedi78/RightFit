import type { BadgeTone } from '../../../components/ui/Badge'
import type { EmployeeDTO } from '../../../services/admin/employee.service'

const AVATAR_GRADIENTS = [
  'from-brand-400 to-emerald-600',
  'from-sky-400 to-indigo-500',
  'from-violet-400 to-fuchsia-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-cyan-400 to-blue-500',
]

export function avatarGradient(id: number): string {
  return AVATAR_GRADIENTS[Math.abs(id) % AVATAR_GRADIENTS.length]
}

/** "Jan 15, 2015" for a server LocalDate ("2015-01-15") without the UTC-midnight off-by-one-day shift. */
export function formatDay(value?: string): string | undefined {
  if (!value) return undefined
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return value
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fullName(e: Pick<EmployeeDTO, 'firstName' | 'lastName'>): string {
  return `${e.firstName} ${e.lastName}`.trim()
}

export function employmentTone(status: string): BadgeTone {
  return status === 'ACTIVE' ? 'green' : 'rose'
}

export function allocationTone(status: string): BadgeTone {
  return status === 'ALLOCATED' ? 'sky' : 'slate'
}

/**
 * The allocation badge to show, or null for none. Admins and RMGs aren't allocated to projects (people report to
 * them), so they get no badge; everyone else is Allocated when they are in an active project — as a member, by
 * allocation, or as the Manager of one — and Unallocated otherwise.
 */
export function allocationBadge(e: { inProject?: boolean | null; allocationStatus: string }): { tone: BadgeTone; label: string } | null {
  const inProject = e.inProject === undefined ? e.allocationStatus === 'ALLOCATED' : e.inProject
  if (inProject === null) return null
  return inProject ? { tone: 'sky', label: 'Allocated' } : { tone: 'slate', label: 'Unallocated' }
}

export function availabilityTone(status: string): BadgeTone {
  return status === 'AVAILABLE' ? 'green' : 'amber'
}

/** Roles that other people depend on: deactivating them needs a follow-up replacement. */
export function isLeadershipRole(role: string): boolean {
  const r = role.toLowerCase()
  return r === 'rmg' || r === 'manager'
}

/** Role filter on the Employees list; values are the backend role codes. */
export const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'RMG', label: 'RMG' },
  { value: 'ASSOCIATE', label: 'Associate' },
]

/** The Admin Dashboard's workforce buckets (same names and precedence). */
export const WORKFORCE_OPTIONS = [
  { value: 'IN_PROJECT', label: 'In project' },
  { value: 'ON_BENCH', label: 'On bench' },
  { value: 'IN_TRAINING', label: 'In training' },
  { value: 'UNASSIGNED', label: 'Unassigned' },
]

export function hasRole(e: { roles?: string[] }, role: string): boolean {
  return (e.roles ?? []).some((r) => r.toLowerCase() === role.toLowerCase())
}

export const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

export type SortKey = 'firstName' | 'employeeId' | 'designation' | 'dateOfJoining'

export const SORT_KEYS: SortKey[] = ['firstName', 'employeeId', 'designation', 'dateOfJoining']
