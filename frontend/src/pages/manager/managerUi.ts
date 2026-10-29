import type { InterviewDTO } from '../../services/interview.service'
import type { PipelineStage } from '../../services/manager/dashboard.service'
import { parseServerDate } from '../../utils/format'

/** Candidate stages on the dashboard, in order, with the colour each one is drawn in. */
export const STAGES: { key: PipelineStage; label: string; bar: string }[] = [
  { key: 'identified', label: 'Identified', bar: 'bg-slate-400 dark:bg-slate-500' },
  { key: 'shortlisted', label: 'Shortlisted', bar: 'bg-sky-500' },
  { key: 'invited', label: 'Invited', bar: 'bg-violet-500' },
  { key: 'interviewing', label: 'Interviewing', bar: 'bg-amber-500' },
  { key: 'selected', label: 'Selected', bar: 'bg-brand-500' },
]

/** Which stage each candidate status belongs to; statuses not listed are out of the process. */
const STAGE_OF_STATUS: Record<string, PipelineStage> = {
  IDENTIFIED: 'identified',
  SHORTLISTED: 'shortlisted',
  INVITATION_SENT: 'invited',
  ACCEPTED: 'invited',
  INTERVIEW: 'interviewing',
  INTERVIEW_COMPLETED: 'interviewing',
  RECOMMENDED: 'interviewing',
  MANAGER_REVIEW: 'interviewing',
  SELECTED: 'selected',
  ALLOCATION_REQUESTED: 'selected',
  ALLOCATED: 'selected',
}

/** The pipeline stage a candidate status sits in, or undefined when the candidate is out of the process. */
export function stageOfStatus(status: string): PipelineStage | undefined {
  return STAGE_OF_STATUS[status]
}

/** Candidates per stage, from the dashboard's status counts. */
export function stageTotals(pipeline: Record<string, number>): Record<PipelineStage, number> {
  const totals: Record<PipelineStage, number> = { identified: 0, shortlisted: 0, invited: 0, interviewing: 0, selected: 0 }
  for (const [status, count] of Object.entries(pipeline)) {
    const stage = STAGE_OF_STATUS[status]
    if (stage) totals[stage] += count
  }
  return totals
}

export function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Monday to Friday of this week; on a weekend, of the coming week. */
export function workWeek(now: Date): Date[] {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dow = monday.getDay() // 0 Sun .. 6 Sat
  const back = dow === 0 ? -1 : dow === 6 ? -2 : dow - 1
  monday.setDate(monday.getDate() - back)
  return Array.from({ length: 5 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i))
}

export function timeOf(value: string): string {
  return parseServerDate(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
}

export type InterviewTone = 'ok' | 'wait' | 'need' | 'done' | 'off'

export const TONE_LABEL: Record<InterviewTone, string> = {
  ok: 'Confirmed',
  wait: 'Awaiting reply',
  need: 'Needs feedback',
  done: 'Done',
  off: 'Not going ahead',
}

/** The colour class for the stripe at the left of an interview chip. */
export const TONE_STRIPE: Record<InterviewTone, string> = {
  ok: 'border-brand-500',
  wait: 'border-sky-500',
  need: 'border-amber-500',
  done: 'border-slate-400 dark:border-slate-500',
  off: 'border-slate-300 border-dashed dark:border-slate-600',
}

/** The legend swatch for each tone. */
export const TONE_DOT: Record<InterviewTone, string> = {
  ok: 'bg-brand-500',
  wait: 'bg-sky-500',
  need: 'bg-amber-500',
  done: 'bg-slate-400',
  off: 'bg-slate-300',
}

/** Where an interview stands for the manager: confirmed, waiting on the candidate, past and without feedback, and so on. */
export function interviewTone(i: InterviewDTO, now: Date): InterviewTone {
  if (i.status === 'CANCELLED' || i.status === 'DECLINED') return 'off'
  if (i.status === 'COMPLETED') return i.feedback ? 'done' : 'need'
  if (parseServerDate(i.scheduledAt) < now) return 'need'
  return i.status === 'ACCEPTED' ? 'ok' : 'wait'
}

export type ReqFilter = 'open' | 'DRAFT' | 'PUBLISHED' | 'ON_HOLD' | 'closed'

export const REQ_FILTERS: { value: ReqFilter; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ON_HOLD', label: 'On hold' },
  { value: 'closed', label: 'Closed' },
]

/** Does a requirement with this status belong under the chosen filter? */
export function matchesReqFilter(status: string, f: ReqFilter): boolean {
  if (f === 'open') return ['DRAFT', 'PUBLISHED', 'ON_HOLD'].includes(status)
  if (f === 'closed') return ['CLOSED', 'CANCELLED', 'ALLOCATED'].includes(status)
  return status === f
}

/** Colours of the status pill on a requirement. */
export const STATUS_PILL: Record<string, string> = {
  PUBLISHED: 'bg-brand-500/12 text-brand-700 dark:text-brand-400',
  ON_HOLD: 'bg-amber-500/14 text-amber-700 dark:text-amber-300',
  DRAFT: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
  CLOSED: 'bg-slate-500/12 text-ink-700 dark:text-slate-300',
  CANCELLED: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

/** Colours of the priority tag on a requirement. */
export const PRIORITY_TAG: Record<string, string> = {
  CRITICAL: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
  HIGH: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  MEDIUM: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
  LOW: 'bg-slate-500/10 text-ink-500 dark:text-slate-400',
}
