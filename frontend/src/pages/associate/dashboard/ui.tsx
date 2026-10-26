import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import AnimatedCounter from '../../../components/ui/AnimatedCounter'

/** The building blocks of the associate dashboards: the same hero, attention panel, KPI tiles and bento tiles as Admin. */

export const TILE =
  'min-w-0 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_-12px_rgba(15,23,42,0.12)] dark:border-white/7 dark:bg-white/3 dark:shadow-none'

export function TileHead({ icon: Icon, title, sub, more }: { icon: LucideIcon; title: string; sub: string; more?: { to: string; label: string } }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-ink-700 dark:bg-white/6 dark:text-slate-300">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0">
        <b className="block text-[15px] font-bold text-ink-900 dark:text-white">{title}</b>
        <small className="block truncate text-xs text-ink-500 dark:text-slate-400">{sub}</small>
      </div>
      {more && (
        <Link to={more.to} className="ml-auto shrink-0 text-xs font-bold text-brand-600 hover:underline dark:text-brand-400">
          {more.label}
        </Link>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- hero */

export function Hero({ children }: { children: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden rounded-[26px] bg-linear-to-br from-brand-600 via-emerald-600 to-teal-700 p-6.5 text-white dark:from-brand-700 dark:via-emerald-800 dark:to-ink-900">
      <div aria-hidden className="pointer-events-none absolute -top-18 -right-10 -z-10 h-60 w-60 rounded-full bg-white/22 blur-[48px]" />
      {children}
    </section>
  )
}

export function HeroTop({ eyebrow, title, lead, actions }: { eyebrow: string; title: string; lead: ReactNode; actions: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[11px] font-bold tracking-[0.2em] text-white/72 uppercase">{eyebrow}</p>
        <h1 className="mt-1.5 text-[28px] leading-tight font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1.5 max-w-[58ch] text-sm text-white/85 [&_strong]:text-white">{lead}</p>
      </div>
      <div className="flex flex-wrap justify-end gap-2">{actions}</div>
    </div>
  )
}

export function Ghost({ children, onClick, to, solid }: { children: ReactNode; onClick?: () => void; to?: string; solid?: boolean }) {
  const cls = `inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-transform hover:scale-[1.03] ${
    solid ? 'bg-white text-emerald-700' : 'bg-white/15 text-white ring-1 ring-white/25 ring-inset'
  }`
  return to ? (
    <Link to={to} className={cls}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  )
}

export function Chips({ children }: { children: ReactNode }) {
  return <div className="mt-3.5 flex flex-wrap gap-2">{children}</div>
}

export function Chip({ icon: Icon, warn, children }: { icon: LucideIcon; warn?: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
        warn ? 'bg-amber-400/26 ring-amber-200/45' : 'bg-white/15 ring-white/25'
      }`}
    >
      <Icon className="h-3.25 w-3.25" />
      {children}
    </span>
  )
}

export function HeroBox({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <div className="mt-4.5 rounded-[18px] bg-black/12 p-3.5 ring-1 ring-white/10 ring-inset">
      <div className="mb-2.5 flex justify-between gap-3 text-[11px] text-white/75">
        <b className="text-white">{title}</b>
        <span>{note}</span>
      </div>
      {children}
    </div>
  )
}

export function Day({ label, side, today, compact, children }: { label: string; side: string; today?: boolean; compact?: boolean; children: ReactNode }) {
  return (
    <div className={`rounded-[14px] p-2 ring-1 ring-inset ${compact ? '' : 'min-h-23'} ${today ? 'bg-white/18 ring-white/40' : 'bg-white/8 ring-white/10'}`}>
      <div className="flex justify-between text-[11px] font-bold text-white">
        {label}
        <span className="font-medium text-white/70">{side}</span>
      </div>
      {children}
    </div>
  )
}

export function Ev({ title, sub, amber }: { title: string; sub: string; amber?: boolean }) {
  return (
    <div className={`mt-1.5 rounded-[9px] px-1.75 py-1.25 text-[11px] ${amber ? 'bg-amber-100 text-amber-900' : 'bg-white/92 text-emerald-900'}`}>
      <b className="block truncate text-[11px]">{title}</b>
      <small className={`block truncate text-[10px] ${amber ? 'text-amber-800' : 'text-teal-700'}`}>{sub}</small>
    </div>
  )
}

export function Free() {
  return <p className="mt-2 text-[10px] text-white/60">Nothing booked</p>
}

/* ---------------------------------------------------------------- attention panel */

export function Attention({
  icon,
  title,
  sub,
  count,
  headline,
  detail,
  rows,
  empty,
}: {
  icon: LucideIcon
  title: string
  sub: string
  count: number
  headline: string
  detail: string
  rows: { label: string; count: number; urgent: boolean; to?: string }[]
  empty?: string
}) {
  return (
    <section className={TILE} aria-label={title}>
      <TileHead icon={icon} title={title} sub={sub} />
      <div className="flex items-center gap-3 rounded-2xl bg-linear-to-br from-amber-500/15 to-transparent p-3 text-amber-600 dark:text-amber-400">
        <span className="relative h-9 w-9 shrink-0">
          <span className="animate-pulse-ring absolute -inset-1.25 rounded-full bg-amber-500/16" />
          <span className="relative grid h-9 w-9 place-items-center rounded-full bg-amber-500 font-extrabold text-white">{count}</span>
        </span>
        <div>
          <b className="block text-sm">{headline}</b>
          <small className="text-xs opacity-85">{detail}</small>
        </div>
      </div>
      {empty ? (
        <p className="mt-3 text-sm text-ink-500 dark:text-slate-400">{empty}</p>
      ) : (
        <div className="mt-3 grid gap-2">
          {rows.map((row) => {
            const body = (
              <>
                <span className="truncate">{row.label}</span>
                <span
                  className={`grid h-5.5 min-w-5.5 shrink-0 place-items-center rounded-full px-1.5 text-[11px] font-extrabold ${
                    row.urgent ? 'bg-amber-500 text-white' : 'bg-slate-100 text-ink-700 dark:bg-white/6 dark:text-slate-300'
                  }`}
                >
                  {row.count}
                </span>
              </>
            )
            const cls = `flex items-center justify-between gap-2 rounded-[13px] border px-3 py-2.5 text-[13px] font-semibold text-ink-900 dark:text-white ${
              row.urgent ? 'border-amber-500/35 bg-amber-500/6' : 'border-slate-200/80 bg-slate-50 dark:border-white/7 dark:bg-white/5'
            }`
            return row.to ? (
              <Link key={row.label} to={row.to} className={`${cls} hover:border-amber-500/60`}>
                {body}
              </Link>
            ) : (
              <div key={row.label} className={cls}>
                {body}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

/* ---------------------------------------------------------------- KPI tiles */

const TONE = {
  brand: { box: 'bg-brand-500/12 text-brand-600 ring-brand-500/25 dark:text-brand-400', bar: 'from-brand-500 to-emerald-400' },
  sky: { box: 'bg-sky-500/12 text-sky-600 ring-sky-500/25 dark:text-sky-400', bar: 'from-sky-500 to-cyan-400' },
  amber: { box: 'bg-amber-500/14 text-amber-600 ring-amber-500/30 dark:text-amber-400', bar: 'from-amber-500 to-orange-400' },
  violet: { box: 'bg-violet-500/12 text-violet-600 ring-violet-500/28 dark:text-violet-400', bar: 'from-violet-500 to-fuchsia-400' },
}

export type Tone = keyof typeof TONE

export function Kpi({ label, icon: Icon, tone, value, text, caption, progress }: { label: string; icon: LucideIcon; tone: Tone; value?: number; text?: string; caption: string; progress: number }) {
  return (
    <div className={`${TILE} px-5 py-4.5`}>
      <div className="flex items-center justify-between gap-2 text-[13px] font-medium text-ink-500 dark:text-slate-400">
        <span className="truncate">{label}</span>
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-[10px] ring-1 ring-inset ${TONE[tone].box}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2.5 text-[32px] leading-none font-extrabold tracking-tight text-ink-900 tabular-nums dark:text-white">
        {text ?? <AnimatedCounter to={value ?? 0} duration={1.2} />}
      </p>
      <p className="mt-1.5 truncate text-xs text-ink-500 dark:text-slate-400">{caption}</p>
      <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/6">
        <motion.i
          className={`block h-full rounded-full bg-linear-to-r ${TONE[tone].bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

/** A thin progress bar with one of the tone gradients. */
export function Bar({ value, tone }: { value: number; tone: Tone }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/6">
      <motion.i
        className={`block h-full rounded-full bg-linear-to-r ${TONE[tone].bar}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
    </div>
  )
}

/* ---------------------------------------------------------------- rows, avatars, tags */

export function Avatar({ name, grad, square, small }: { name: string; grad: string; square?: boolean; small?: boolean }) {
  return (
    <span
      className={`grid shrink-0 place-items-center bg-linear-to-br ${grad} font-extrabold text-white ${square ? 'rounded-[10px]' : 'rounded-full'} ${
        small ? 'h-7 w-7 text-[10px]' : 'h-8 w-8 text-[11px]'
      }`}
    >
      {name}
    </span>
  )
}

export function Li({ lead, title, sub, right }: { lead: ReactNode; title: ReactNode; sub: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[14px] border border-slate-200/80 bg-slate-50 px-2.75 py-2.25 dark:border-white/7 dark:bg-white/5">
      {lead}
      <div className="min-w-0 flex-1">
        <b className="block truncate text-[13px] font-bold text-ink-900 dark:text-white">{title}</b>
        <small className="block truncate text-[11px] text-ink-500 dark:text-slate-400">{sub}</small>
      </div>
      {right}
    </div>
  )
}

export function When({ time, day, today }: { time: string; day: string; today?: boolean }) {
  return (
    <div className="shrink-0 text-right">
      <b className="block text-xs font-bold text-ink-900 dark:text-white">{time}</b>
      <small className={`text-[11px] ${today ? 'font-bold text-brand-600 dark:text-brand-400' : 'text-ink-500 dark:text-slate-400'}`}>{day}</small>
    </div>
  )
}

const TAG = {
  brand: 'bg-brand-500/12 text-brand-700 dark:text-brand-300',
  amber: 'bg-amber-500/14 text-amber-700 dark:text-amber-300',
  sky: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
  violet: 'bg-violet-500/12 text-violet-700 dark:text-violet-300',
  rose: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
  muted: 'bg-slate-100 text-ink-700 dark:bg-white/6 dark:text-slate-300',
}

export function Tag({ tone = 'muted', children }: { tone?: keyof typeof TAG; children: ReactNode }) {
  return <span className={`inline-flex shrink-0 rounded-full px-2.25 py-0.75 text-[11px] font-bold whitespace-nowrap ${TAG[tone]}`}>{children}</span>
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-[14px] border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-ink-500 dark:border-white/10 dark:text-slate-400">{children}</p>
}

/* ---------------------------------------------------------------- journey, ring, activity */

export function Steps({ steps, current, notes }: { steps: string[]; current: number; notes: string[] }) {
  const fill = current <= 0 ? 0 : (current / (steps.length - 1)) * 100
  return (
    <div>
      <div className="relative mx-3.25 -mb-4.25 h-1 rounded-full bg-slate-100 dark:bg-white/6">
        <motion.i className="absolute inset-y-0 left-0 rounded-full bg-brand-500" initial={{ width: 0 }} animate={{ width: `${fill}%` }} transition={{ duration: 0.9 }} />
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((s, i) => {
          const done = i < current
          const now = i === current
          return (
            <div key={s} className={`grid justify-items-center gap-1.5 text-center text-[11px] ${done || now ? 'font-semibold text-ink-900 dark:text-white' : 'text-ink-500 dark:text-slate-400'}`}>
              <span
                className={`relative grid h-6.5 w-6.5 place-items-center rounded-full text-[11px] font-extrabold ${
                  done
                    ? 'bg-brand-500 text-white'
                    : now
                      ? 'bg-brand-500/15 text-brand-600 ring-2 ring-brand-500 dark:text-brand-400'
                      : 'bg-slate-100 text-ink-500 ring-1 ring-slate-200 dark:bg-white/6 dark:text-slate-400 dark:ring-white/7'
                }`}
              >
                {done ? '✓' : i + 1}
              </span>
              {s}
              <small className="text-[10px] font-medium text-ink-500 dark:text-slate-400">{notes[i]}</small>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const RING_COLOR = { brand: '#22c55e', sky: '#0ea5e9', amber: '#f59e0b', violet: '#8b5cf6' }

export function Ring({ value, tone }: { value: number; tone: Tone }) {
  return (
    <span className="relative h-11 w-11 shrink-0">
      <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r="15.915" fill="none" strokeWidth="4" className="stroke-slate-100 dark:stroke-white/6" />
        <motion.circle
          cx="18"
          cy="18"
          r="15.915"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          stroke={RING_COLOR[tone]}
          initial={{ strokeDasharray: '0 100' }}
          animate={{ strokeDasharray: `${value} 100` }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-extrabold text-ink-900 dark:text-white">{value}%</span>
    </span>
  )
}

const ACT_TONE = {
  brand: 'bg-brand-500/12 text-brand-600 dark:text-brand-400',
  sky: 'bg-sky-500/12 text-sky-600 dark:text-sky-400',
  violet: 'bg-violet-500/12 text-violet-600 dark:text-violet-400',
}

export function Act({ icon: Icon, tone, title, sub }: { icon: LucideIcon; tone: keyof typeof ACT_TONE; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className={`grid h-7.5 w-7.5 shrink-0 place-items-center rounded-full ${ACT_TONE[tone]}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <b className="block truncate text-[13px] font-semibold text-ink-900 dark:text-white">{title}</b>
        <small className="block truncate text-[11px] text-ink-500 dark:text-slate-400">{sub}</small>
      </div>
    </div>
  )
}
