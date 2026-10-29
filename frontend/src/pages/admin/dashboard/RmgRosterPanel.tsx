import { motion } from 'motion/react'
import { UsersRound } from 'lucide-react'
import { AsyncBody, EmptyState, Panel, Skeleton } from '../../../components/dashboard/Panel'
import type { AsyncResult } from '../../../hooks/useAsyncData'
import type { RmgDetailDTO } from '../../../services/admin/rmg.service'
import { initialsOf } from '../../../utils/format'

const AVATAR_GRADIENTS = [
  'from-brand-400 to-emerald-600',
  'from-sky-400 to-indigo-500',
  'from-violet-400 to-fuchsia-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-cyan-400 to-blue-500',
]

const MAX_ROWS = 5

export default function RmgRosterPanel({ state }: { state: AsyncResult<RmgDetailDTO[]> }) {
  const total = state.data?.reduce((sum, r) => sum + r.associateCount, 0) ?? 0
  return (
    <Panel
      title="RMG roster"
      subtitle={state.data ? `${state.data.length} RMG${state.data.length === 1 ? '' : 's'} · ${total} associates` : 'Resource managers'}
      icon={<UsersRound className="h-4 w-4" />}
      className="h-full"
    >
      <AsyncBody
        state={state}
        skeleton={
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-2xl" />
            ))}
          </div>
        }
      >
        {(rmgs) => {
          if (rmgs.length === 0) {
            return <EmptyState icon={<UsersRound className="h-5 w-5" />}>No RMGs yet. Assign the RMG role to someone to see them here.</EmptyState>
          }

          const sorted = [...rmgs].sort((a, b) => b.associateCount - a.associateCount).slice(0, MAX_ROWS)
          const max = Math.max(...sorted.map((r) => r.associateCount), 1)

          return (
            <ul className="space-y-2">
              {sorted.map((rmg, i) => {
                const [first, ...rest] = rmg.rmgName.split(' ')
                return (
                  <motion.li
                    key={rmg.rmgId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                    className="flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/3"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} text-xs font-bold text-white shadow-sm`}
                    >
                      {initialsOf(first, rest.join(' '))}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-ink-900 dark:text-white">
                          {rmg.rmgName}
                          {rmg.status !== 'ACTIVE' && (
                            <span className="ml-2 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                              {rmg.status}
                            </span>
                          )}
                        </p>
                        <span className="shrink-0 text-xs text-ink-500 dark:text-slate-400">
                          <span className="font-semibold text-ink-900 tabular-nums dark:text-white">{rmg.associateCount}</span>{' '}
                          associate{rmg.associateCount === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="w-16 shrink-0 truncate text-[11px] text-ink-500 dark:text-slate-500">{rmg.employeeId}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/6">
                          <motion.div
                            className="h-full rounded-full bg-linear-to-r from-brand-500 to-cyan-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${(rmg.associateCount / max) * 100}%` }}
                            transition={{ duration: 0.9, delay: 0.25 + i * 0.1, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.li>
                )
              })}
            </ul>
          )
        }}
      </AsyncBody>
    </Panel>
  )
}
