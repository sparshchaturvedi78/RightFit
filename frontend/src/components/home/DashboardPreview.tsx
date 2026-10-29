import { AnimatePresence, motion } from 'motion/react'
import {
  Activity,
  ArrowLeftRight,
  ArrowRight,
  Bell,
  CalendarCheck,
  CalendarClock,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FolderKanban,
  FolderSearch,
  GraduationCap,
  Hourglass,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Mail,
  Moon,
  Pencil,
  PieChart,
  Plus,
  RefreshCw,
  ScrollText,
  Sprout,
  Sun,
  Target,
  TriangleAlert,
  UserRound,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import AnimatedCounter from '../ui/AnimatedCounter'

/*
 * Scaled-down replicas of the four real dashboards, filled with sample data. They share the app shell (floating
 * sidebar and top bar), and each body copies its own page: the Admin overview, the Manager's "week at a glance",
 * the RMG resource overview and the Associate dashboard. The preview rotates through them; the tags in the
 * browser bar show which one is on screen and let a visitor pick one.
 */

const ROTATE_MS = 7000

const TILE =
  'rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_-12px_rgba(15,23,42,0.12)] dark:border-white/7 dark:bg-white/3 dark:shadow-none'

/* ------------------------------------------------------------------ shared pieces (mini versions of the app's) */

function TileHeader({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-ink-700 dark:bg-white/6 dark:text-slate-300">
        <Icon className="h-3 w-3" />
      </span>
      <div className="leading-tight">
        <p className="text-[11px] font-semibold text-ink-900 dark:text-white">{title}</p>
        <p className="text-[9px] text-ink-500 dark:text-slate-400">{subtitle}</p>
      </div>
    </div>
  )
}

/** The page heading every role page uses: eyebrow, title, one line, actions on the right. */
function PageHead({ eyebrow, title, sub, actions }: { eyebrow: string; title: string; sub: string; actions: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 px-0.5">
      <div className="min-w-0">
        <p className="text-[7px] font-bold tracking-[0.14em] text-ink-500 uppercase dark:text-slate-400">{eyebrow}</p>
        <p className="mt-0.5 text-base leading-tight font-extrabold tracking-tight text-ink-900 dark:text-white">{title}</p>
        <p className="mt-0.5 truncate text-[9px] text-ink-500 dark:text-slate-400">{sub}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
    </div>
  )
}

function RefreshPill() {
  return (
    <span className="flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2 py-1 text-[8px] font-semibold text-ink-900 dark:border-white/10 dark:bg-white/5 dark:text-white">
      <RefreshCw className="h-2.5 w-2.5" />
      Refresh
    </span>
  )
}

function PrimaryPill({ children }: { children: ReactNode }) {
  return <span className="flex items-center gap-1 rounded-lg bg-brand-500 px-2 py-1 text-[8px] font-semibold text-white shadow-sm shadow-brand-600/30">{children}</span>
}

/** The figures strip: cells side by side, each optionally with a thin bar showing what it is made of. */
function Strip({ cells }: { cells: { label: string; value: number; caption: string; segments?: { value: number; className: string }[] }[] }) {
  return (
    <div className={`${TILE} grid overflow-hidden`} style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
      {cells.map((c, i) => {
        const total = (c.segments ?? []).reduce((n, s) => n + s.value, 0)
        return (
          <div key={c.label} className={`flex flex-col gap-0.5 p-2.5 ${i > 0 ? 'border-l border-slate-200/80 dark:border-white/7' : ''}`}>
            <span className="truncate text-[8px] font-medium text-ink-500 dark:text-slate-400">{c.label}</span>
            <span className="text-lg leading-none font-extrabold tracking-tight text-ink-900 tabular-nums dark:text-white">
              <AnimatedCounter to={c.value} duration={1} />
            </span>
            <span className="truncate text-[7px] text-ink-500 dark:text-slate-400">{c.caption}</span>
            {c.segments && (
              <span className="mt-1 flex h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/6">
                {total > 0 && c.segments.map((s, k) => <i key={k} className={s.className} style={{ width: `${(s.value / total) * 100}%` }} />)}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** A titled card, like the associate and RMG cards. */
function Card({ title, note, children, className = '' }: { title: string; note?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`${TILE} p-2.5 ${className}`}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold text-ink-900 dark:text-white">{title}</p>
        {note && <span className="text-[8px] text-ink-500 dark:text-slate-400">{note}</span>}
      </div>
      {children}
    </div>
  )
}

function Row({ title, detail, aside }: { title: ReactNode; detail?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-slate-100 py-1.5 first:border-t-0 first:pt-0 dark:border-white/6">
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[9px] font-semibold text-ink-900 dark:text-white">{title}</p>
        {detail && <p className="truncate text-[7px] text-ink-500 dark:text-slate-400">{detail}</p>}
      </div>
      {aside}
    </div>
  )
}

const TAG_TONE = {
  ok: 'bg-brand-500/12 text-brand-700 dark:text-brand-300',
  warn: 'bg-amber-500/14 text-amber-700 dark:text-amber-300',
  danger: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
  info: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
  muted: 'bg-slate-100 text-ink-700 dark:bg-white/8 dark:text-slate-300',
}

function Tag({ tone = 'muted', children }: { tone?: keyof typeof TAG_TONE; children: ReactNode }) {
  return <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[7px] font-semibold ${TAG_TONE[tone]}`}>{children}</span>
}

function Avatar({ initials, grad }: { initials: string; grad: string }) {
  return <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-linear-to-br ${grad} text-[7px] font-bold text-white`}>{initials}</span>
}

function Bar({ value, className }: { value: number; className: string }) {
  return (
    <span className="block h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/6">
      <motion.i
        className={`block h-full rounded-full ${className}`}
        initial={{ width: 0 }}
        whileInView={{ width: `${value}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
    </span>
  )
}

/* ------------------------------------------------------------------ Admin: the original overview */

const ACTIVITY_BARS = [1, 3, 2, 0, 0, 1, 4, 6, 2, 1, 0, 0, 2, 3, 5, 7, 4, 2, 1, 0, 1, 2, 4, 3]

const KPIS = [
  { label: 'Total employees', value: 248, caption: '96% currently active', progress: 96, icon: Users, tone: 'brand' },
  { label: 'In projects', value: 186, caption: 'across 14 projects', progress: 78, icon: FolderKanban, tone: 'sky' },
  { label: 'On bench', value: 42, caption: '5 in the red zone', progress: 18, icon: Hourglass, tone: 'amber' },
  { label: 'Open requirements', value: 12, caption: '3 interviews coming up', icon: ClipboardList, tone: 'violet' },
] as const

const TONES = {
  brand: { icon: 'bg-brand-500/10 text-brand-600 ring-brand-500/20 dark:text-brand-400', bar: 'from-brand-500 to-emerald-400' },
  sky: { icon: 'bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-400', bar: 'from-sky-500 to-cyan-400' },
  amber: { icon: 'bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400', bar: 'from-amber-500 to-orange-400' },
  violet: { icon: 'bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:text-violet-400', bar: 'from-violet-500 to-fuchsia-400' },
}

const SEGMENTS = [
  { label: 'In project', value: 75, color: '#22c55e' },
  { label: 'On bench', value: 17, color: '#38bdf8' },
  { label: 'In training', value: 8, color: '#f59e0b' },
]

const ZONES = [
  { label: 'Green zone', value: 62, count: 26, bar: 'from-brand-500 to-emerald-400', dot: 'bg-brand-500' },
  { label: 'Amber zone', value: 26, count: 11, bar: 'from-amber-400 to-orange-400', dot: 'bg-amber-500' },
  { label: 'Red zone', value: 12, count: 5, bar: 'from-rose-500 to-pink-500', dot: 'bg-rose-500' },
]

const INTERVIEWS = [
  { name: 'Rahul Sharma', role: 'Frontend Developer', time: '10:00 AM', day: 'Today', initials: 'RS', grad: 'from-rose-400 to-orange-400' },
  { name: 'Sneha Patel', role: 'QA Engineer', time: '2:00 PM', day: 'Today', initials: 'SP', grad: 'from-violet-400 to-fuchsia-500' },
  { name: 'Aman Verma', role: 'DevOps Engineer', time: '11:00 AM', day: 'Tomorrow', initials: 'AV', grad: 'from-sky-400 to-indigo-500' },
]

const ACTIVITY: { title: string; detail: string; time: string; icon: LucideIcon; tone: string }[] = [
  { title: 'Requirement published', detail: 'REQ-1042 · Senior React Dev', time: '2m', icon: Plus, tone: 'bg-brand-500/12 text-brand-600 ring-brand-500/25 dark:text-brand-400' },
  { title: 'Allocation updated', detail: 'Priya Mehta → Payments', time: '18m', icon: Pencil, tone: 'bg-sky-500/12 text-sky-600 ring-sky-500/25 dark:text-sky-400' },
  { title: 'Signed in', detail: 'Arjun Mehta · RMG', time: '1h', icon: KeyRound, tone: 'bg-violet-500/12 text-violet-600 ring-violet-500/25 dark:text-violet-400' },
]

const RADIUS = 15.915

function segmentOffset(index: number) {
  const before = SEGMENTS.slice(0, index).reduce((sum, s) => sum + s.value, 0)
  return 25 - before
}

function AdminBody() {
  return (
    <>
      {/* hero + attention */}
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="relative isolate overflow-hidden rounded-2xl bg-linear-to-br from-brand-600 via-emerald-600 to-teal-700 p-4 text-white lg:col-span-8 dark:from-brand-700 dark:via-emerald-800 dark:to-ink-900">
          <div aria-hidden className="pointer-events-none absolute -top-16 -right-10 -z-10 h-40 w-40 rounded-full bg-white/25 blur-3xl" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[8px] font-semibold tracking-[0.18em] text-white/70 uppercase">Monday, 13 October</p>
              <p className="mt-1 text-base font-extrabold tracking-tight sm:text-lg">Good Morning, Priya 👋</p>
              <p className="mt-1 max-w-sm text-[10px] text-white/80">
                RightFit has <strong className="text-white">248 employees</strong> across <strong className="text-white">14 active projects</strong>,
                guided by 9 managers and 4 RMGs.
              </p>
            </div>
            <span className="hidden shrink-0 items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[9px] font-semibold ring-1 ring-white/25 sm:flex">
              <RefreshCw className="h-2.5 w-2.5" />
              Refresh
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-amber-400/25 px-2 py-0.5 text-[9px] font-semibold ring-1 ring-amber-200/40">
              <TriangleAlert className="h-2.5 w-2.5" />2 replacements pending
            </span>
            <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-semibold ring-1 ring-white/25">
              <Activity className="h-2.5 w-2.5" />
              56 events in 24h
            </span>
          </div>
          <div className="mt-3 rounded-xl bg-black/10 p-2.5 ring-1 ring-white/10 dark:bg-black/20">
            <div className="mb-1.5 flex justify-between text-[8px] text-white/75">
              <span className="font-semibold text-white">Activity · last 24 hours</span>
              <span>peak 7/hour</span>
            </div>
            <div className="flex h-12 items-end gap-0.5">
              {ACTIVITY_BARS.map((v, i) => (
                <motion.span
                  key={i}
                  className={`flex-1 rounded-t-[3px] rounded-b-sm ${v === 0 ? 'bg-white/15' : i === ACTIVITY_BARS.length - 1 ? 'bg-white' : 'bg-white/60'}`}
                  initial={{ height: '6%' }}
                  whileInView={{ height: `${v === 0 ? 6 : 14 + (v / 7) * 86}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.3 + i * 0.03, ease: 'easeOut' }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={`${TILE} hidden p-3 lg:col-span-4 lg:block`}>
          <TileHeader icon={TriangleAlert} title="Needs attention" subtitle="Replacements & alerts" />
          <div className="flex items-center gap-2 rounded-xl bg-linear-to-br from-amber-500/15 to-orange-500/5 p-2 text-amber-700 dark:text-amber-300">
            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
              <span className="animate-pulse-ring absolute inset-0 rounded-full bg-amber-500/30" />
              <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">2</span>
            </span>
            <div className="leading-tight">
              <p className="text-[10px] font-semibold">Action needed</p>
              <p className="text-[8px] opacity-80">2 replacements waiting</p>
            </div>
          </div>
          <div className="mt-2 space-y-1.5">
            {[
              { label: 'Manager replacements', count: 1, urgent: true },
              { label: 'RMG replacements', count: 1, urgent: true },
              { label: 'Unread notifications', count: 3, urgent: false },
            ].map((row) => (
              <div
                key={row.label}
                className={`flex items-center justify-between rounded-lg border px-2 py-1.5 text-[9px] font-medium ${
                  row.urgent
                    ? 'border-amber-500/30 bg-amber-500/6 text-ink-900 dark:text-white'
                    : 'border-slate-200/80 bg-slate-50/60 text-ink-900 dark:border-white/6 dark:bg-white/2 dark:text-white'
                }`}
              >
                {row.label}
                <span
                  className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-bold ${
                    row.urgent ? 'bg-amber-500 text-white' : 'bg-slate-200/80 text-ink-700 dark:bg-white/10 dark:text-slate-300'
                  }`}
                >
                  {row.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPIS.map((kpi) => {
          const tone = TONES[kpi.tone]
          return (
            <div key={kpi.label} className={`${TILE} p-3`}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-ink-500 dark:text-slate-400">{kpi.label}</p>
                <span className={`flex h-5 w-5 items-center justify-center rounded-md ring-1 ${tone.icon}`}>
                  <kpi.icon className="h-2.5 w-2.5" />
                </span>
              </div>
              <p className="mt-1.5 text-xl font-bold tracking-tight text-ink-900 tabular-nums dark:text-white">
                <AnimatedCounter to={kpi.value} duration={1.8} />
              </p>
              <p className="text-[9px] text-ink-500 dark:text-slate-400">{kpi.caption}</p>
              {'progress' in kpi && (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/6">
                  <motion.div
                    className={`h-full rounded-full bg-linear-to-r ${tone.bar}`}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${kpi.progress}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.1, delay: 0.5, ease: 'easeOut' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* distribution · bench aging · interviews */}
      <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        <div className={`${TILE} p-3`}>
          <TileHeader icon={PieChart} title="Workforce distribution" subtitle="Active employees right now" />
          <div className="flex items-center gap-3">
            <div className="relative h-20 w-20 shrink-0">
              <svg viewBox="0 0 36 36" className="h-full w-full">
                <circle cx="18" cy="18" r={RADIUS} fill="none" strokeWidth="4" className="stroke-slate-200 dark:stroke-white/10" />
                {SEGMENTS.map((s, i) => (
                  <motion.circle
                    key={s.label}
                    cx="18"
                    cy="18"
                    r={RADIUS}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="4"
                    strokeDashoffset={segmentOffset(i)}
                    initial={{ strokeDasharray: '0 100' }}
                    whileInView={{ strokeDasharray: `${s.value} ${100 - s.value}` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.4 + i * 0.3 }}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                <span className="text-sm font-bold text-ink-900 dark:text-white">75%</span>
                <span className="text-[7px] text-ink-500 dark:text-slate-400">in projects</span>
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              {SEGMENTS.map((s) => (
                <div key={s.label} className="flex items-center gap-1.5 text-[10px]">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-ink-700 dark:text-slate-300">{s.label}</span>
                  <span className="ml-auto font-semibold text-ink-900 dark:text-white">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`${TILE} p-3`}>
          <TileHeader icon={Hourglass} title="Bench aging" subtitle="By the active bench policy" />
          <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/6">
            {ZONES.map((z, i) => (
              <motion.div
                key={z.label}
                className={`h-full bg-linear-to-r ${z.bar}`}
                initial={{ width: 0 }}
                whileInView={{ width: `${z.value}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.4 + i * 0.15, ease: 'easeOut' }}
              />
            ))}
          </div>
          <div className="mt-2.5 space-y-1.5">
            {ZONES.map((z) => (
              <div key={z.label} className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5 font-medium text-ink-900 dark:text-white">
                  <span className={`h-1.5 w-1.5 rounded-full ${z.dot}`} />
                  {z.label}
                </span>
                <span className="text-ink-500 dark:text-slate-400">
                  <span className="font-semibold text-ink-900 dark:text-white">{z.count}</span> · {z.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${TILE} p-3 sm:col-span-2 lg:col-span-1`}>
          <TileHeader icon={CalendarClock} title="Upcoming interviews" subtitle="Across all projects" />
          <div className="space-y-1.5">
            {INTERVIEWS.map((item) => (
              <div key={item.name} className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/60 px-2 py-1 dark:border-white/6 dark:bg-white/2">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${item.grad} text-[7px] font-bold text-white`}>
                  {item.initials}
                </span>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-[10px] font-semibold text-ink-900 dark:text-white">{item.name}</p>
                  <p className="truncate text-[8px] text-ink-500 dark:text-slate-400">{item.role}</p>
                </div>
                <div className="shrink-0 text-right leading-tight">
                  <p className="text-[9px] font-semibold text-ink-900 dark:text-white">{item.time}</p>
                  <p className={`text-[8px] ${item.day === 'Today' ? 'font-semibold text-brand-600 dark:text-brand-400' : 'text-ink-500 dark:text-slate-400'}`}>{item.day}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* recent activity */}
      <div className={`${TILE} hidden p-3 lg:block`}>
        <TileHeader icon={ScrollText} title="Recent activity" subtitle="Audit trail" />
        <div className="grid grid-cols-3 gap-3">
          {ACTIVITY.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 + i * 0.2 }}
              className="flex items-start gap-2"
            >
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ${item.tone}`}>
                <item.icon className="h-2.5 w-2.5" />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[10px] font-medium text-ink-900 dark:text-white">{item.title}</p>
                <p className="truncate text-[8px] text-ink-500 dark:text-slate-400">
                  {item.detail} · {item.time} ago
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ Manager: "Your week at a glance" */

const WEEK: { day: string; date: string; today?: boolean; items: { time: string; name: string; detail: string; tone: string }[] }[] = [
  { day: 'Today', date: '13 Oct', today: true, items: [{ time: '14:30', name: 'Sneha Gupta', detail: 'REQ-1042 · Round 1', tone: 'border-l-amber-400' }] },
  { day: 'Tue', date: '14 Oct', items: [] },
  { day: 'Wed', date: '15 Oct', items: [{ time: '11:00', name: 'Priya Nair', detail: 'REQ-1057 · Round 2', tone: 'border-l-brand-500' }] },
  {
    day: 'Thu',
    date: '16 Oct',
    items: [
      { time: '10:00', name: 'Vikram Desai', detail: 'REQ-1042 · Round 1', tone: 'border-l-sky-500' },
      { time: '16:00', name: 'Rohit Nair', detail: 'REQ-1063 · Round 1', tone: 'border-l-brand-500' },
    ],
  },
  { day: 'Fri', date: '17 Oct', items: [] },
]

function ManagerBody() {
  return (
    <>
      <PageHead
        eyebrow="Monday, 13 October"
        title="Your week at a glance"
        sub="3 projects, 2 open requirements, 4 interviews this week."
        actions={
          <>
            <RefreshPill />
            <PrimaryPill>
              <Plus className="h-2.5 w-2.5" />
              New requirement
            </PrimaryPill>
          </>
        }
      />
      <Strip
        cells={[
          { label: 'My projects', value: 3, caption: '3 claimed · 0 to claim', segments: [{ value: 3, className: 'bg-brand-500' }] },
          {
            label: 'Open requirements',
            value: 2,
            caption: '1 published · 1 on hold · 0 draft',
            segments: [
              { value: 1, className: 'bg-brand-500' },
              { value: 1, className: 'bg-amber-400' },
            ],
          },
          {
            label: 'Candidates in process',
            value: 8,
            caption: '1 waiting for your decision',
            segments: [
              { value: 1, className: 'bg-slate-400' },
              { value: 2, className: 'bg-sky-500' },
              { value: 1, className: 'bg-violet-500' },
              { value: 3, className: 'bg-amber-400' },
              { value: 1, className: 'bg-brand-500' },
            ],
          },
          {
            label: 'Allocation requests',
            value: 1,
            caption: '2 approved · 0 rejected',
            segments: [
              { value: 1, className: 'bg-amber-400' },
              { value: 2, className: 'bg-brand-500' },
            ],
          },
        ]}
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_150px]">
        <div className={`${TILE} p-3`}>
          <TileHeader icon={CalendarClock} title="This week's interviews" subtitle="Your interviews, Monday to Friday" />
          <div className="grid grid-cols-5 gap-1.5">
            {WEEK.map((d) => (
              <div key={d.day} className={`min-h-24 rounded-xl border p-1.5 ${d.today ? 'border-brand-500/50 bg-brand-500/5' : 'border-slate-200/80 dark:border-white/7'}`}>
                <div className="mb-1 flex items-center justify-between text-[7px]">
                  <b className={d.today ? 'text-brand-600 dark:text-brand-400' : 'text-ink-900 dark:text-white'}>{d.day}</b>
                  <span className="text-ink-500 dark:text-slate-400">{d.date}</span>
                </div>
                {d.items.length === 0 ? (
                  <p className="text-[7px] text-ink-500 dark:text-slate-500">Nothing booked</p>
                ) : (
                  <div className="space-y-1">
                    {d.items.map((it) => (
                      <div key={it.time} className={`rounded-md border-l-2 bg-slate-50 px-1 py-0.5 dark:bg-white/5 ${it.tone}`}>
                        <p className="truncate text-[7px] font-bold text-ink-900 dark:text-white">
                          {it.time} · {it.name}
                        </p>
                        <p className="truncate text-[6px] text-ink-500 dark:text-slate-400">{it.detail}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={`${TILE} hidden p-3 lg:block`}>
          <TileHeader icon={CalendarCheck} title="Today" subtitle="Monday, 13 October" />
          <div className="space-y-1">
            {[
              { title: 'Give feedback', detail: 'Vikram Desai · REQ-1042' },
              { title: 'Decide on Sneha Gupta', detail: 'REQ-1042 · interview done' },
              { title: 'Assign an interviewer', detail: 'REQ-1057 · Spring Developer' },
            ].map((a) => (
              <div key={a.title} className="flex items-center gap-1 rounded-lg border border-slate-200/80 bg-slate-50/60 px-1.5 py-1 dark:border-white/6 dark:bg-white/2">
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-[8px] font-semibold text-ink-900 dark:text-white">{a.title}</p>
                  <p className="truncate text-[6px] text-ink-500 dark:text-slate-400">{a.detail}</p>
                </div>
                <ChevronRight className="h-2.5 w-2.5 shrink-0 text-ink-500 dark:text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`${TILE} hidden p-3 sm:block`}>
        <TileHeader icon={ClipboardList} title="Open requirements" subtitle="Where candidates are, and who owns each step" />
        <div className="space-y-1.5">
          {[
            { id: 'REQ-1042', title: 'Senior Java Developer', project: 'FinTech Platform', stages: [1, 2, 0, 2, 1], owners: ['S', 'I', 'C'], tag: <Tag tone="ok">Published</Tag> },
            { id: 'REQ-1057', title: 'Spring Developer', project: 'Doc Validation', stages: [0, 1, 1, 1, 0], owners: ['I'], tag: <Tag tone="warn">On hold</Tag> },
          ].map((r) => {
            const total = r.stages.reduce((n, v) => n + v, 0)
            const colors = ['bg-slate-400', 'bg-sky-500', 'bg-violet-500', 'bg-amber-400', 'bg-brand-500']
            return (
              <div key={r.id} className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-slate-200/80 px-2 py-1.5 dark:border-white/6">
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-[9px] font-semibold text-ink-900 dark:text-white">
                    {r.id} · {r.title}
                  </p>
                  <p className="truncate text-[7px] text-ink-500 dark:text-slate-400">{r.project}</p>
                </div>
                <div className="grid gap-0.5">
                  <span className="flex h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/6">
                    {r.stages.map((v, i) => (
                      <i key={i} className={colors[i]} style={{ width: `${(v / total) * 100}%` }} />
                    ))}
                  </span>
                  <span className="text-[6px] text-ink-500 dark:text-slate-400">{total} in process</span>
                </div>
                <div className="flex items-center gap-1">
                  {r.owners.map((o) => (
                    <span key={o} className="flex h-3.5 w-3.5 items-center justify-center rounded bg-slate-100 text-[6px] font-bold text-ink-700 dark:bg-white/8 dark:text-slate-300">
                      {o}
                    </span>
                  ))}
                  {r.tag}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ RMG: "Resource overview" */

function RmgBody() {
  return (
    <>
      <PageHead
        eyebrow="RMG · Overview"
        title="Resource overview"
        sub="The pool, the bench and what is waiting for an RMG decision today."
        actions={
          <>
            <RefreshPill />
            <PrimaryPill>
              Review 4 requests <ArrowRight className="h-2.5 w-2.5" />
            </PrimaryPill>
          </>
        }
      />
      <Strip
        cells={[
          { label: 'In resource pool', value: 14, caption: 'Free to be allocated' },
          { label: 'On bench', value: 6, caption: '1 over the limit' },
          { label: 'Allocation requests', value: 4, caption: 'Waiting for review' },
          { label: 'Availability checks', value: 3, caption: 'Leave and unavailability' },
          { label: 'Skills in shortage', value: 3, caption: 'Demand above supply' },
        ]}
      />

      <div className="grid items-start gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card title="Needs your decision" note="Oldest first">
          <Row title="Allocation request · Ananya Singh" detail="FinTech Platform · REQ-1042 · starts 1 Nov" aside={<Tag tone="info">Review</Tag>} />
          <Row title="Availability · Amit Rawat" detail="On leave · back 7 Nov" aside={<Tag tone="warn">Verify</Tag>} />
          <Row title="Training interest · Sneha Gupta" detail="Cloud security fundamentals" aside={<Tag tone="info">Decide</Tag>} />
          <Row title="Allocation request · Ravi Mehta" detail="Doc Validation · REQ-1057 · starts 4 Nov" aside={<Tag tone="info">Review</Tag>} />
        </Card>
        <Card title="Longest on bench" note="Days since bench start">
          {[
            { n: 'Neha Iyer', d: 'Associate · Engineering', days: '41 days', tone: 'danger' as const, i: 'NI', g: 'from-pink-500 to-rose-500' },
            { n: 'Ravi Mehta', d: 'Senior associate · Engineering', days: '29 days', tone: 'warn' as const, i: 'RM', g: 'from-sky-500 to-blue-600' },
            { n: 'Sneha Gupta', d: 'Associate · HR', days: '17 days', tone: 'ok' as const, i: 'SG', g: 'from-orange-400 to-amber-500' },
          ].map((p) => (
            <Row
              key={p.n}
              title={
                <span className="flex items-center gap-1.5">
                  <Avatar initials={p.i} grad={p.g} />
                  {p.n}
                </span>
              }
              detail={<span className="pl-6">{p.d}</span>}
              aside={<Tag tone={p.tone}>{p.days}</Tag>}
            />
          ))}
          <p className="pt-1 text-[7px] font-semibold text-brand-600 dark:text-brand-400">Open bench tracking</p>
        </Card>
      </div>

      <div className="hidden items-start gap-3 sm:grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card title="Demand against supply" note="Open requirements vs available people">
          <div className="space-y-1.5">
            {[
              { s: 'Java', t: '7 supply · 12 demand', v: 58, c: 'bg-rose-500' },
              { s: 'Python', t: '8 supply · 9 demand', v: 89, c: 'bg-amber-500' },
              { s: 'AWS', t: '2 supply · 5 demand', v: 40, c: 'bg-rose-500' },
            ].map((d) => (
              <div key={d.s} className="grid gap-0.5">
                <div className="flex justify-between text-[8px]">
                  <b className="text-ink-900 dark:text-white">{d.s}</b>
                  <span className="text-ink-500 dark:text-slate-400">{d.t}</span>
                </div>
                <Bar value={d.v} className={d.c} />
              </div>
            ))}
          </div>
        </Card>
        <Card title="Recent rejections" note="Last 7 days">
          <Row title="Sneha Gupta · REQ-1057" detail="Not a fit for Spring Boot" aside={<Tag tone="danger">Skill gap</Tag>} />
          <Row title="Ananya Singh · REQ-1042" detail="Notice period too long" aside={<Tag tone="warn">Availability</Tag>} />
        </Card>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ Associate: the dashboard in the pool */

const ASSOC_WEEK: { day: string; date: string; today?: boolean; ev?: { title: string; sub: string; amber?: boolean } }[] = [
  { day: 'Today', date: '26', today: true, ev: { title: '14:30 · Interview', sub: 'REQ-1042 · with Khushi' } },
  { day: 'Tue', date: '27' },
  { day: 'Wed', date: '28', ev: { title: '11:00 · Interview', sub: 'REQ-1057 · with Arjun' } },
  { day: 'Thu', date: '29', ev: { title: 'Reply by', sub: 'Invitation · REQ-1057', amber: true } },
  { day: 'Fri', date: '30', ev: { title: 'Training ends', sub: 'Cloud security' } },
]

const ASSOC_KPIS = [
  { label: 'Interviews today', value: 1, suffix: '', caption: '2:30 PM · in person', progress: 100, icon: CalendarClock, tone: 'brand' },
  { label: 'Invitations', value: 1, suffix: '', caption: 'reply by Thu, 29 Oct', progress: 55, icon: Mail, tone: 'amber' },
  { label: 'Requirements for you', value: 3, suffix: '', caption: 'of 9 open match your skills', progress: 33, icon: Target, tone: 'sky' },
  { label: 'Training', value: 60, suffix: '%', caption: 'Cloud security · ends Fri', progress: 60, icon: GraduationCap, tone: 'violet' },
] as const

const ASSOC_STEPS = [
  { label: 'Shortlisted', note: 'Done', state: 'done' },
  { label: 'Invited', note: 'Done', state: 'done' },
  { label: 'Accepted', note: 'Done', state: 'done' },
  { label: 'Interview', note: 'Today', state: 'now' },
  { label: 'Selected', note: 'Next', state: 'todo' },
] as const

const ASSOC_FIT = [
  { label: 'REQ-1042 · Java, Spring Boot', value: 94, bar: 'from-brand-500 to-emerald-400' },
  { label: 'REQ-1057 · Spring, PostgreSQL', value: 81, bar: 'from-sky-500 to-cyan-400' },
  { label: 'REQ-1063 · AWS, Docker', value: 67, bar: 'from-amber-500 to-orange-400' },
]

const ASSOC_INTERVIEWS = [
  { name: 'REQ-1042 · Round 1', role: 'Khushi Singh · In person', time: '2:30 PM', day: 'Today', initials: 'KS', grad: 'from-brand-400 to-emerald-600' },
  { name: 'REQ-1057 · Round 1', role: 'Arjun Rao · Online', time: '11:00 AM', day: 'Wed', initials: 'AR', grad: 'from-sky-400 to-indigo-500' },
  { name: 'REQ-1063 · Round 2', role: 'Divya Nair · Online', time: '4:00 PM', day: 'Fri', initials: 'DN', grad: 'from-violet-400 to-fuchsia-500' },
]

function AssociateBody() {
  return (
    <>
      {/* hero + waiting on you */}
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="relative isolate overflow-hidden rounded-2xl bg-linear-to-br from-brand-600 via-emerald-600 to-teal-700 p-4 text-white lg:col-span-8 dark:from-brand-700 dark:via-emerald-800 dark:to-ink-900">
          <div aria-hidden className="pointer-events-none absolute -top-16 -right-10 -z-10 h-40 w-40 rounded-full bg-white/25 blur-3xl" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[8px] font-semibold tracking-[0.18em] text-white/70 uppercase">Monday, 26 October</p>
              <p className="mt-1 text-base font-extrabold tracking-tight sm:text-lg">Good morning, Sneha</p>
              <p className="mt-1 max-w-sm text-[10px] text-white/80">
                You are in the resource pool. <strong className="text-white">1 invitation</strong> and <strong className="text-white">1 interview</strong> need you
                today, and <strong className="text-white">3 open requirements</strong> match your skills.
              </p>
            </div>
            <span className="hidden shrink-0 items-center gap-1 rounded-full bg-white px-2 py-1 text-[9px] font-bold text-emerald-700 sm:flex">
              Open invitation <ArrowRight className="h-2.5 w-2.5" />
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-amber-400/25 px-2 py-0.5 text-[9px] font-semibold ring-1 ring-amber-200/40">
              <TriangleAlert className="h-2.5 w-2.5" />
              Reply by Thu, 29 Oct
            </span>
            <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-semibold ring-1 ring-white/25">
              <UserRound className="h-2.5 w-2.5" />
              Profile 86% complete
            </span>
            <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-semibold ring-1 ring-white/25">
              <Clock className="h-2.5 w-2.5" />
              In the pool 17 days
            </span>
          </div>
          <div className="mt-3 rounded-xl bg-black/10 p-2.5 ring-1 ring-white/10 dark:bg-black/20">
            <div className="mb-1.5 flex justify-between text-[8px] text-white/75">
              <span className="font-semibold text-white">Your week · interviews and deadlines</span>
              <span>4 things this week</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {ASSOC_WEEK.map((d, i) => (
                <motion.div
                  key={d.day}
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className={`min-h-14 rounded-lg p-1 ring-1 ${d.today ? 'bg-white/18 ring-white/40' : 'bg-white/8 ring-white/10'}`}
                >
                  <div className="flex justify-between text-[7px] font-bold">
                    {d.day}
                    <span className="font-medium text-white/70">{d.date}</span>
                  </div>
                  {d.ev ? (
                    <div className={`mt-1 rounded-md px-1 py-0.5 ${d.ev.amber ? 'bg-amber-100 text-amber-900' : 'bg-white/90 text-emerald-900'}`}>
                      <b className="block truncate text-[7px]">{d.ev.title}</b>
                      <small className={`block truncate text-[6px] ${d.ev.amber ? 'text-amber-800' : 'text-teal-700'}`}>{d.ev.sub}</small>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[6px] text-white/60">Nothing booked</p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className={`${TILE} hidden p-3 lg:col-span-4 lg:block`}>
          <TileHeader icon={TriangleAlert} title="Waiting on you" subtitle="Invitations, selections & interviews" />
          <div className="flex items-center gap-2 rounded-xl bg-linear-to-br from-amber-500/15 to-orange-500/5 p-2 text-amber-700 dark:text-amber-300">
            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
              <span className="animate-pulse-ring absolute inset-0 rounded-full bg-amber-500/30" />
              <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">3</span>
            </span>
            <div className="leading-tight">
              <p className="text-[10px] font-semibold">Action needed</p>
              <p className="text-[8px] opacity-80">3 things to answer</p>
            </div>
          </div>
          <div className="mt-2 space-y-1.5">
            {['Invitation to answer · REQ-1057', 'Selection to confirm · FinTech', 'Interview to accept · Wed 11:00'].map((label) => (
              <div key={label} className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/6 px-2 py-1.5 text-[9px] font-medium text-ink-900 dark:text-white">
                <span className="truncate">{label}</span>
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[8px] font-bold text-white">1</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ASSOC_KPIS.map((kpi) => {
          const tone = TONES[kpi.tone]
          return (
            <div key={kpi.label} className={`${TILE} p-3`}>
              <div className="flex items-center justify-between gap-1">
                <p className="truncate text-[10px] font-medium text-ink-500 dark:text-slate-400">{kpi.label}</p>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 ${tone.icon}`}>
                  <kpi.icon className="h-2.5 w-2.5" />
                </span>
              </div>
              <p className="mt-1.5 text-xl font-bold tracking-tight text-ink-900 tabular-nums dark:text-white">
                <AnimatedCounter to={kpi.value} suffix={kpi.suffix} duration={1.4} />
              </p>
              <p className="truncate text-[9px] text-ink-500 dark:text-slate-400">{kpi.caption}</p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/6">
                <motion.div
                  className={`h-full rounded-full bg-linear-to-r ${tone.bar}`}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${kpi.progress}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.1, delay: 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* journey · skill match · interviews */}
      <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        <div className={`${TILE} p-3`}>
          <TileHeader icon={Activity} title="Selection journey" subtitle="REQ-1042 · Senior Java Developer" />
          <div className="relative mx-2 -mb-2.5 h-0.5 rounded-full bg-slate-100 dark:bg-white/6">
            <motion.i
              className="absolute inset-y-0 left-0 rounded-full bg-brand-500"
              initial={{ width: 0 }}
              whileInView={{ width: '75%' }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
          <div className="grid grid-cols-5 gap-0.5">
            {ASSOC_STEPS.map((s, i) => (
              <div key={s.label} className={`grid justify-items-center gap-0.5 text-center text-[7px] ${s.state === 'todo' ? 'text-ink-500 dark:text-slate-400' : 'font-semibold text-ink-900 dark:text-white'}`}>
                <span
                  className={`relative flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-extrabold ${
                    s.state === 'done'
                      ? 'bg-brand-500 text-white'
                      : s.state === 'now'
                        ? 'bg-brand-500/15 text-brand-600 ring-1 ring-brand-500 dark:text-brand-400'
                        : 'bg-slate-100 text-ink-500 dark:bg-white/6 dark:text-slate-400'
                  }`}
                >
                  {s.state === 'done' ? '✓' : i + 1}
                </span>
                {s.label}
                <small className="text-[6px] font-medium text-ink-500 dark:text-slate-400">{s.note}</small>
              </div>
            ))}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50/60 px-2 py-1 dark:border-white/6 dark:bg-white/2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand-400 to-emerald-600 text-[7px] font-bold text-white">KS</span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[9px] font-semibold text-ink-900 dark:text-white">FinTech Platform</p>
              <p className="truncate text-[7px] text-ink-500 dark:text-slate-400">Manager · Khushi Singh</p>
            </div>
            <span className="rounded-full bg-brand-500/12 px-1.5 py-0.5 text-[7px] font-bold text-brand-700 dark:text-brand-300">On track</span>
          </div>
        </div>

        <div className={`${TILE} p-3`}>
          <TileHeader icon={Target} title="Skill match" subtitle="How you fit the open requirements" />
          <div className="space-y-2.5">
            {ASSOC_FIT.map((f, i) => (
              <div key={f.label}>
                <div className="mb-1 flex justify-between text-[9px]">
                  <span className="truncate font-semibold text-ink-900 dark:text-white">{f.label}</span>
                  <span className="text-ink-500 dark:text-slate-400">{f.value}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/6">
                  <motion.div
                    className={`h-full rounded-full bg-linear-to-r ${f.bar}`}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${f.value}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 0.3 + i * 0.15, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${TILE} p-3 sm:col-span-2 lg:col-span-1`}>
          <TileHeader icon={CalendarClock} title="Upcoming interviews" subtitle="Booked with you" />
          <div className="space-y-1.5">
            {ASSOC_INTERVIEWS.map((item) => (
              <div key={item.name} className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/60 px-2 py-1 dark:border-white/6 dark:bg-white/2">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${item.grad} text-[7px] font-bold text-white`}>{item.initials}</span>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-[10px] font-semibold text-ink-900 dark:text-white">{item.name}</p>
                  <p className="truncate text-[8px] text-ink-500 dark:text-slate-400">{item.role}</p>
                </div>
                <div className="shrink-0 text-right leading-tight">
                  <p className="text-[9px] font-semibold text-ink-900 dark:text-white">{item.time}</p>
                  <p className={`text-[8px] ${item.day === 'Today' ? 'font-semibold text-brand-600 dark:text-brand-400' : 'text-ink-500 dark:text-slate-400'}`}>{item.day}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ the four workspaces */

type Workspace = {
  tag: string
  roleLabel: string
  user: { initials: string; name: string; id: string }
  bell: number
  sidebar: { group: string; items: { label: string; icon: LucideIcon; active?: boolean }[] }[]
  Body: () => ReactNode
}

const WORKSPACES: Workspace[] = [
  {
    tag: 'Admin',
    roleLabel: 'Administrator',
    user: { initials: 'PS', name: 'Priya Singh', id: 'EMP001' },
    bell: 3,
    sidebar: [
      { group: 'Overview', items: [{ label: 'Dashboard', icon: LayoutDashboard, active: true }] },
      {
        group: 'People & projects',
        items: [
          { label: 'Employees', icon: Users },
          { label: 'Projects', icon: FolderKanban },
          { label: 'RMG', icon: UsersRound },
          { label: 'Assignments', icon: ArrowLeftRight },
        ],
      },
      {
        group: 'Insights',
        items: [
          { label: 'Audit log', icon: ScrollText },
          { label: 'Reports', icon: Activity },
        ],
      },
    ],
    Body: AdminBody,
  },
  {
    tag: 'Manager',
    roleLabel: 'Manager',
    user: { initials: 'KS', name: 'Khushi Singh', id: 'EMP008' },
    bell: 4,
    sidebar: [
      { group: 'Overview', items: [{ label: 'Dashboard', icon: LayoutDashboard, active: true }] },
      {
        group: 'Projects & people',
        items: [
          { label: 'Projects', icon: FolderKanban },
          { label: 'My people', icon: UsersRound },
          { label: 'Employee directory', icon: Users },
        ],
      },
      {
        group: 'Hiring',
        items: [
          { label: 'Requirements', icon: ClipboardList },
          { label: 'Interviews', icon: CalendarClock },
          { label: 'Allocation requests', icon: ClipboardCheck },
        ],
      },
      { group: 'Insights', items: [{ label: 'Reports', icon: Activity }] },
    ],
    Body: ManagerBody,
  },
  {
    tag: 'RMG',
    roleLabel: 'RMG',
    user: { initials: 'CC', name: 'Chitransh Chaturvedi', id: 'EMP009' },
    bell: 2,
    sidebar: [
      { group: 'Overview', items: [{ label: 'Dashboard', icon: LayoutDashboard, active: true }] },
      {
        group: 'Resource',
        items: [
          { label: 'Resource pool', icon: UsersRound },
          { label: 'Bench tracking', icon: Clock },
          { label: 'Availability checks', icon: CalendarCheck },
          { label: 'Allocation requests', icon: ClipboardCheck },
        ],
      },
      { group: 'Learning', items: [{ label: 'Training programs', icon: GraduationCap }] },
      { group: 'Insights', items: [{ label: 'Reports', icon: Activity }] },
    ],
    Body: RmgBody,
  },
  {
    tag: 'Associate',
    roleLabel: 'Associate',
    user: { initials: 'SG', name: 'Sneha Gupta', id: 'EMP006' },
    bell: 2,
    sidebar: [
      { group: 'Overview', items: [{ label: 'Dashboard', icon: LayoutDashboard, active: true }] },
      {
        group: 'Find work',
        items: [
          { label: 'Projects', icon: FolderSearch },
          { label: 'Invitations', icon: Mail },
          { label: 'Interviews', icon: CalendarClock },
        ],
      },
      { group: 'Learning', items: [{ label: 'Training', icon: GraduationCap }] },
      {
        group: 'Me',
        items: [
          { label: 'Profile and skills', icon: UserRound },
          { label: 'Availability', icon: Clock },
        ],
      },
    ],
    Body: AssociateBody,
  },
]

export default function DashboardPreview() {
  const [index, setIndex] = useState(0)

  // Moves to the next workspace on its own; picking a tag restarts the wait from that one.
  useEffect(() => {
    const timer = setTimeout(() => setIndex((i) => (i + 1) % WORKSPACES.length), ROTATE_MS)
    return () => clearTimeout(timer)
  }, [index])

  const ws = WORKSPACES[index]

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 text-left shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-ink-900/85 dark:shadow-black/60">
      {/* browser chrome, with one tag per role */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 px-4 py-2 dark:border-white/10">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-brand-400" />
        <div className="mx-auto flex items-center gap-0.5 rounded-full bg-slate-100 p-0.5 dark:bg-white/5" role="tablist" aria-label="Dashboard by role">
          {WORKSPACES.map((w, i) => {
            const active = i === index
            return (
              <button
                key={w.tag}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setIndex(i)}
                className={`relative overflow-hidden rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors sm:px-3 ${
                  active ? 'bg-white text-brand-700 shadow-sm dark:bg-white/10 dark:text-white' : 'text-ink-500 hover:text-ink-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {w.tag}
                {active && (
                  <motion.span
                    key={index}
                    className="absolute bottom-0 left-0 h-0.5 bg-brand-500"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: ROTATE_MS / 1000, ease: 'linear' }}
                  />
                )}
              </button>
            )
          })}
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-brand-600 dark:text-brand-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
          </span>
          Live
        </span>
      </div>

      {/* app canvas */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={ws.tag}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex gap-3 bg-slate-50 p-3 dark:bg-ink-950/80"
        >
          <Shell ws={ws} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/** The app shell every role shares: the floating sidebar and the top bar, around the role's own page. */
function Shell({ ws }: { ws: Workspace }) {
  const { Body } = ws
  return (
    <>
      <aside className="hidden w-40 shrink-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-2.5 md:flex dark:border-white/7 dark:bg-ink-900/60">
        <div className="mb-3 flex items-center gap-1.5 px-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-linear-to-br from-brand-500 to-emerald-600 text-white">
            <Sprout className="h-3.5 w-3.5" />
          </span>
          <div className="leading-tight">
            <p className="text-[11px] font-bold text-ink-900 dark:text-white">RightFit</p>
            <p className="text-[7px] font-semibold tracking-wider text-brand-600 uppercase dark:text-brand-400">{ws.roleLabel}</p>
          </div>
        </div>
        <div className="flex-1 space-y-2.5">
          {ws.sidebar.map((group, g) => (
            <div key={group.group}>
              <p className="mb-1 px-1.5 text-[7px] font-semibold tracking-[0.14em] text-ink-500/70 uppercase dark:text-slate-500">{group.group}</p>
              {group.items.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + (g * 3 + i) * 0.05 }}
                  className={`relative flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[10px] font-medium ${
                    item.active ? 'bg-brand-500/10 text-brand-700 ring-1 ring-brand-500/20 dark:bg-brand-500/15 dark:text-white' : 'text-ink-500 dark:text-slate-400'
                  }`}
                >
                  {item.active && <span className="absolute top-1/2 left-0 h-3 w-0.5 -translate-y-1/2 rounded-r-full bg-brand-500" />}
                  <item.icon className={`h-3 w-3 shrink-0 ${item.active ? 'text-brand-600 dark:text-brand-400' : ''}`} />
                  <span className="truncate">{item.label}</span>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-1.5 dark:border-white/6 dark:bg-white/3">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-linear-to-br from-brand-400 to-emerald-700 text-[8px] font-bold text-white">{ws.user.initials}</span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[9px] font-semibold text-ink-900 dark:text-white">{ws.user.name}</p>
            <p className="text-[8px] text-ink-500 dark:text-slate-400">{ws.user.id}</p>
          </div>
          <LogOut className="h-3 w-3 text-ink-500 dark:text-slate-400" />
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 dark:border-white/6 dark:bg-ink-950/60">
          <div className="leading-tight">
            <p className="text-[8px] font-medium tracking-wide text-ink-500 uppercase dark:text-slate-500">{ws.roleLabel} · Overview</p>
            <p className="text-xs font-semibold text-ink-900 dark:text-white">Dashboard</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center rounded-full border border-slate-200/80 bg-white p-0.5 dark:border-white/10 dark:bg-white/5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-900 text-white dark:bg-transparent dark:text-slate-400">
                <Sun className="h-2.5 w-2.5" />
              </span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full text-ink-500 dark:bg-white dark:text-ink-950">
                <Moon className="h-2.5 w-2.5" />
              </span>
            </div>
            <span className="relative flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
              <Bell className="animate-wiggle h-3 w-3 text-ink-700 dark:text-slate-300" />
              <span className="absolute -top-0.5 -right-0.5 flex h-3 min-w-3 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[7px] font-bold text-white">
                {ws.bell}
              </span>
            </span>
          </div>
        </div>
        <Body />
      </div>
    </>
  )
}
