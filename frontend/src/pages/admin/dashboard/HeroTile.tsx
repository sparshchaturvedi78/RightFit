import { motion } from 'motion/react'
import { Activity, CheckCircle2, RefreshCw, TriangleAlert } from 'lucide-react'
import { ActivityBars } from '../../../components/dashboard/ActivityBars'
import { Skeleton } from '../../../components/dashboard/Panel'
import type { AsyncResult } from '../../../hooks/useAsyncData'
import type { AdminDashboardDTO } from '../../../services/admin/dashboard.service'
import type { AuditLogDTO } from '../../../services/admin/audit.service'
import type { PageResponse } from '../../../services/common.types'
import { bucketByHour, greetingFor, parseServerDate } from '../../../utils/format'

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`
}

export default function HeroTile({
  firstName,
  now,
  dashboard,
  activity,
  refreshing,
  onRefresh,
}: {
  firstName?: string
  now: Date
  dashboard: AsyncResult<AdminDashboardDTO>
  activity: AsyncResult<PageResponse<AuditLogDTO>>
  refreshing: boolean
  onRefresh: () => void
}) {
  const d = dashboard.data
  const pending = d ? d.pendingManagerReplacements + d.pendingRmgReplacements : 0
  const buckets = activity.data ? bucketByHour(activity.data.content.map((e) => parseServerDate(e.timestamp)), now) : null
  const peak = buckets ? Math.max(...buckets) : 0

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="relative isolate h-full overflow-hidden rounded-3xl bg-linear-to-br from-brand-600 via-emerald-600 to-teal-700 p-6 text-white shadow-xl shadow-brand-700/20 sm:p-8 dark:from-brand-700 dark:via-emerald-800 dark:to-ink-900 dark:shadow-black/40"
    >
      {/* texture + light */}
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-[0.12] mix-blend-overlay" />
      <div aria-hidden className="animate-aurora pointer-events-none absolute -top-24 -right-16 -z-10 h-72 w-72 rounded-full bg-white/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-10 -z-10 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-white/70 uppercase">
            {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {greetingFor(now)}, {firstName ?? 'there'}{' '}
            <span className="inline-block origin-[70%_70%] animate-wiggle">👋</span>
          </h1>
          <div className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:text-[15px]">
            {d ? (
              <>
                RightFit has <strong className="font-semibold text-white">{plural(d.totalEmployees, 'employee')}</strong>{' '}
                across <strong className="font-semibold text-white">{plural(d.activeProjects, 'active project')}</strong>,
                guided by {plural(d.totalManagers, 'manager')} and {plural(d.totalRmgs, 'RMG')}.
              </>
            ) : dashboard.error ? (
              "We couldn't load today's summary."
            ) : (
              <Skeleton className="h-4 w-80 bg-white/20 dark:bg-white/15" />
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-white/25 disabled:cursor-wait"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {d && (
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
              pending > 0 ? 'bg-amber-400/25 text-amber-50 ring-amber-200/40' : 'bg-white/15 text-white ring-white/25'
            }`}
          >
            {pending > 0 ? <TriangleAlert className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            {pending > 0 ? `${plural(pending, 'replacement')} pending` : 'All clear — no replacements pending'}
          </span>
        )}
        {d && (
          <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/25">
            <Activity className="h-3.5 w-3.5" />
            {plural(d.auditEntriesLast24h, 'event')} in 24h
          </span>
        )}
      </div>

      <div className="mt-6 rounded-2xl bg-black/10 p-4 ring-1 ring-white/10 backdrop-blur-sm dark:bg-black/20">
        <div className="mb-3 flex items-baseline justify-between text-xs text-white/75">
          <span className="font-semibold text-white">Activity · last 24 hours</span>
          <span>{buckets ? (peak > 0 ? `peak ${peak}/hour` : 'quiet so far') : ''}</span>
        </div>
        {buckets ? <ActivityBars buckets={buckets} /> : <Skeleton className="h-20 bg-white/15 dark:bg-white/10" />}
        <div className="mt-2 flex justify-between text-[10px] font-medium tracking-wide text-white/60 uppercase">
          <span>24h ago</span>
          <span>12h</span>
          <span>now</span>
        </div>
      </div>
    </motion.section>
  )
}
