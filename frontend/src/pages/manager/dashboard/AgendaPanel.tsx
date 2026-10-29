import { CheckCircle2, Clock } from 'lucide-react'
import { Panel, PanelError, Skeleton } from '../../../components/dashboard/Panel'
import type { AsyncResult } from '../../../hooks/useAsyncData'
import type { InterviewDTO } from '../../../services/interview.service'
import type { ManagerDashboardDTO } from '../../../services/manager/dashboard.service'
import { parseServerDate } from '../../../utils/format'
import ManagerLink from '../ManagerLink'
import { interviewTone, isoDay, timeOf } from '../managerUi'

interface Ask {
  title: string
  detail: string
  to: string
}

/** What is waiting on the manager, from the dashboard and their interviews. Most urgent first. */
function asksFor(d: ManagerDashboardDTO, interviews: InterviewDTO[], now: Date): Ask[] {
  const asks: Ask[] = []
  const needFeedback = interviews.filter((i) => interviewTone(i, now) === 'need')
  for (const i of needFeedback.slice(0, 2)) {
    asks.push({
      title: `Add feedback for ${i.employeeName ?? i.employeeId}`,
      detail: [i.requirementId, i.roundNumber ? `Round ${i.roundNumber}` : null].filter(Boolean).join(' · '),
      to: `/manager/interviews/${i.interviewId}/feedback`,
    })
  }
  if (d.pendingDecisions > 0) {
    asks.push({
      title: `${d.pendingDecisions} candidate${d.pendingDecisions === 1 ? '' : 's'} waiting for your decision`,
      detail: 'Interviews are done',
      to: '/manager/requirements',
    })
  }
  for (const r of d.openRequirements.filter((r) => r.status === 'PUBLISHED' && r.interviewers.length === 0).slice(0, 2)) {
    asks.push({ title: `Assign an interviewer to ${r.requirementId}`, detail: r.positionTitle, to: `/manager/requirements/${r.requirementId}#responsibilities` })
  }
  for (const r of d.openRequirements.filter((r) => r.status === 'ON_HOLD').slice(0, 1)) {
    asks.push({ title: `Resume or close ${r.requirementId}`, detail: `${r.positionTitle} is on hold`, to: `/manager/requirements/${r.requirementId}` })
  }
  if (d.pendingClaimProjects > 0) {
    asks.push({
      title: `Claim ${d.pendingClaimProjects} project${d.pendingClaimProjects === 1 ? '' : 's'}`,
      detail: 'Assigned to you, not yet claimed',
      to: '/manager/projects',
    })
  }
  return asks.slice(0, 5)
}

/** Today: a timeline of the day's interviews and the things waiting for the manager. */
export default function AgendaPanel({
  dashboard,
  interviews,
  now,
}: {
  dashboard: AsyncResult<ManagerDashboardDTO>
  interviews: AsyncResult<InterviewDTO[]>
  now: Date
}) {
  const today = isoDay(now)
  const failed = dashboard.data === null && dashboard.error ? dashboard : interviews.data === null && interviews.error ? interviews : null
  const error = failed?.error ? { message: failed.error, status: failed.status } : null
  const loading = dashboard.data === null || interviews.data === null
  const todays = (interviews.data ?? [])
    .filter((i) => isoDay(parseServerDate(i.scheduledAt)) === today && i.status !== 'CANCELLED' && i.status !== 'DECLINED')
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  const nextIndex = todays.findIndex((i) => parseServerDate(i.scheduledAt) >= now)
  const asks = dashboard.data && interviews.data ? asksFor(dashboard.data, interviews.data, now) : []

  return (
    <Panel
      title="Today"
      subtitle={now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
      icon={<Clock className="h-4 w-4" />}
      className="h-full"
    >
      {error ? (
        <PanelError message={error.message} status={error.status} onRetry={() => { dashboard.reload(); interviews.reload() }} />
      ) : loading ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="flex h-full flex-col gap-5">
          <div className="grid gap-2.5">
            {todays.length === 0 && <p className="rounded-2xl bg-slate-100/70 px-3.5 py-3 text-sm text-ink-500 dark:bg-white/4 dark:text-slate-400">No interviews today.</p>}
            {todays.map((i, idx) => {
              const next = idx === nextIndex
              return (
                <div key={i.interviewId} className="grid grid-cols-[46px_minmax(0,1fr)] items-stretch gap-2.5">
                  <time className={`pt-3 text-right text-xs font-bold tabular-nums ${next ? 'text-brand-600 dark:text-brand-400' : 'text-ink-500 dark:text-slate-400'}`}>{timeOf(i.scheduledAt)}</time>
                  <ManagerLink
                    to={interviewTone(i, now) === 'need' ? `/manager/interviews/${i.interviewId}/feedback` : `/manager/interviews/${i.interviewId}`}
                    className={`block rounded-2xl border px-3 py-2.5 text-sm ${
                      next ? 'border-brand-500/40 bg-brand-500/8' : 'border-slate-200/80 bg-slate-50/60 dark:border-white/6 dark:bg-white/2'
                    }`}
                  >
                    <b className="block truncate font-semibold text-ink-900 dark:text-white">{i.employeeName ?? i.employeeId}</b>
                    <small className="block truncate text-xs text-ink-500 dark:text-slate-400">
                      {[i.requirementId, i.roundNumber ? `Round ${i.roundNumber}` : null, next ? 'Up next' : null].filter(Boolean).join(' · ')}
                    </small>
                  </ManagerLink>
                </div>
              )
            })}
          </div>

          <div className="mt-auto border-t border-slate-100 pt-4 dark:border-white/6">
            <p className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-500">Needs you</p>
            {asks.length === 0 ? (
              <p className="flex items-center gap-2 rounded-xl bg-brand-500/8 px-3 py-2.5 text-sm text-brand-700 dark:text-brand-300">
                <CheckCircle2 className="h-4 w-4" /> Nothing is waiting on you.
              </p>
            ) : (
              <ul className="grid gap-2">
                {asks.map((a) => (
                  <li key={a.title}>
                    <ManagerLink
                      to={a.to}
                      className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/6 px-3 py-2"
                      hoverClassName="hover:border-amber-500/50 hover:bg-amber-500/10"
                    >
                      <span className="min-w-0">
                        <b className="block truncate text-[13px] font-semibold text-ink-900 dark:text-white">{a.title}</b>
                        <small className="block truncate text-xs text-ink-500 dark:text-slate-400">{a.detail}</small>
                      </span>
                    </ManagerLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Panel>
  )
}
