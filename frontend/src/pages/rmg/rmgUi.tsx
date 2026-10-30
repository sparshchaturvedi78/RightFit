import { ChevronRight, Loader2, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { TILE_SURFACE } from '../../components/dashboard/Panel'
import type { JourneyStep } from './journey'

export { Card, Due, Row } from '../associate/ui'

const TAG_TONES = {
  muted: 'bg-slate-100 text-ink-700 dark:bg-white/8 dark:text-slate-300',
  ok: 'bg-brand-500/12 text-brand-700 dark:text-brand-300',
  info: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
  warn: 'bg-amber-500/14 text-amber-700 dark:text-amber-300',
  danger: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
}

/** A quiet status tag, toned to what it says. */
export function Tag({ children, tone = 'muted' }: { children: ReactNode; tone?: keyof typeof TAG_TONES }) {
  return <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TAG_TONES[tone]}`}>{children}</span>
}

const AVATAR_COLORS = ['#db2777', '#0284c7', '#ea580c', '#16a34a', '#7c3aed', '#4f46e5']

/** A round-cornered initials tile; the colour is stable for a name. */
export function Avatar({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/)
  const initials = `${parts[0]?.[0] ?? ''}${parts.length > 1 ? parts[parts.length - 1][0] : ''}`.toUpperCase()
  const color = AVATAR_COLORS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_COLORS.length]
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[13px] font-bold text-white" style={{ background: color }}>
      {initials}
    </span>
  )
}

/** Shown in a card while its data is being fetched, so a changed selection never looks like the old data. */
export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 dark:text-slate-400">
      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      {label}…
    </span>
  )
}

/** The close control at the top right of a side panel. */
export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close details"
      className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-ink-500 hover:bg-slate-100 hover:text-ink-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
    >
      <X className="h-4 w-4" />
    </button>
  )
}

/** The chevron that says a row opens its details. */
export function OpenChevron() {
  return <ChevronRight className="h-4 w-4 shrink-0 text-ink-500 transition-transform group-hover:translate-x-0.5 dark:text-slate-500" aria-hidden />
}

/** A person: avatar, name and one quieter line. */
export function Who({ name, detail }: { name: string; detail?: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={name} />
      <div className="min-w-0">
        <b className="block truncate text-sm font-semibold text-ink-900 dark:text-white">{name}</b>
        {detail && <small className="block truncate text-xs text-ink-500 dark:text-slate-400">{detail}</small>}
      </div>
    </div>
  )
}

/** The counts strip at the top of a page: label, big value and a line of context per cell. */
export function Strip({ cells }: { cells: { label: string; value: ReactNode; sub?: ReactNode; segments?: { value: number; className: string }[] }[] }) {
  return (
    <div className={`${TILE_SURFACE} grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0 sm:divide-x xl:grid-cols-[repeat(auto-fit,minmax(0,1fr))] dark:divide-white/6`}>
      {cells.map((c) => (
        <div key={c.label} className="grid gap-1 px-5 py-3.5">
          <span className="text-xs text-ink-500 dark:text-slate-400">{c.label}</span>
          <b className="text-xl font-bold text-ink-900 dark:text-white">{c.value}</b>
          {c.sub && <small className="text-xs text-ink-500 dark:text-slate-400">{c.sub}</small>}
          {c.segments && (
            <span className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/6" aria-hidden>
              {c.segments.map((s, i) => (
                <i key={i} className={`block h-full ${s.className}`} style={{ flexGrow: s.value, flexBasis: 0 }} />
              ))}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

/** A thin progress bar: green by default, amber or rose for attention. */
export function Bar({ value, tone = 'ok' }: { value: number; tone?: 'ok' | 'warn' | 'danger' }) {
  const fill = { ok: 'bg-brand-500', warn: 'bg-amber-500', danger: 'bg-rose-500' }[tone]
  return (
    <span className="block h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
      <i className={`block h-full rounded-full ${fill}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </span>
  )
}

/** Where a person stands in one selection, as a row of steps. */
export function Journey({ steps }: { steps: JourneyStep[] }) {
  const style = {
    done: 'border-brand-500',
    now: 'border-brand-500 bg-brand-500/10',
    stop: 'border-rose-500 bg-rose-500/10',
    todo: 'border-slate-200 opacity-55 dark:border-white/10',
  }
  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((s) => (
        <div key={s.label} className={`grid min-w-24 gap-0.5 rounded-xl border px-2.5 py-2 text-xs ${style[s.state]}`}>
          <span className="font-semibold text-ink-900 dark:text-white">{s.label}</span>
          <small className="text-ink-500 dark:text-slate-400">{s.date ?? (s.state === 'todo' ? 'Not yet' : '')}</small>
        </div>
      ))}
    </div>
  )
}
