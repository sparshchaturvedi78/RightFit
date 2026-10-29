import { GraduationCap } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../components/dashboard/Panel'
import ExpandableText from '../../components/ui/ExpandableText'
import { Button } from '../../components/ui/form'
import RefreshButton from '../../components/ui/RefreshButton'
import { useQuery } from '../../hooks/useQuery'
import { useToast } from '../../hooks/useToast'
import { associateWorkService, type OpenTrainingDTO } from '../../services/associate/work.service'
import { getApiErrorMessage } from '../../services/httpClient'
import { useAppDispatch } from '../../store'
import { invalidateQueries } from '../../store/queriesSlice'
import { humanize } from '../../utils/format'
import { formatDay } from '../admin/employees/employeeUi'
import { useAssociateState } from './associateState'
import PageHeader from './PageHeader'
import { Card, Due, Row, Tag } from './ui'

const ACTIVE = ['ASSIGNED', 'IN_PROGRESS']
/** Statuses where asking again makes sense: never asked, or the last one is over. */
const CAN_ASK = (s?: string) => !s || ['DECLINED', 'CANCELLED', 'COMPLETED', 'DEFERRED'].includes(s)

/** Training for associates in the pool: what RMG assigned, requests waiting on RMG, and courses to ask for. */
export default function TrainingPage() {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const { allocated, dashboard } = useAssociateState()
  const assignments = useQuery('associateTrainingAssignments', {})
  const programs = useQuery('associateTrainings', {})
  const [busy, setBusy] = useState<string | null>(null)

  const mine = assignments.data ?? []
  const active = mine.filter((a) => ACTIVE.includes(a.assignmentStatus))
  const requested = mine.filter((a) => a.assignmentStatus === 'REQUESTED')
  const done = mine.filter((a) => !ACTIVE.includes(a.assignmentStatus) && a.assignmentStatus !== 'REQUESTED')
  const askable = (programs.data ?? []).filter((p) => CAN_ASK(p.myStatus))

  async function ask(p: OpenTrainingDTO) {
    setBusy(p.programId)
    try {
      await associateWorkService.requestTraining(p.programId)
      toast.success('Request sent to your RMG', p.programName)
      dispatch(invalidateQueries('associateTrainings'))
      dispatch(invalidateQueries('associateTrainingAssignments'))
    } catch (err) {
      toast.error('Could not send the request', getApiErrorMessage(err, 'Try again.'))
    } finally {
      setBusy(null)
    }
  }

  function refresh() {
    assignments.refresh()
    programs.refresh()
  }

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <PageHeader
        eyebrow="Learning"
        title="Training"
        sub="RMG assigns training to people in the pool. You can also ask to join a course; your RMG decides."
        actions={<RefreshButton onClick={refresh} loading={assignments.loading} />}
      />

      {dashboard.data && allocated && (
        <p className="rounded-2xl bg-sky-500/8 px-4 py-3 text-sm text-ink-700 dark:text-slate-300">You are on a project. Training is for people in the pool, so new requests open when your allocation ends.</p>
      )}

      {assignments.error && !assignments.data ? (
        <div className={`${TILE_SURFACE} p-5`}>
          <PanelError message={assignments.error} status={assignments.status} onRetry={refresh} />
        </div>
      ) : !assignments.data ? (
        <Skeleton className="h-48 rounded-3xl" />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-5">
          <div className="grid gap-4 lg:gap-5">
            <Card title="Your training" note={`${active.length} active`}>
              {active.length === 0 ? (
                <p className="text-sm text-ink-500 dark:text-slate-400">No training assigned right now.</p>
              ) : (
                active.map((a) => (
                  <Row
                    key={a.assignmentId}
                    title={a.programName}
                    detail={[a.assignedByName ? `Assigned by ${a.assignedByName}` : null, a.startDate ? `from ${formatDay(a.startDate)}` : null].filter(Boolean).join(' · ')}
                    aside={a.expectedEndDate ? <Due>Due {formatDay(a.expectedEndDate)}</Due> : <Tag tone="info">{humanize(a.assignmentStatus)}</Tag>}
                  />
                ))
              )}
            </Card>

            {requested.length > 0 && (
              <Card title="Waiting for your RMG" note={`${requested.length}`}>
                {requested.map((a) => (
                  <Row key={a.assignmentId} title={a.programName} detail="You asked to join. Your RMG will approve or decline." aside={<Tag>Requested</Tag>} />
                ))}
              </Card>
            )}

            {done.length > 0 && (
              <Card title="Earlier" note={`${done.length}`}>
                {done.map((a) => (
                  <div key={a.assignmentId} className="border-b border-slate-100 last:border-b-0 dark:border-white/6">
                    <Row
                      title={a.programName}
                      detail={
                        a.assignmentStatus === 'DECLINED'
                          ? 'Your RMG declined this request'
                          : [a.completionStatus ? humanize(a.completionStatus) : null, a.score != null ? `score ${a.score}` : null, a.actualEndDate ? formatDay(a.actualEndDate) : null].filter(Boolean).join(' · ')
                      }
                      aside={<Tag tone={a.assignmentStatus === 'COMPLETED' ? 'ok' : 'muted'}>{humanize(a.assignmentStatus)}</Tag>}
                    />
                    {a.decisionComment && (
                      <div className="-mt-1.5 pb-2.5 text-xs text-ink-700 dark:text-slate-300">
                        <span className="mb-0.5 block text-[11px] font-bold tracking-widest text-ink-500 uppercase dark:text-slate-500">RMG's reason</span>
                        <ExpandableText text={a.decisionComment} lines={3} />
                      </div>
                    )}
                  </div>
                ))}
              </Card>
            )}
          </div>

          <Card title="Courses you can ask for" note={programs.data ? `${askable.length}` : undefined}>
            {!programs.data ? (
              <Skeleton className="h-32 rounded-2xl" />
            ) : askable.length === 0 ? (
              <EmptyState icon={<GraduationCap className="h-5 w-5" />}>No other courses are open right now.</EmptyState>
            ) : (
              askable.map((p) => (
                <Row
                  key={p.programId}
                  title={p.programName}
                  detail={[p.trainingType ? humanize(p.trainingType) : null, p.provider, p.durationDays ? `${p.durationDays} days` : null].filter(Boolean).join(' · ')}
                  aside={
                    !allocated ? (
                      <Button variant="secondary" loading={busy === p.programId} onClick={() => void ask(p)}>
                        Ask to join
                      </Button>
                    ) : undefined
                  }
                />
              ))
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
