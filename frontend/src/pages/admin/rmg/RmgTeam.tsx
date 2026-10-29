import { motion } from 'motion/react'
import { ArrowRightLeft, ChevronLeft, ChevronRight, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../../../components/ui/Badge'
import { useQuery } from '../../../hooks/useQuery'
import type { RmgTeamMember } from '../../../services/admin/rmg.service'
import { initialsOf } from '../../../utils/format'
import { avatarGradient } from '../employees/employeeUi'
import WorkforceBar from './WorkforceBar'
import { WORKFORCE_SEGMENTS, segmentOf } from './rmgUi'

/** How many people the team list shows per page. */
const PAGE_SIZE = 5

const pager =
  'flex h-8 w-8 items-center justify-center rounded-lg text-ink-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-white/10'

/**
 * The active associates reporting to an RMG: where they are (the legend doubles as a filter) and a few at a time, each
 * with a shortcut to move them to another RMG. Each page / filter combination is kept in the Redux store.
 */
export default function RmgTeam({ rmgId, onMove }: { rmgId: string; onMove: (m: RmgTeamMember) => void }) {
  const [workforce, setWorkforce] = useState('')
  const [page, setPage] = useState(0)
  const { data, loading, error } = useQuery('rmgTeam', { rmgId, workforce: workforce || undefined, page, size: PAGE_SIZE })

  const total = data?.totalElements ?? 0
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1
  const to = Math.min(total, (page + 1) * PAGE_SIZE)

  function pick(key: string) {
    setWorkforce((w) => (w === key ? '' : key))
    setPage(0)
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-white/6 dark:bg-white/2">
      <h3 className="mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-ink-500 uppercase dark:text-slate-500">
        <UsersRound className="h-3.5 w-3.5" />
        Associates{data ? ` · ${data.teamSize}` : ''}
      </h3>

      {data && data.teamSize > 0 && (
        <div className="mb-3 space-y-2.5">
          <WorkforceBar split={data.workforce} total={data.teamSize} height="h-2" />
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by where they are">
            {WORKFORCE_SEGMENTS.map((s) => {
              const count = data.workforce[s.key] ?? 0
              const on = workforce === s.key
              return (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={on}
                  disabled={count === 0 && !on}
                  onClick={() => pick(s.key)}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    on
                      ? 'border-ink-900 bg-ink-900 text-white dark:border-white dark:bg-white dark:text-ink-900'
                      : 'border-slate-200 bg-white text-ink-700 hover:border-slate-300 dark:border-white/10 dark:bg-white/4 dark:text-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.label}
                  <span className="font-semibold tabular-nums">{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {data === null && !error ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-200/80 dark:bg-white/8" />
          ))}
        </div>
      ) : error && data === null ? (
        <p className="text-sm text-ink-500 dark:text-slate-400">Couldn’t load the associates.</p>
      ) : total === 0 ? (
        <p className="text-sm text-ink-500 dark:text-slate-400">
          {workforce ? `Nobody reporting to this RMG is ${segmentOf(workforce).label.toLowerCase()}.` : 'Nobody reports to this RMG yet.'}
        </p>
      ) : (
        <>
          <ul className={`space-y-2 transition-opacity ${loading ? 'opacity-60' : ''}`}>
            {data!.content.map((m, i) => {
              const seg = segmentOf(m.workforce)
              return (
                <motion.li
                  key={m.employeeId}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-2 dark:border-white/8 dark:bg-white/3"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br ${avatarGradient(m.id)} text-[11px] font-bold text-white`}
                  >
                    {initialsOf(m.firstName, m.lastName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900 dark:text-white">
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="truncate text-xs text-ink-500 dark:text-slate-400">
                      {m.employeeId}
                      {m.designation ? ` · ${m.designation}` : ''}
                      {m.grade ? ` · ${m.grade}` : ''}
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex">
                    <Badge tone={seg.tone}>{seg.label}</Badge>
                  </span>
                  <button
                    type="button"
                    aria-label={`Move ${m.firstName} ${m.lastName} to another RMG`}
                    title="Move to another RMG"
                    onClick={() => onMove(m)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-slate-100 hover:text-ink-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                  </button>
                </motion.li>
              )
            })}
          </ul>

          {data!.totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between text-xs text-ink-500 dark:text-slate-400">
              <span>
                <span className="font-semibold text-ink-900 dark:text-white">
                  {from}–{to}
                </span>{' '}
                of <span className="font-semibold text-ink-900 dark:text-white">{total}</span>
              </span>
              <div className="flex items-center gap-1">
                <button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className={pager}>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-1 tabular-nums">
                  {page + 1} / {data!.totalPages}
                </span>
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={page >= data!.totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className={pager}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
