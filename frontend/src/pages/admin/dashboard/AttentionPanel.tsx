import { motion } from 'motion/react'
import { Bell, ShieldAlert, ShieldCheck, UserX } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AsyncBody, Panel, Skeleton } from '../../../components/dashboard/Panel'
import type { AsyncResult } from '../../../hooks/useAsyncData'
import type { AdminDashboardDTO } from '../../../services/admin/dashboard.service'

function AttentionRow({
  icon,
  title,
  hint,
  count,
  urgent,
  to,
}: {
  icon: ReactNode
  title: string
  hint: string
  count: number
  urgent: boolean
  /** When set (and there is something to act on) the whole row links there. */
  to?: string
}) {
  const body = (
    <>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          urgent ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-white text-ink-500 shadow-sm dark:bg-white/6 dark:text-slate-400 dark:shadow-none'
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink-900 dark:text-white">{title}</p>
        <p className="truncate text-xs text-ink-500 dark:text-slate-400">{hint}</p>
      </div>
      <span
        className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold tabular-nums ${
          urgent ? 'bg-amber-500 text-white' : 'bg-slate-200/80 text-ink-700 dark:bg-white/10 dark:text-slate-300'
        }`}
      >
        {count}
      </span>
    </>
  )
  const surface = `flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors ${
    urgent ? 'border-amber-500/30 bg-amber-500/6' : 'border-slate-200/80 bg-slate-50/60 dark:border-white/6 dark:bg-white/2'
  }`

  return (
    <li>
      {to && count > 0 ? (
        <Link to={to} className={`${surface} hover:border-amber-500/50 hover:bg-amber-500/10`}>
          {body}
        </Link>
      ) : (
        <div className={surface}>{body}</div>
      )}
    </li>
  )
}

export default function AttentionPanel({ state }: { state: AsyncResult<AdminDashboardDTO> }) {
  return (
    <Panel title="Needs attention" subtitle="Replacements & alerts" icon={<ShieldAlert className="h-4 w-4" />} className="h-full">
      <AsyncBody
        state={state}
        skeleton={
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-2xl" />
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 rounded-2xl" />
            ))}
          </div>
        }
      >
        {(d) => {
          const pending = d.pendingManagerReplacements + d.pendingRmgReplacements
          const allClear = pending === 0
          return (
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className={`flex items-center gap-4 rounded-2xl p-4 ${
                  allClear
                    ? 'bg-linear-to-br from-brand-500/12 to-emerald-500/5 text-brand-700 dark:text-brand-300'
                    : 'bg-linear-to-br from-amber-500/15 to-orange-500/5 text-amber-700 dark:text-amber-300'
                }`}
              >
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                  <span
                    className={`animate-pulse-ring absolute inset-0 rounded-full ${allClear ? 'bg-brand-500/30' : 'bg-amber-500/30'}`}
                  />
                  <span
                    className={`relative flex h-11 w-11 items-center justify-center rounded-full text-white ${allClear ? 'bg-brand-500' : 'bg-amber-500'}`}
                  >
                    {allClear ? <ShieldCheck className="h-5 w-5" /> : <span className="text-base font-bold">{pending}</span>}
                  </span>
                </span>
                <div>
                  <p className="text-sm font-semibold">{allClear ? 'Everything is in order' : 'Action needed'}</p>
                  <p className="text-xs opacity-80">
                    {allClear ? 'No inactive managers or RMGs to replace.' : `${pending} replacement${pending === 1 ? '' : 's'} waiting — a manager or RMG has left.`}
                  </p>
                </div>
              </motion.div>

              <ul className="space-y-2.5">
                <AttentionRow
                  icon={<UserX className="h-4 w-4" />}
                  title="Manager replacements"
                  hint="Projects whose manager is now inactive"
                  count={d.pendingManagerReplacements}
                  urgent={d.pendingManagerReplacements > 0}
                  to="/admin/projects?mgr=INACTIVE"
                />
                <AttentionRow
                  icon={<ShieldAlert className="h-4 w-4" />}
                  title="RMG replacements"
                  hint="Associates whose RMG is now inactive"
                  count={d.pendingRmgReplacements}
                  urgent={d.pendingRmgReplacements > 0}
                />
                <AttentionRow
                  icon={<Bell className="h-4 w-4" />}
                  title="Unread notifications"
                  hint="Waiting for you in the bell"
                  count={d.unreadNotifications}
                  urgent={false}
                />
              </ul>
            </div>
          )
        }}
      </AsyncBody>
    </Panel>
  )
}
