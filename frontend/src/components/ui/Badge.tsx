import type { ReactNode } from 'react'

export type BadgeTone = 'green' | 'amber' | 'rose' | 'sky' | 'violet' | 'slate'

const TONES: Record<BadgeTone, string> = {
  green: 'bg-brand-500/10 text-brand-700 ring-brand-500/20 dark:text-brand-300',
  amber: 'bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300',
  rose: 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-300',
  sky: 'bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300',
  violet: 'bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300',
  slate: 'bg-slate-500/10 text-ink-700 ring-slate-500/20 dark:text-slate-300',
}

const DOTS: Record<BadgeTone, string> = {
  green: 'bg-brand-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
  slate: 'bg-slate-400',
}

export function Badge({ tone = 'slate', dot, children }: { tone?: BadgeTone; dot?: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ring-1 ${TONES[tone]}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOTS[tone]}`} />}
      {children}
    </span>
  )
}
