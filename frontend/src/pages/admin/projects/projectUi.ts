import type { BadgeTone } from '../../../components/ui/Badge'
import type { ProjectDTO } from '../../../services/admin/project.service'

const GRADIENTS = [
  'from-brand-400 to-emerald-600',
  'from-sky-400 to-indigo-500',
  'from-violet-400 to-fuchsia-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-cyan-400 to-blue-500',
]

export function projectGradient(id: number): string {
  return GRADIENTS[Math.abs(id) % GRADIENTS.length]
}

/** Two letters for the project tile: initials of the first two words of its name. */
export function projectInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? words[0]?.[1] ?? '')).toUpperCase() || '?'
}

export function statusTone(status: string): BadgeTone {
  return status === 'ACTIVE' ? 'green' : 'slate'
}

/** The manager has left (is INACTIVE): the project needs a new one, whatever its claim state was. */
export function managerInactive(p: Pick<ProjectDTO, 'managerEmploymentStatus'>): boolean {
  return p.managerEmploymentStatus === 'INACTIVE'
}

/** The second badge on a project: an inactive manager (red) outranks claimed / pending claim. */
export function claimBadge(p: Pick<ProjectDTO, 'managerEmploymentStatus' | 'managerClaimed'>): { tone: BadgeTone; label: string } {
  if (managerInactive(p)) return { tone: 'rose', label: 'Manager inactive' }
  return p.managerClaimed ? { tone: 'sky', label: 'Claimed' } : { tone: 'amber', label: 'Pending claim' }
}

export function timeline(p: Pick<ProjectDTO, 'startDate' | 'endDate'>, format: (d?: string) => string | undefined): string {
  const start = format(p.startDate)
  const end = format(p.endDate)
  if (start && end) return `${start} → ${end}`
  if (start) return `From ${start}`
  if (end) return `Until ${end}`
  return '—'
}

export const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'CLOSED', label: 'Closed' },
]

export const MANAGER_OPTIONS = [
  { value: 'ACTIVE', label: 'Manager active' },
  { value: 'INACTIVE', label: 'Manager inactive' },
]

export const CLAIM_OPTIONS = [
  { value: 'true', label: 'Claimed' },
  { value: 'false', label: 'Pending claim' },
]

export type SortKey = 'projectName' | 'clientName' | 'startDate'

export const SORT_KEYS: SortKey[] = ['projectName', 'clientName', 'startDate']
