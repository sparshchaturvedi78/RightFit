import type { BadgeTone } from '../../../components/ui/Badge'
import type { SignInState, UserAccountDTO } from '../../../services/admin/userAccount.service'
import { parseServerDate } from '../../../utils/format'

/** The four role lanes, in the order they sit on the board. Colours come from the theme tokens. */
export const ROLE_LANES = [
  { key: 'ADMIN', label: 'Admin', color: 'var(--color-brand-600)', soft: 'bg-brand-500/12', note: 'Full access. At least one Admin must stay active.' },
  { key: 'MANAGER', label: 'Manager', color: '#0284c7', soft: 'bg-sky-500/12', note: 'Runs projects and requirements.' },
  { key: 'RMG', label: 'RMG', color: '#d97706', soft: 'bg-amber-500/12', note: 'Looks after a pool of associates.' },
  { key: 'ASSOCIATE', label: 'Associate', color: '#7c3aed', soft: 'bg-violet-500/12', note: 'Works on projects and opportunities.' },
] as const

export type LaneKey = (typeof ROLE_LANES)[number]['key']

export const ROLE_LABEL: Record<string, string> = Object.fromEntries(ROLE_LANES.map((r) => [r.key, r.label]))

export const STATE_TONE: Record<SignInState, BadgeTone> = {
  ALLOWED: 'green',
  BLOCKED: 'rose',
  LOCKED: 'amber',
}

export const STATE_LABEL: Record<SignInState, string> = {
  ALLOWED: 'Can sign in',
  BLOCKED: 'Blocked',
  LOCKED: 'Locked out',
}

/** What the card and the popup say about the account in one phrase. */
export function stateText(u: Pick<UserAccountDTO, 'signInState' | 'neverSignedIn'>): string {
  if (u.signInState === 'ALLOWED' && u.neverSignedIn) return 'Never signed in'
  return STATE_LABEL[u.signInState]
}

export function stateDot(state: SignInState): string {
  return state === 'ALLOWED' ? 'bg-brand-500' : state === 'BLOCKED' ? 'bg-rose-500' : 'bg-amber-500'
}

/** Two-letter avatar text; accounts without an employee record fall back to the employee ID. */
export function accountInitials(u: Pick<UserAccountDTO, 'name' | 'employeeId'>): string {
  const parts = (u.name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return u.employeeId.slice(0, 2).toUpperCase()
  return ((parts[0][0] ?? '') + (parts[1]?.[0] ?? parts[0][1] ?? '')).toUpperCase()
}

export function accountName(u: Pick<UserAccountDTO, 'name' | 'employeeId'>): string {
  return u.name ?? u.employeeId
}

/** "14 Oct 2026, 09:12" for a server timestamp. */
export function stamp(value?: string): string | undefined {
  return value ? parseServerDate(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : undefined
}

/** "Wed, 14 Oct" for a yyyy-MM-dd day from the server (no timezone shift). */
export function dayLabel(value: string): string {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

export const STATE_OPTIONS = [
  { value: 'ALL', label: 'All accounts' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'LOCKED', label: 'Locked out' },
  { value: 'NEVER', label: 'Never signed in' },
] as const
