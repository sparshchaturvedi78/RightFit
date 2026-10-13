import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../../../components/ui/Badge'
import { Dropdown } from '../../../components/ui/Dropdown'
import { useQuery } from '../../../hooks/useQuery'
import { initialsOf } from '../../../utils/format'
import { avatarGradient, formatDay } from '../employees/employeeUi'

/** How many people the team list shows per page. */
const PAGE_SIZE = 5

const pager =
  'flex h-8 w-8 items-center justify-center rounded-lg text-ink-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-white/10'

/**
 * Everyone on a project: its manager, team members and people with an active allocation. A few at a time, with a
 * grade filter. Each page / grade combination is kept in the Redux store, so going back is instant.
 */
export default function ProjectTeam({ projectId }: { projectId: string }) {
  const [grade, setGrade] = useState('')
  const [page, setPage] = useState(0)
  const { data, loading, error } = useQuery('projectTeam', { projectId, grade: grade || undefined, page, size: PAGE_SIZE })

  const total = data?.totalElements ?? 0
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1
  const to = Math.min(total, (page + 1) * PAGE_SIZE)
  const grades = data?.grades ?? []

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-white/6 dark:bg-white/2">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-ink-500 uppercase dark:text-slate-500">
          <UsersRound className="h-3.5 w-3.5" />
          Team{data ? ` · ${data.teamSize}` : ''}
        </h3>
        {grades.length > 1 && (
          <div className="w-36">
            <Dropdown
              size="sm"
              ariaLabel="Grade"
              value={grade}
              onChange={(g) => {
                setGrade(g)
                setPage(0)
              }}
              options={[{ value: '', label: 'All grades' }, ...grades.map((g) => ({ value: g, label: `Grade ${g}` }))]}
            />
          </div>
        )}
      </div>

      {data === null && !error ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-200/80 dark:bg-white/8" />
          ))}
        </div>
      ) : error && data === null ? (
        <p className="text-sm text-ink-500 dark:text-slate-400">Couldn’t load the team.</p>
      ) : total === 0 ? (
        <p className="text-sm text-ink-500 dark:text-slate-400">
          {grade ? `Nobody on this project has grade ${grade}.` : 'Nobody is on this project yet.'}
        </p>
      ) : (
        <>
          <ul className={`space-y-2 transition-opacity ${loading ? 'opacity-60' : ''}`}>
            {data!.content.map((m, i) => (
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
                  {initialsOf(m.name.split(' ')[0], m.name.split(' ').slice(1).join(' '))}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-900 dark:text-white">
                    {m.name}
                    {m.employmentStatus !== 'ACTIVE' && (
                      <span className="ml-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400">inactive</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-ink-500 dark:text-slate-400">
                    {m.employeeId}
                    {m.role && !m.manager ? ` · ${m.role}` : ''}
                    {m.hoursPerDay != null ? ` · ${m.hoursPerDay} h/day` : ''}
                    {m.since ? ` · since ${formatDay(m.since)}` : ''}
                  </p>
                </div>
                {m.manager && <Badge tone="sky">Manager</Badge>}
                {m.grade && <Badge tone="slate">{m.grade}</Badge>}
              </motion.li>
            ))}
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
                <button type="button" aria-label="Previous team page" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className={pager}>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-1 tabular-nums">
                  {page + 1} / {data!.totalPages}
                </span>
                <button
                  type="button"
                  aria-label="Next team page"
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
