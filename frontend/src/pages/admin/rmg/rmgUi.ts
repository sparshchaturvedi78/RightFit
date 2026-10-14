import type { BadgeTone } from '../../../components/ui/Badge'
import type { RmgDetailDTO, WorkforceSplit } from '../../../services/admin/rmg.service'

/** The dashboard's workforce buckets, in the same order and colours as its Workforce panel. */
export const WORKFORCE_SEGMENTS: { key: string; label: string; color: string; tone: BadgeTone }[] = [
  { key: 'IN_PROJECT', label: 'In project', color: '#22c55e', tone: 'green' },
  { key: 'ON_BENCH', label: 'On bench', color: '#38bdf8', tone: 'sky' },
  { key: 'IN_TRAINING', label: 'In training', color: '#f59e0b', tone: 'amber' },
  { key: 'UNASSIGNED', label: 'Unassigned', color: '#94a3b8', tone: 'slate' },
]

export function segmentOf(key: string) {
  return WORKFORCE_SEGMENTS.find((s) => s.key === key) ?? WORKFORCE_SEGMENTS[WORKFORCE_SEGMENTS.length - 1]
}

/** Share of the team that is working on a project, 0–100; null when the RMG has nobody. */
export function utilisation(split: WorkforceSplit | undefined, total: number): number | null {
  if (!total) return null
  return Math.round(((split?.IN_PROJECT ?? 0) / total) * 100)
}

/** The RMG has left but people still report to them: they need a new RMG. */
export function needsReplacement(r: Pick<RmgDetailDTO, 'status' | 'associateCount'>): boolean {
  return r.status !== 'ACTIVE' && r.associateCount > 0
}

export function rmgNameParts(name: string): [string, string] {
  const [first, ...rest] = name.trim().split(/\s+/)
  return [first ?? '', rest.join(' ')]
}

export const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

export const TEAM_OPTIONS = [
  { value: 'WITH', label: 'Has associates' },
  { value: 'NONE', label: 'No associates' },
]

export type SortKey = 'name' | 'employeeId' | 'associateCount'

export const SORT_KEYS: SortKey[] = ['name', 'employeeId', 'associateCount']
