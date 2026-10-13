import { motion } from 'motion/react'
import {
  Activity,
  ArrowLeftRight,
  Bell,
  CalendarClock,
  ClipboardList,
  FolderKanban,
  Hourglass,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Moon,
  Pencil,
  PieChart,
  Plus,
  RefreshCw,
  ScrollText,
  Sprout,
  Sun,
  TriangleAlert,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import AnimatedCounter from '../ui/AnimatedCounter'

/*
 * A scaled-down, static replica of the real Admin Dashboard (pages/admin/AdminDashboardPage) —
 * same floating sidebar, top bar, green hero tile and bento cards — filled with sample data.
 */

const SIDEBAR: { group: string; items: { label: string; icon: LucideIcon; active?: boolean }[] }[] = [
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
]

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

const TILE =
  'rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_-12px_rgba(15,23,42,0.12)] dark:border-white/7 dark:bg-white/3 dark:shadow-none'

const RADIUS = 15.915

function segmentOffset(index: number) {
  const before = SEGMENTS.slice(0, index).reduce((sum, s) => sum + s.value, 0)
  return 25 - before
}

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

export default function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 text-left shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-ink-900/85 dark:shadow-black/60">
      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 px-4 py-2.5 dark:border-white/10">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-brand-400" />
        <span className="mx-auto rounded-md bg-slate-100 px-3 py-0.5 text-[11px] text-ink-500 dark:bg-white/5 dark:text-slate-400">
          rightfit · admin dashboard
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-brand-600 dark:text-brand-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
          </span>
          Live
        </span>
      </div>

      {/* app canvas */}
      <div className="flex gap-3 bg-slate-50 p-3 dark:bg-ink-950/80">
        {/* floating sidebar */}
        <aside className="hidden w-40 shrink-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-2.5 md:flex dark:border-white/7 dark:bg-ink-900/60">
          <div className="mb-3 flex items-center gap-1.5 px-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-linear-to-br from-brand-500 to-emerald-600 text-white">
              <Sprout className="h-3.5 w-3.5" />
            </span>
            <div className="leading-tight">
              <p className="text-[11px] font-bold text-ink-900 dark:text-white">RightFit</p>
              <p className="text-[7px] font-semibold tracking-wider text-brand-600 uppercase dark:text-brand-400">Administrator</p>
            </div>
          </div>
          <div className="flex-1 space-y-2.5">
            {SIDEBAR.map((group, g) => (
              <div key={group.group}>
                <p className="mb-1 px-1.5 text-[7px] font-semibold tracking-[0.14em] text-ink-500/70 uppercase dark:text-slate-500">
                  {group.group}
                </p>
                {group.items.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + (g * 3 + i) * 0.05 }}
                    className={`relative flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[10px] font-medium ${
                      item.active
                        ? 'bg-brand-500/10 text-brand-700 ring-1 ring-brand-500/20 dark:bg-brand-500/15 dark:text-white'
                        : 'text-ink-500 dark:text-slate-400'
                    }`}
                  >
                    {item.active && <span className="absolute top-1/2 left-0 h-3 w-0.5 -translate-y-1/2 rounded-r-full bg-brand-500" />}
                    <item.icon className={`h-3 w-3 shrink-0 ${item.active ? 'text-brand-600 dark:text-brand-400' : ''}`} />
                    {item.label}
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-1.5 dark:border-white/6 dark:bg-white/3">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-linear-to-br from-brand-400 to-emerald-700 text-[8px] font-bold text-white">
              PS
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[9px] font-semibold text-ink-900 dark:text-white">Priya Singh</p>
              <p className="text-[8px] text-ink-500 dark:text-slate-400">EMP001</p>
            </div>
            <LogOut className="h-3 w-3 text-ink-500 dark:text-slate-400" />
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-3">
          {/* top bar */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 dark:border-white/6 dark:bg-ink-950/60">
            <div className="leading-tight">
              <p className="text-[8px] font-medium tracking-wide text-ink-500 uppercase dark:text-slate-500">Administrator · Overview</p>
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
                  3
                </span>
              </span>
            </div>
          </div>

          {/* hero + attention */}
          <div className="grid gap-3 lg:grid-cols-12">
            <div className="relative isolate overflow-hidden rounded-2xl bg-linear-to-br from-brand-600 via-emerald-600 to-teal-700 p-4 text-white lg:col-span-8 dark:from-brand-700 dark:via-emerald-800 dark:to-ink-900">
              <div aria-hidden className="pointer-events-none absolute -top-16 -right-10 -z-10 h-40 w-40 rounded-full bg-white/25 blur-3xl" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[8px] font-semibold tracking-[0.18em] text-white/70 uppercase">Monday, 13 October</p>
                  <p className="mt-1 text-base font-extrabold tracking-tight sm:text-lg">Good Morning, Priya 👋</p>
                  <p className="mt-1 max-w-sm text-[10px] text-white/80">
                    RightFit has <strong className="text-white">248 employees</strong> across{' '}
                    <strong className="text-white">14 active projects</strong>, guided by 9 managers and 4 RMGs.
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
                  <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                    2
                  </span>
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
                  <div
                    key={item.name}
                    className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/60 px-2 py-1 dark:border-white/6 dark:bg-white/2"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${item.grad} text-[7px] font-bold text-white`}
                    >
                      {item.initials}
                    </span>
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="truncate text-[10px] font-semibold text-ink-900 dark:text-white">{item.name}</p>
                      <p className="truncate text-[8px] text-ink-500 dark:text-slate-400">{item.role}</p>
                    </div>
                    <div className="shrink-0 text-right leading-tight">
                      <p className="text-[9px] font-semibold text-ink-900 dark:text-white">{item.time}</p>
                      <p
                        className={`text-[8px] ${item.day === 'Today' ? 'font-semibold text-brand-600 dark:text-brand-400' : 'text-ink-500 dark:text-slate-400'}`}
                      >
                        {item.day}
                      </p>
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
        </div>
      </div>
    </div>
  )
}
