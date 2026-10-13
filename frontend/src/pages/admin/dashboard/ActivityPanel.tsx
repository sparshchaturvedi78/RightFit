import { motion } from 'motion/react'
import { KeyRound, Pencil, Plus, ScrollText, Trash2, Zap, type LucideIcon } from 'lucide-react'
import { AsyncBody, EmptyState, Panel, Skeleton } from '../../../components/dashboard/Panel'
import type { AsyncResult } from '../../../hooks/useAsyncData'
import type { PageResponse } from '../../../services/common.types'
import type { AuditLogDTO } from '../../../services/admin/audit.service'
import { humanize, timeAgo } from '../../../utils/format'

/** How many events the timeline lists (the hero chart uses the full page). */
const VISIBLE = 6

function kindOf(entry: AuditLogDTO): { icon: LucideIcon; tone: string } {
  const action = entry.action.toUpperCase()
  if (entry.status !== 'SUCCESS' || /DELETE|REMOVE|DEACTIVAT|CLOSE|CLOSURE|REJECT|CANCEL|REVOK/.test(action))
    return { icon: Trash2, tone: 'bg-rose-500/12 text-rose-600 ring-rose-500/25 dark:text-rose-400' }
  if (/CREATE|ADD|ASSIGN|PUBLISH|APPROVE|REACTIVAT/.test(action))
    return { icon: Plus, tone: 'bg-brand-500/12 text-brand-600 ring-brand-500/25 dark:text-brand-400' }
  if (/UPDATE|CHANGE|MODIFY|REPLACE|REOPEN/.test(action))
    return { icon: Pencil, tone: 'bg-sky-500/12 text-sky-600 ring-sky-500/25 dark:text-sky-400' }
  if (/LOGIN|LOGOUT|AUTH|PASSWORD|OTP/.test(action))
    return { icon: KeyRound, tone: 'bg-violet-500/12 text-violet-600 ring-violet-500/25 dark:text-violet-400' }
  return { icon: Zap, tone: 'bg-amber-500/12 text-amber-600 ring-amber-500/25 dark:text-amber-400' }
}

function actorOf(entry: AuditLogDTO): string {
  return entry.performedByEmail && entry.performedByEmail !== 'system' ? entry.performedByEmail : 'System'
}

export default function ActivityPanel({
  state,
  now,
}: {
  state: AsyncResult<PageResponse<AuditLogDTO>>
  now: Date
}) {
  return (
    <Panel
      title="Recent activity"
      subtitle={state.data ? `${state.data.totalElements} events recorded` : 'Audit trail'}
      icon={<ScrollText className="h-4 w-4" />}
      className="h-full"
    >
      <AsyncBody
        state={state}
        skeleton={
          <div className="space-y-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-11 rounded-xl" />
            ))}
          </div>
        }
      >
        {(page) => {
          const entries = page.content.slice(0, VISIBLE)
          if (entries.length === 0) {
            return <EmptyState icon={<ScrollText className="h-5 w-5" />}>No activity recorded yet.</EmptyState>
          }

          return (
            <ol className="relative">
              <span
                aria-hidden
                className="absolute top-2 bottom-2 left-3.75 w-px bg-linear-to-b from-slate-200 via-slate-200 to-transparent dark:from-white/10 dark:via-white/10"
              />
              {entries.map((entry, i) => {
                const { icon: Icon, tone } = kindOf(entry)
                return (
                  <motion.li
                    key={entry.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12 + i * 0.06 }}
                    className="relative flex gap-3 pb-4 last:pb-0"
                  >
                    <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 backdrop-blur ${tone}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-sm font-medium text-ink-900 dark:text-white">{humanize(entry.action)}</p>
                        <span className="shrink-0 text-[11px] text-ink-500 tabular-nums dark:text-slate-500">
                          {timeAgo(entry.timestamp, now)}
                        </span>
                      </div>
                      <p className="truncate text-xs text-ink-500 dark:text-slate-400">
                        {entry.changeSummary ?? humanize(entry.entityType)} · {actorOf(entry)}
                      </p>
                    </div>
                  </motion.li>
                )
              })}
            </ol>
          )
        }}
      </AsyncBody>
    </Panel>
  )
}
