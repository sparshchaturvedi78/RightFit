import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PanelError, Skeleton, TILE_SURFACE } from '../../components/dashboard/Panel'
import RefreshButton from '../../components/ui/RefreshButton'
import { useQuery } from '../../hooks/useQuery'
import { parseServerDate, humanize } from '../../utils/format'
import { formatDay } from '../admin/employees/employeeUi'
import PageHeader from '../associate/PageHeader'
import { Bar, Card, Due, Row, Strip, Tag, Who } from './rmgUi'

const LAST_WEEK = 7 * 24 * 60 * 60 * 1000

/** The RMG's day: counts, what needs a decision, who has been longest on the bench, and where demand is short. */
export default function RmgDashboardPage() {
  const dashboard = useQuery('rmgDashboard', {})
  const requests = useQuery('rmgAllocationRequests', {})
  const availability = useQuery('rmgAvailability', {})
  const assignments = useQuery('rmgTrainingAssignments', {})
  const bench = useQuery('rmgBench', { benchStatus: '' })
  const rejections = useQuery('rmgRejections', {})

  const [now] = useState(() => Date.now())
  const d = dashboard.data
  const requestList = requests.data ?? []
  const availabilityList = availability.data ?? []
  const interestList = (assignments.data ?? []).filter((a) => a.assignmentStatus === 'REQUESTED')
  const longest = [...(bench.data ?? [])].sort((a, b) => b.daysOnBench - a.daysOnBench).slice(0, 3)
  const recent = (rejections.data ?? [])
    .filter((r) => now - parseServerDate(r.rejectionDate).getTime() <= LAST_WEEK)
    .slice(0, 3)
  const decisions = requestList.length + availabilityList.length + interestList.length

  function refreshAll() {
    dashboard.refresh()
    requests.refresh()
    availability.refresh()
    assignments.refresh()
    bench.refresh()
    rejections.refresh()
  }

  if (dashboard.error && !d) {
    return (
      <div className="mx-auto max-w-350">
        <div className={`${TILE_SURFACE} p-5`}>
          <PanelError message={dashboard.error} status={dashboard.status} onRetry={dashboard.refresh} />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <PageHeader
        eyebrow="RMG · Overview"
        title="Resource overview"
        sub="The pool, the bench and what is waiting for an RMG decision today."
        actions={
          <>
            <RefreshButton onClick={refreshAll} loading={dashboard.loading} />
            <Link to="/rmg/allocation-requests" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
              Review {requestList.length} requests <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
      />

      {!d ? (
        <Skeleton className="h-24 rounded-3xl" />
      ) : (
        <Strip
          cells={[
            { label: 'In resource pool', value: d.poolSize, sub: 'Free to be allocated' },
            { label: 'On bench', value: d.greenBench + d.amberBench + d.redBench, sub: `${d.redBench} over the limit` },
            { label: 'Allocation requests', value: requestList.length, sub: 'Waiting for review' },
            { label: 'Availability checks', value: availabilityList.length, sub: 'Leave and unavailability' },
            { label: 'Skills in shortage', value: d.topSkillShortages.length, sub: 'Demand above supply' },
          ]}
        />
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-5">
        <Card title="Needs your decision" note="Oldest first">
          {decisions === 0 ? (
            <p className="text-sm text-ink-500 dark:text-slate-400">Nothing needs a decision right now.</p>
          ) : (
            <>
              {requestList.map((r) => (
                <Row
                  key={r.requestId}
                  title={<Link to="/rmg/allocation-requests" className="hover:text-brand-600 dark:hover:text-brand-400">Allocation request · {r.employeeName}</Link>}
                  detail={`${r.projectName} · ${r.requirementId} · starts ${formatDay(r.requestedStartDate)}`}
                  aside={<Tag tone="info">Review</Tag>}
                />
              ))}
              {availabilityList.map((a) => (
                <Row
                  key={a.id}
                  title={<Link to="/rmg/availability" className="hover:text-brand-600 dark:hover:text-brand-400">Availability · {a.employeeName ?? a.employeeId}</Link>}
                  detail={[humanize(a.availabilityStatus), a.expectedReturnDate ? `back ${formatDay(a.expectedReturnDate)}` : null].filter(Boolean).join(' · ')}
                  aside={<Due>Verify</Due>}
                />
              ))}
              {interestList.map((a) => (
                <Row
                  key={a.assignmentId}
                  title={<Link to="/rmg/training" className="hover:text-brand-600 dark:hover:text-brand-400">Training interest · {a.employeeName ?? a.employeeId}</Link>}
                  detail={a.programName}
                  aside={<Tag tone="info">Decide</Tag>}
                />
              ))}
            </>
          )}
        </Card>

        <Card title="Longest on bench" note="Days since bench start">
          {longest.length === 0 ? (
            <p className="text-sm text-ink-500 dark:text-slate-400">Nobody is on the bench.</p>
          ) : (
            longest.map((b) => (
              <Row
                key={b.employeeId}
                title={<Who name={b.name} detail={[b.designation, b.departmentName].filter(Boolean).join(' · ')} />}
                aside={<Tag tone={b.benchStatus === 'RED' ? 'info' : 'muted'}>{b.daysOnBench} days</Tag>}
              />
            ))
          )}
          <Link to="/rmg/bench" className="w-fit text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">Open bench tracking</Link>
        </Card>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-5">
        <Card title="Demand against supply" note="Open requirements vs available people">
          {!d ? (
            <Skeleton className="h-32 rounded-2xl" />
          ) : d.topSkillShortages.length === 0 ? (
            <p className="text-sm text-ink-500 dark:text-slate-400">No skill is short right now.</p>
          ) : (
            <div className="grid gap-3.5">
              {d.topSkillShortages.map((s) => {
                const cover = s.demand > 0 ? (s.supply / s.demand) * 100 : 100
                return (
                  <div key={s.skillName} className="grid gap-1.5">
                    <div className="flex justify-between gap-2 text-sm">
                      <b className="font-semibold text-ink-900 dark:text-white">{s.skillName}</b>
                      <span className="text-ink-500 dark:text-slate-400">{s.supply} supply · {s.demand} demand</span>
                    </div>
                    <Bar value={cover} tone={cover < 50 ? 'danger' : 'warn'} />
                  </div>
                )
              })}
            </div>
          )}
          <Link to="/rmg/demand-supply" className="w-fit text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">See all skills</Link>
        </Card>

        <Card title="Recent rejections" note="Last 7 days">
          {recent.length === 0 ? (
            <p className="text-sm text-ink-500 dark:text-slate-400">No rejections in the last week.</p>
          ) : (
            recent.map((r) => (
              <Row
                key={r.rejectionId}
                title={`${r.employeeName ?? r.employeeId} · ${r.requirementId ?? ''}`}
                detail={r.rejectionComment ?? r.reasonName}
                aside={r.reasonCategory ? <Tag>{humanize(r.reasonCategory)}</Tag> : undefined}
              />
            ))
          )}
          <Link to="/rmg/rejections" className="w-fit text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">Open rejections</Link>
        </Card>
      </div>
    </div>
  )
}
