import type { ReactNode } from 'react'
import { TILE_SURFACE } from '../../components/dashboard/Panel'

/** A titled panel, the building block of every associate page. */
export function Card({ title, note, action, children }: { title: string; note?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={`${TILE_SURFACE} grid content-start gap-3 p-5`} aria-label={title}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-ink-900 dark:text-white">{title}</h2>
        {action ?? (note && <span className="text-xs text-ink-500 dark:text-slate-400">{note}</span>)}
      </div>
      {children}
    </section>
  )
}

/** One line in a card: a title, a quieter detail line, and something on the right (a tag, a time or a button). */
export function Row({ title, detail, aside }: { title: ReactNode; detail?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 py-2.5 last:border-b-0 dark:border-white/6">
      <div className="min-w-0">
        <b className="block truncate text-sm font-semibold text-ink-900 dark:text-white">{title}</b>
        {detail && <small className="block truncate text-xs text-ink-500 dark:text-slate-400">{detail}</small>}
      </div>
      {aside}
    </div>
  )
}

/** Something with a deadline or that needs the associate's answer. */
export function Due({ children }: { children: ReactNode }) {
  return <span className="shrink-0 rounded-full bg-amber-500/14 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">{children}</span>
}

/** A quiet status tag. */
export function Tag({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'ok' | 'info' }) {
  const tones = {
    muted: 'bg-slate-100 text-ink-700 dark:bg-white/8 dark:text-slate-300',
    ok: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
    info: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
  }
  return <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>
}
