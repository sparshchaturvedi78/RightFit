import { ArrowRight, ClipboardList } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../components/dashboard/Panel'
import RefreshButton from '../../components/ui/RefreshButton'
import { useQuery } from '../../hooks/useQuery'
import type { DutyDTO } from '../../services/associate/work.service'
import { humanize, parseServerDate } from '../../utils/format'
import { formatDay } from '../admin/employees/employeeUi'
import { useAssociateState } from './associateState'
import PageHeader from './PageHeader'
import { Card, Due, Row } from './ui'

const OPEN_INVITE = ['SENT', 'VIEWED']

function Strip({ cells }: { cells: { label: string; value: string }[] }) {
  return (
    <div className={`${TILE_SURFACE} grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-white/6`}>
      {cells.map((c) => (
        <div key={c.label} className="grid gap-1 px-5 py-3.5">
          <span className="text-xs text-ink-500 dark:text-slate-400">{c.label}</span>
          <b className="text-[15px] font-semibold text-ink-900 dark:text-white">{c.value}</b>
        </div>
      ))}
    </div>
  )
}

function today(): string {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
}

/** One dashboard, two situations: on a project (allocated) or in the pool. Hiring duties show in both when held. */
export default function AssociateDashboardPage() {
  const { dashboard, duties, allocated, ready } = useAssociateState()
  const refresh = () => {
    dashboard.refresh()
    duties.refresh()
  }

  if (dashboard.error && !dashboard.data) {
    return (
      <div className="mx-auto max-w-350">
        <div className={`${TILE_SURFACE} p-5`}>
          <PanelError message={dashboard.error} status={dashboard.status} onRetry={dashboard.refresh} />
        </div>
      </div>
    )
  }
  if (!ready) {
    return (
      <div className="mx-auto grid max-w-350 gap-4">
        <Skeleton className="h-16 w-96 rounded-2xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    )
  }
  return allocated ? <AllocatedView onRefresh={refresh} duties={duties.data ?? []} /> : <PoolView onRefresh={refresh} />
}

function AllocatedView({ onRefresh, duties }: { onRefresh: () => void; duties: DutyDTO[] }) {
  const projects = useQuery('associateProjects', {})
  const history = useQuery('associateOpportunities', {})
  const p = projects.data?.[0]
  const day = p?.myWorkingHoursPerDay ?? 0
  const hours = p?.myHoursPerDay ?? 0
  const since = p?.myStartDate ? parseServerDate(p.myStartDate) : null
  const closed = (history.data ?? []).filter(
    (o) => o.status === 'WITHDRAWN' && since && o.updatedAt && parseServerDate(o.updatedAt) >= since,
  )

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <PageHeader
        eyebrow={today()}
        title={p ? `You are on ${p.projectName}` : 'You are on a project'}
        sub="Your interviews and invitations were closed when RMG allocated you."
        actions={<RefreshButton onClick={() => { onRefresh(); projects.refresh(); history.refresh() }} loading={projects.loading} />}
      />

      {p && (
        <Strip
          cells={[
            { label: 'On the project', value: p.myStartDate ? `Since ${formatDay(p.myStartDate)}` : 'Since the start' },
            { label: 'Manager', value: p.managerName ?? '—' },
            { label: 'Hours', value: day ? `${hours} of ${day} h a day` : `${hours} h a day` },
          ]}
        />
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-5">
        <div className="grid gap-4 lg:gap-5">
          <Card title={projects.data && projects.data.length > 1 ? 'Your projects' : 'Your project'} action={<Link to="/associate/team" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">See my team</Link>}>
            {!projects.data ? (
              <Skeleton className="h-24 rounded-2xl" />
            ) : projects.data.length === 0 ? (
              <EmptyState icon={<ClipboardList className="h-5 w-5" />}>Your project details will show here.</EmptyState>
            ) : (
              projects.data.map((x) => {
                const pct = x.myWorkingHoursPerDay ? Math.min(100, ((x.myHoursPerDay ?? 0) / x.myWorkingHoursPerDay) * 100) : 0
                return (
                  <div key={x.projectId} className="grid gap-2 rounded-2xl bg-slate-50 p-4 dark:bg-white/4">
                    <b className="text-base font-semibold text-ink-900 dark:text-white">{x.projectName}</b>
                    <small className="text-xs text-ink-500 dark:text-slate-400">
                      {[x.myRole ? humanize(x.myRole) : null, x.clientName, `${x.team.length} people`, x.myStartDate ? `since ${formatDay(x.myStartDate)}` : null].filter(Boolean).join(' · ')}
                    </small>
                    {x.myWorkingHoursPerDay ? (
                      <div className="grid gap-1" role="img" aria-label={`${x.myHoursPerDay} of ${x.myWorkingHoursPerDay} hours a day`}>
                        <span className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                          <i className="block h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                        </span>
                        <small className="text-xs text-ink-500 dark:text-slate-400">
                          {x.myHoursPerDay} of {x.myWorkingHoursPerDay} h a day · {Math.max(0, x.myWorkingHoursPerDay - (x.myHoursPerDay ?? 0))} h free
                        </small>
                      </div>
                    ) : null}
                  </div>
                )
              })
            )}
          </Card>
          <DutiesCard duties={duties} />
        </div>

        <Card title="Closed when you were allocated" note={since ? formatDay(p?.myStartDate) : undefined}>
          {closed.length === 0 ? (
            <p className="text-sm text-ink-500 dark:text-slate-400">Nothing else was open when you were allocated.</p>
          ) : (
            closed.map((o) => (
              <Row
                key={o.applicationId}
                title={`${o.requirementId ?? ''} · ${o.positionTitle ?? ''}`}
                detail={`${o.projectName ?? ''} · closed, its manager was told`}
                aside={<span className="rounded-full bg-amber-500/14 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">Closed</span>}
              />
            ))
          )}
        </Card>
      </div>
    </div>
  )
}

function PoolView({ onRefresh }: { onRefresh: () => void }) {
  const invitations = useQuery('associateInvitations', {})
  const opportunities = useQuery('associateOpportunities', {})
  const interviews = useQuery('associateInterviews', {})
  const requirements = useQuery('associateRequirements', {})
  const training = useQuery('associateTrainingAssignments', {})
  const [now] = useState(() => new Date())

  const pendingInvites = (invitations.data ?? []).filter((i) => OPEN_INVITE.includes(i.status))
  const toConfirm = (opportunities.data ?? []).filter((o) => o.status === 'SELECTED' && !o.confirmed)
  const toAnswer = (interviews.data ?? []).filter((i) => i.status === 'SCHEDULED' && parseServerDate(i.scheduledAt) >= now)
  const upcoming = (interviews.data ?? []).filter((i) => i.status === 'ACCEPTED' && parseServerDate(i.scheduledAt) >= now)
  const openReqs = (requirements.data ?? []).filter((r) => !r.myStatus)
  const myTraining = (training.data ?? []).filter((t) => ['REQUESTED', 'ASSIGNED', 'IN_PROGRESS'].includes(t.assignmentStatus))
  const first = pendingInvites[0]

  function refreshAll() {
    onRefresh()
    invitations.refresh()
    opportunities.refresh()
    interviews.refresh()
    requirements.refresh()
    training.refresh()
  }

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <PageHeader
        eyebrow={today()}
        title={first ? 'Reply to your invitation' : 'You are in the resource pool'}
        sub={
          first
            ? `${first.invitedByName ?? 'A manager'} invited you to ${first.requirementId}${first.responseDeadline ? `. Reply by ${formatDay(first.responseDeadline)}` : ''}.`
            : 'Apply to open requirements, answer invitations and keep your profile up to date.'
        }
        actions={
          <>
            {first && (
              <Link to="/associate/invitations" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
                Open invitation <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <RefreshButton onClick={refreshAll} loading={invitations.loading} />
          </>
        }
      />

      <Strip
        cells={[
          { label: 'Invitations waiting', value: String(pendingInvites.length) },
          { label: 'Open requirements', value: String(openReqs.length) },
          { label: 'Training', value: myTraining.length ? `${myTraining.length} active` : 'None' },
        ]}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-5">
        <div className="grid gap-4 lg:gap-5">
          <Card title="Waiting on you" note={`${pendingInvites.length + toConfirm.length + toAnswer.length} items`}>
            {pendingInvites.length + toConfirm.length + toAnswer.length === 0 ? (
              <p className="text-sm text-ink-500 dark:text-slate-400">Nothing is waiting on you.</p>
            ) : (
              <>
                {pendingInvites.map((i) => (
                  <Row
                    key={i.invitationId}
                    title={<Link to="/associate/invitations" className="hover:text-brand-600 dark:hover:text-brand-400">Invitation for {i.requirementId}</Link>}
                    detail={`From ${i.invitedByName ?? 'a manager'}`}
                    aside={i.responseDeadline ? <Due>Reply by {formatDay(i.responseDeadline)}</Due> : undefined}
                  />
                ))}
                {toConfirm.map((o) => (
                  <Row
                    key={o.applicationId}
                    title={<Link to="/associate/invitations" className="hover:text-brand-600 dark:hover:text-brand-400">Confirm {o.projectName ?? o.requirementId}</Link>}
                    detail={`${o.positionTitle ?? ''} · you were selected`}
                    aside={<Due>Confirm</Due>}
                  />
                ))}
                {toAnswer.map((i) => (
                  <Row
                    key={i.interviewId}
                    title={<Link to="/associate/interviews" className="hover:text-brand-600 dark:hover:text-brand-400">Interview for {i.requirementId}</Link>}
                    detail={`${i.interviewerName ?? ''} · ${parseServerDate(i.scheduledAt).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                    aside={<Due>Accept or decline</Due>}
                  />
                ))}
              </>
            )}
          </Card>

          <Card title="Open requirements" action={<Link to="/associate/projects" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">See all</Link>}>
            {!requirements.data ? (
              <Skeleton className="h-20 rounded-2xl" />
            ) : openReqs.length === 0 ? (
              <p className="text-sm text-ink-500 dark:text-slate-400">No open requirements right now.</p>
            ) : (
              openReqs.slice(0, 3).map((r) => (
                <Row key={r.requirementId} title={`${r.requirementId} · ${r.positionTitle}`} detail={`${r.projectName}${r.allocationStartDate ? ` · from ${formatDay(r.allocationStartDate)}` : ''}`} />
              ))
            )}
          </Card>
        </div>

        <div className="grid gap-4 lg:gap-5">
          <Card title="Upcoming interviews" note={upcoming.length ? `${upcoming.length}` : undefined}>
            {upcoming.length === 0 ? (
              <p className="text-sm text-ink-500 dark:text-slate-400">No interviews booked.</p>
            ) : (
              upcoming.map((i) => (
                <Row
                  key={i.interviewId}
                  title={`${i.requirementId} · round ${i.roundNumber ?? 1}`}
                  detail={`${i.interviewerName ?? ''} · ${i.mode ? humanize(i.mode) : ''}${i.locationOrLink ? ` · ${i.locationOrLink}` : ''}`}
                  aside={<span className="text-xs text-ink-500 tabular-nums dark:text-slate-400">{parseServerDate(i.scheduledAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                />
              ))
            )}
          </Card>

          <Card title="Training" action={<Link to="/associate/training" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">Open</Link>}>
            {myTraining.length === 0 ? (
              <p className="text-sm text-ink-500 dark:text-slate-400">No training right now. You can ask to join one from Training.</p>
            ) : (
              myTraining.map((t) => (
                <Row
                  key={t.assignmentId}
                  title={t.programName}
                  detail={t.expectedEndDate ? `Due ${formatDay(t.expectedEndDate)}` : t.assignmentStatus === 'REQUESTED' ? 'Waiting for your RMG' : undefined}
                  aside={<span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-ink-700 dark:bg-white/8 dark:text-slate-300">{t.assignmentStatus === 'REQUESTED' ? 'Requested' : humanize(t.assignmentStatus)}</span>}
                />
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

const DUTY_LABEL: Record<string, string> = { SOURCER: 'Sourcer', COORDINATOR: 'Coordinator', INTERVIEWER: 'Interviewer' }

/** What each hiring responsibility is waiting on, one row per requirement and role. */
function DutiesCard({ duties }: { duties: DutyDTO[] }) {
  if (duties.length === 0) return null
  return (
    <Card title="Hiring duties" note={`${duties.length} assigned`}>
      {duties.map((d) => {
        const todo =
          d.responsibility === 'SOURCER'
            ? d.toShortlist ? `${d.toShortlist} to shortlist` : 'Find people to add'
            : d.responsibility === 'COORDINATOR'
              ? [d.toInvite ? `${d.toInvite} to invite` : null, d.toBook ? `${d.toBook} to book` : null].filter(Boolean).join(' · ') || 'Nothing to arrange'
              : [d.feedbackDue ? `${d.feedbackDue} feedback due` : null, d.upcomingInterviews ? `${d.upcomingInterviews} upcoming` : null].filter(Boolean).join(' · ') || 'No interviews yet'
        const to = d.responsibility === 'INTERVIEWER' ? '/associate/interviews-to-take' : `/associate/duties/${d.requirementId}`
        return (
          <Row
            key={`${d.requirementId}-${d.responsibility}`}
            title={
              <Link to={to} className="hover:text-brand-600 dark:hover:text-brand-400">
                <span className="mr-2 rounded-md bg-sky-500/12 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-sky-700 uppercase dark:text-sky-300">{DUTY_LABEL[d.responsibility]}</span>
                {d.requirementId} · {d.positionTitle}
              </Link>
            }
            detail={`${d.projectName} · ${todo}`}
          />
        )
      })}
    </Card>
  )
}
