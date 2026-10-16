import { Gavel } from 'lucide-react'
import { AsyncBody, EmptyState, Panel, Skeleton } from '../../../components/dashboard/Panel'
import type { AsyncResult } from '../../../hooks/useAsyncData'
import type { ManagerDashboardDTO } from '../../../services/manager/dashboard.service'
import { initialsOf, timeAgo } from '../../../utils/format'
import ManagerLink from '../ManagerLink'

/** Candidates who finished their interviews and are waiting for the manager to select or reject. Each opens the candidate. */
export default function DecisionsPanel({ state, now }: { state: AsyncResult<ManagerDashboardDTO>; now: Date }) {
  return (
    <Panel
      title="Waiting for your decision"
      subtitle="Interviews are done; select or reject"
      icon={<Gavel className="h-4 w-4" />}
      action={
        state.data && state.data.pendingDecisions > 0 ? (
          <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white tabular-nums">{state.data.pendingDecisions}</span>
        ) : undefined
      }
    >
      <AsyncBody
        state={state}
        skeleton={
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        }
      >
        {(d) =>
          d.decisionQueue.length === 0 ? (
            <EmptyState icon={<Gavel className="h-5 w-5" />}>No candidates are waiting for a decision.</EmptyState>
          ) : (
            <ul className="-mx-3 grid grid-cols-[minmax(0,1fr)] divide-y divide-slate-100 dark:divide-white/6">
              {d.decisionQueue.map((c) => {
                const [first = '', ...rest] = c.employeeName.split(' ')
                return (
                  <li key={c.applicationId}>
                    <ManagerLink
                      to={`/manager/candidates/${c.applicationId}`}
                      className="flex items-center gap-3.5 rounded-xl border border-transparent px-3 py-3"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand-400 to-emerald-700 text-xs font-bold text-white">
                        {initialsOf(first, rest.join(' '))}
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-sm font-semibold text-ink-900 dark:text-white">{c.employeeName}</b>
                        <small className="block truncate text-xs text-ink-500 dark:text-slate-400">
                          {c.requirementId} · {c.positionTitle} · {c.projectName}
                        </small>
                      </span>
                      {c.waitingSince && (
                        <span className="shrink-0 text-xs text-ink-500 tabular-nums dark:text-slate-400">Waiting {timeAgo(c.waitingSince, now).replace(' ago', '')}</span>
                      )}
                    </ManagerLink>
                  </li>
                )
              })}
            </ul>
          )
        }
      </AsyncBody>
    </Panel>
  )
}
