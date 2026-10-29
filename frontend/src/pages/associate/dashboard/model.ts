import { parseServerDate } from '../../../utils/format'

/** The five avatar gradients used across the associate dashboards, in order. */
export const AVATARS = [
  'from-rose-400 to-orange-400',
  'from-violet-400 to-fuchsia-500',
  'from-sky-400 to-indigo-500',
  'from-brand-400 to-emerald-600',
  'from-amber-400 to-pink-500',
]

export function avatarOf(index: number): string {
  return AVATARS[index % AVATARS.length]
}

export function initials(name?: string): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return `${parts[0][0]}${parts.length > 1 ? parts[parts.length - 1][0] : ''}`.toUpperCase()
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** Monday to Friday of the week that holds `now`. */
export function workWeek(now: Date): Date[] {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7))
  return Array.from({ length: 5 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i))
}

/** "Today", "Tomorrow" or the short weekday. */
export function dayWord(date: Date, now: Date): string {
  if (sameDay(date, now)) return 'Today'
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  if (sameDay(date, tomorrow)) return 'Tomorrow'
  return date.toLocaleDateString(undefined, { weekday: 'short' })
}

export function timeOf(value: string): string {
  return parseServerDate(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function clock(value: string): string {
  return parseServerDate(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
}

/** "26 Oct" (or "26 Oct 2026" with the year). */
export function shortDay(value?: string, withYear = false): string {
  if (!value) return '—'
  return parseServerDate(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) })
}

export function longToday(now: Date): string {
  return now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
}

export function greeting(now: Date): string {
  const h = now.getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

/** Splits a requirement's skill text ("Java, Spring Boot") into lower-case names. */
export function skillList(text?: string): string[] {
  return (text ?? '')
    .split(/[,;/|]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** How many of the required skills the person has, as a percentage; null when the requirement lists none. */
export function fitOf(required: string[], mine: Set<string>): number | null {
  if (required.length === 0) return null
  const hit = required.filter((s) => mine.has(s.toLowerCase())).length
  return Math.round((hit / required.length) * 100)
}

/** The five selection steps an associate sees, and which one a candidacy status has reached. */
export const STEPS = ['Shortlisted', 'Invited', 'Accepted', 'Interview', 'Selected']

export function stepOf(status: string): number {
  if (['IDENTIFIED', 'SHORTLISTED'].includes(status)) return 0
  if (status === 'INVITATION_SENT') return 1
  if (status === 'ACCEPTED') return 2
  if (['INTERVIEW', 'INTERVIEW_COMPLETED', 'RECOMMENDED', 'MANAGER_REVIEW'].includes(status)) return 3
  if (['SELECTED', 'ALLOCATION_REQUESTED', 'ALLOCATED'].includes(status)) return 4
  return -1
}

/** Candidacy statuses that are over. */
export const ENDED = ['DECLINED', 'REJECTED', 'WITHDRAWN', 'ALLOCATED']

export function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)))
}
