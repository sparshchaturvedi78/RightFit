import { Users } from 'lucide-react'
import { AsyncBody, EmptyState, Panel, Skeleton } from '../../../components/dashboard/Panel'
import type { AsyncResult } from '../../../hooks/useAsyncData'
import type { ManagerDashboardDTO, SelectionGroupDTO } from '../../../services/manager/dashboard.service'
import { humanize } from '../../../utils/format'
import ManagerLink from '../ManagerLink'

/** Where a candidate stands in plain words, so the manager can tell who is waiting on whom. */
const STAGE_LABEL: Record<string, { label: string; tone: string }> = {
  IDENTIFIED: { label: 'Identified', tone: 'bg-slate-500/12 text-ink-700 dark:text-slate-300' },
  SHORTLISTED: { label: 'Shortlisted', tone: 'bg-sky-500/12 text-sky-700 dark:text-sky-300' },
  INVITATION_SENT: { label: 'Invited', tone: 'bg-violet-500/12 text-violet-700 dark:text-violet-300' },
  ACCEPTED: { label: 'Accepted, to schedule', tone: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300' },
  INTERVIEW: { label: 'Interview booked', tone: 'bg-amber-500/14 text-amber-700 dark:text-amber-300' },
  INTERVIEW_COMPLETED: { label: 'Interviewed', tone: 'bg-amber-500/14 text-amber-700 dark:text-amber-300' },
  RECOMMENDED: { label: 'Feedback in', tone: 'bg-amber-500/14 text-amber-700 dark:text-amber-300' },
  MANAGER_REVIEW: { label: 'Your decision', tone: 'bg-amber-500 text-white' },
  SELECTED: { label: 'Selected', tone: 'bg-brand-500/14 text-brand-700 dark:text-brand-300' },
  ALLOCATION_REQUESTED: { label: 'With RMG', tone: 'bg-brand-500 text-white' },
  ON_HOLD: { label: 'On hold', tone: 'bg-slate-500/14 text-ink-500 dark:text-slate-400' },
}

/** Everyone still in between, grouped by requirement: the people the manager is moving, and who each one is waiting on. */
export default function SelectionProcessPanel({ state }: { state: AsyncResult<ManagerDashboardDTO>; now: Date }) {
  const total = (groups: SelectionGroupDTO[]) => groups.reduce((n, g) => n + g.people.length, 0)
  return (
    <Panel
      title="Selection process"
      subtitle="Everyone still in between, by requirement"
      icon={<Users className="h-4 w-4" />}
      action={
        state.data && total(state.data.selectionProcess ?? []) > 0 ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-ink-700 tabular-nums dark:bg-white/8 dark:text-slate-300">
            {total(state.data.selectionProcess ?? [])}
          </span>
        ) : undefined
      }
    >
      <AsyncBody
        state={state}
        skeleton={
          <div className="space-y-2.5">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        }
      >
        {(d) =>
          (d.selectionProcess ?? []).length === 0 ? (
            <EmptyState icon={<Users className="h-5 w-5" />}>Nobody is in a selection process right now.</EmptyState>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {(d.selectionProcess ?? []).map((g) => (
                <section key={g.requirementId} className="grid content-start gap-2.5 rounded-2xl border border-slate-200/80 p-3.5 dark:border-white/8">
                  <ManagerLink to={`/manager/requirements/${g.requirementId}`} className="min-w-0" hoverClassName="hover:text-brand-600 dark:hover:text-brand-400">
                    <b className="block truncate text-sm font-semibold text-ink-900 dark:text-white">
                      {g.requirementId} · {g.positionTitle}
                    </b>
                    <small className="block truncate text-xs text-ink-500 dark:text-slate-400">
                      {g.projectName} · {humanize(g.requirementStatus)}
                    </small>
                  </ManagerLink>
                  <ul className="grid gap-1.5">
                    {g.people.map((p) => {
                      const stage = STAGE_LABEL[p.status] ?? { label: humanize(p.status), tone: 'bg-slate-500/12 text-ink-700 dark:text-slate-300' }
                      return (
                        <li key={p.applicationId} className="flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate text-sm text-ink-900 dark:text-white">{p.employeeName}</span>
                          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${stage.tone}`}>{stage.label}</span>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )
        }
      </AsyncBody>
    </Panel>
  )
}
