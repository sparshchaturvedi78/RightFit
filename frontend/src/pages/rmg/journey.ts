import type { SelectionDTO } from '../../services/rmg/pool.service'
import { humanize } from '../../utils/format'
import { shortDate } from './format'

export interface JourneyStep {
  label: string
  date?: string
  state: 'done' | 'now' | 'stop' | 'todo'
}

/** The selection stages, in the order a candidacy moves through them. */
const STAGES: { label: string; statuses: string[] }[] = [
  { label: 'Identified', statuses: ['IDENTIFIED'] },
  { label: 'Shortlisted', statuses: ['SHORTLISTED'] },
  { label: 'Invited', statuses: ['INVITATION_SENT'] },
  { label: 'Accepted', statuses: ['ACCEPTED'] },
  { label: 'Interview', statuses: ['INTERVIEW', 'INTERVIEW_COMPLETED'] },
  { label: 'Recommended', statuses: ['RECOMMENDED', 'MANAGER_REVIEW'] },
  { label: 'Selected', statuses: ['SELECTED'] },
  { label: 'Allocation requested', statuses: ['ALLOCATION_REQUESTED'] },
  { label: 'Allocated', statuses: ['ALLOCATED'] },
]

const STOPPED: Record<string, string> = { DECLINED: 'Declined', REJECTED: 'Rejected', WITHDRAWN: 'Withdrawn' }

/** Turns one candidacy into the journey shown on the RMG screens. */
export function journeyFor(selection: SelectionDTO | undefined): JourneyStep[] {
  if (!selection) return []
  const at = shortDate(selection.updatedAt)
  if (STOPPED[selection.status]) return [{ label: STOPPED[selection.status], date: at, state: 'stop' }]
  const current = STAGES.findIndex((s) => s.statuses.includes(selection.status))
  if (current < 0) return [{ label: humanize(selection.status), date: at, state: 'now' }]
  return STAGES.map((s, i) => ({
    label: s.label,
    date: i === current ? at : i === 0 ? shortDate(selection.createdAt) : undefined,
    state: i < current ? 'done' : i === current ? 'now' : 'todo',
  }))
}
