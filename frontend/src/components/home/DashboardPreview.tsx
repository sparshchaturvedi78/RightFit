import { motion } from 'motion/react'
import {
  Bell,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Search,
  Shuffle,
  Users,
  UsersRound,
} from 'lucide-react'
import AnimatedCounter from '../ui/AnimatedCounter'

const SIDEBAR = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Employees', icon: Users },
  { label: 'Resource Pool', icon: UsersRound },
  { label: 'Requirements', icon: ClipboardList },
  { label: 'Allocations', icon: Shuffle },
  { label: 'Training', icon: GraduationCap },
]

const KPIS = [
  { label: 'Total Employees', value: 248, change: '+12%' },
  { label: 'On Bench', value: 42, change: '+5%' },
  { label: 'In Projects', value: 186, change: '+8%' },
  { label: 'Open Requirements', value: 12, change: '+33%' },
]

const SEGMENTS = [
  { label: 'In Project', value: 75, color: '#22c55e' },
  { label: 'On Bench', value: 17, color: '#38bdf8' },
  { label: 'In Training', value: 8, color: '#f59e0b' },
]

const ZONES = [
  { label: 'Green · 0–90 days', value: 62, color: 'bg-brand-500' },
  { label: 'Amber · 90–120 days', value: 26, color: 'bg-amber-400' },
  { label: 'Red · 120+ days', value: 12, color: 'bg-rose-500' },
]

const INTERVIEWS = [
  { name: 'Rahul Sharma', role: 'Frontend Developer', time: '10:00 AM', initials: 'RS', grad: 'from-rose-400 to-orange-400' },
  { name: 'Sneha Patel', role: 'QA Engineer', time: '2:00 PM', initials: 'SP', grad: 'from-violet-400 to-fuchsia-400' },
  { name: 'Aman Verma', role: 'DevOps Engineer', time: '11:00 AM', initials: 'AV', grad: 'from-sky-400 to-indigo-500' },
]

const ACTIVITY = [
  { text: 'Requirement REQ-1042 published', time: '2m ago', dot: 'bg-brand-500' },
  { text: 'Priya Mehta allocated to Payments', time: '18m ago', dot: 'bg-sky-500' },
  { text: 'Interview scheduled with Rahul', time: '1h ago', dot: 'bg-violet-500' },
  { text: 'Security Fundamentals assigned', time: '3h ago', dot: 'bg-amber-500' },
]

const LINE = 'M0,78 C25,74 40,60 62,63 S100,42 125,46 S170,24 195,28 S245,12 270,14 S295,6 300,6'
const AREA = `${LINE} L300,100 L0,100 Z`

const PANEL =
  'rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-white/5 dark:bg-white/4'

function segmentOffset(index: number) {
  const before = SEGMENTS.slice(0, index).reduce((sum, s) => sum + s.value, 0)
  return 25 - before
}

export default function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 text-left shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-ink-900/85 dark:shadow-black/60">
      <div className="flex items-center gap-2 border-b border-slate-200/80 px-4 py-2.5 dark:border-white/10">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-brand-400" />
        <span className="mx-auto rounded-md bg-slate-100 px-3 py-0.5 text-[11px] text-ink-500 dark:bg-white/5 dark:text-slate-400">
          rightfit · dashboard
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-brand-600 dark:text-brand-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
          </span>
          Live
        </span>
      </div>

      <div className="flex">
        <aside className="hidden w-44 shrink-0 flex-col gap-1 border-r border-slate-200/80 p-3 md:flex dark:border-white/10">
          {SIDEBAR.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.06 }}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium ${
                item.active
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-ink-500 dark:text-slate-400'
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </motion.div>
          ))}
        </aside>

        <div className="min-w-0 flex-1 space-y-3 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ink-900 sm:text-base dark:text-white">Good Morning, Priya 👋</p>
              <p className="text-xs text-ink-500 dark:text-slate-400">Here's what's happening today.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[11px] text-ink-500 sm:flex dark:border-white/10 dark:text-slate-400">
                <Search className="h-3 w-3" />
                Search employees...
              </div>
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10">
                <Bell className="animate-wiggle h-4 w-4 text-ink-700 dark:text-slate-300" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500" />
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-brand-400 to-emerald-700 text-[10px] font-bold text-white">
                PS
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {KPIS.map((kpi) => (
              <div key={kpi.label} className={PANEL}>
                <p className="text-[11px] text-ink-500 dark:text-slate-400">{kpi.label}</p>
                <div className="mt-1 flex items-end justify-between">
                  <p className="text-xl font-bold text-ink-900 dark:text-white">
                    <AnimatedCounter to={kpi.value} duration={1.8} />
                  </p>
                  <span className="rounded-full bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                    ↑ {kpi.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-2.5 lg:grid-cols-3">
            <div className={`${PANEL} lg:col-span-2`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-ink-700 dark:text-slate-300">Resource Allocation Trend</p>
                <span className="text-[10px] text-ink-500 dark:text-slate-400">Jan – Jun</span>
              </div>
              <svg viewBox="0 0 300 100" className="mt-2 h-24 w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="dashArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <motion.path
                  d={AREA}
                  fill="url(#dashArea)"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 1 }}
                />
                <motion.path
                  d={LINE}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.3 }}
                />
              </svg>
            </div>

            <div className={PANEL}>
              <p className="text-xs font-semibold text-ink-700 dark:text-slate-300">Workforce Distribution</p>
              <div className="mt-2 flex items-center gap-3">
                <svg viewBox="0 0 36 36" className="h-20 w-20 shrink-0">
                  <circle cx="18" cy="18" r="15.915" fill="none" strokeWidth="4" className="stroke-slate-200 dark:stroke-white/10" />
                  {SEGMENTS.map((s, i) => (
                    <motion.circle
                      key={s.label}
                      cx="18"
                      cy="18"
                      r="15.915"
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
                <div className="space-y-1.5">
                  {SEGMENTS.map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5 text-[11px]">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-ink-500 dark:text-slate-400">{s.label}</span>
                      <span className="font-semibold text-ink-900 dark:text-white">{s.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="hidden gap-2.5 sm:grid lg:grid-cols-3">
            <div className={PANEL}>
              <p className="text-xs font-semibold text-ink-700 dark:text-slate-300">Bench Aging</p>
              <div className="mt-3 space-y-2.5">
                {ZONES.map((z, i) => (
                  <div key={z.label}>
                    <div className="mb-1 flex justify-between text-[10px] text-ink-500 dark:text-slate-400">
                      <span>{z.label}</span>
                      <span>{z.value}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                      <motion.div
                        className={`h-full rounded-full ${z.color}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${z.value}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: 0.5 + i * 0.2, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={PANEL}>
              <p className="text-xs font-semibold text-ink-700 dark:text-slate-300">Upcoming Interviews</p>
              <div className="mt-2 space-y-1.5">
                {INTERVIEWS.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 dark:bg-black/30"
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${item.grad} text-[9px] font-bold text-white`}
                    >
                      {item.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-ink-900 dark:text-white">{item.name}</p>
                      <p className="truncate text-[10px] text-ink-500 dark:text-slate-400">{item.role}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-ink-500 dark:text-slate-400">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={PANEL}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-ink-700 dark:text-slate-300">Recent Activity</p>
                <span className="text-[10px] font-medium text-brand-600 dark:text-brand-400">View all</span>
              </div>
              <div className="mt-2 space-y-2">
                {ACTIVITY.map((item, i) => (
                  <motion.div
                    key={item.text}
                    initial={{ opacity: 0, x: 12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 + i * 0.25 }}
                    className="flex items-start gap-2"
                  >
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.dot}`} />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-medium text-ink-900 dark:text-white">{item.text}</p>
                      <p className="text-[10px] text-ink-500 dark:text-slate-400">{item.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
