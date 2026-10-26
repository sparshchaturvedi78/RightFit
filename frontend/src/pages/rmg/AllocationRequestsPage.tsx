import { ClipboardList } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../components/dashboard/Panel'
import { Button } from '../../components/ui/form'
import RefreshButton from '../../components/ui/RefreshButton'
import { useQuery } from '../../hooks/useQuery'
import { useToast } from '../../hooks/useToast'
import { allocationService, type AllocationRequestDTO } from '../../services/allocation.service'
import { getApiErrorMessage } from '../../services/httpClient'
import { useAppDispatch } from '../../store'
import { invalidateQueries } from '../../store/queriesSlice'
import { timeAgo } from '../../utils/format'
import { formatDay } from '../admin/employees/employeeUi'
import PageHeader from '../associate/PageHeader'
import { journeyFor } from './journey'
import { Card, Journey, Loading, OpenChevron, Tag, Who } from './rmgUi'

/** Managers ask for a person on a requirement. Check the dates and whether the person is free, then approve or reject. */
export default function AllocationRequestsPage() {
  const list = useQuery('rmgAllocationRequests', {})
  const [picked, setPicked] = useState<string | null>(null)
  const items = list.data ?? []
  const selected = items.find((r) => r.requestId === picked) ?? items[0]

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <PageHeader
        eyebrow="Resource · Allocation requests"
        title="Allocation requests"
        sub="Managers ask for a person on a requirement. Check the dates and whether the person is free, then approve or reject with a reason."
        actions={<RefreshButton onClick={list.refresh} loading={list.loading} />}
      />

      {list.error && !list.data ? (
        <div className={`${TILE_SURFACE} p-5`}>
          <PanelError message={list.error} status={list.status} onRetry={list.refresh} />
        </div>
      ) : !list.data ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : items.length === 0 ? (
        <div className={`${TILE_SURFACE} px-6 py-12`}>
          <EmptyState icon={<ClipboardList className="h-5 w-5" />}>No allocation requests are waiting for review.</EmptyState>
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-5">
          <Card title="Pending" note={`${items.length}`}>
            {items.map((r) => {
              const on = r.requestId === selected?.requestId
              return (
                <button
                  key={r.requestId}
                  type="button"
                  onClick={() => setPicked(r.requestId)}
                  aria-pressed={on}
                  className={`group grid w-full gap-1 rounded-2xl p-3 text-left hover:bg-slate-50 dark:hover:bg-white/3 ${on ? 'shadow-[inset_0_0_0_1.5px_var(--color-brand-500)]' : ''}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <b className="text-sm font-semibold text-ink-900 dark:text-white">{r.requestId} · {r.employeeName}</b>
                    <span className="flex items-center gap-2">
                      <Tag tone="muted">Review</Tag>
                      <OpenChevron />
                    </span>
                  </div>
                  <small className="text-xs text-ink-500 dark:text-slate-400">
                    {r.projectName} · {r.requirementId} · submitted {r.submittedAt ? timeAgo(r.submittedAt) : '—'}
                  </small>
                </button>
              )
            })}
          </Card>

          {selected && <ReviewPanel key={selected.requestId} request={selected} />}
        </div>
      )}
    </div>
  )
}

/** The review for one allocation request: what is asked, when, by whom, and the person's selection so far. */
function ReviewPanel({ request: r }: { request: AllocationRequestDTO }) {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const selections = useQuery('rmgSelections', { employeeId: r.employeeId })
  const selection = selections.data?.find((s) => s.requirementId === r.requirementId) ?? selections.data?.[0]
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)

  function done(message: string) {
    toast.success(message, r.employeeName)
    dispatch(invalidateQueries('rmgAllocationRequests'))
    dispatch(invalidateQueries('rmgDashboard'))
  }

  async function approve() {
    setBusy('approve')
    setError(null)
    try {
      await allocationService.rmgApprove(r.requestId, { comments: comment.trim() || undefined })
      done('Allocation approved')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not approve. Try again.'))
    } finally {
      setBusy(null)
    }
  }

  async function reject() {
    if (!comment.trim()) {
      setError('Add a reason so the manager knows why.')
      return
    }
    setBusy('reject')
    setError(null)
    try {
      await allocationService.rmgReject(r.requestId, { reason: comment.trim() })
      done('Allocation rejected')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not reject. Try again.'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <aside className={`${TILE_SURFACE} grid content-start gap-4 p-5`}>
      <div className="flex items-start justify-between gap-3">
        <Who name={r.employeeName ?? r.employeeId} detail={`${r.requestId} · Submitted by ${r.submittedByName ?? 'a manager'}${r.submittedAt ? ` · ${formatDay(r.submittedAt.slice(0, 10))}` : ''}`} />
        <Tag tone="muted">Pending</Tag>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
        <Fact label="Project">{r.projectName}</Fact>
        <Fact label="Requirement">{r.requirementId}</Fact>
        <Fact label="Requested dates">
          {r.requestedStartDate ? `${formatDay(r.requestedStartDate)} to ${r.requestedEndDate ? formatDay(r.requestedEndDate) : 'open ended'}` : '—'}
        </Fact>
        <Fact label="Submitted by">{r.submittedByName}</Fact>
      </dl>

      <Card title="Selection journey" action={selections.loading ? <Loading /> : selection ? <span className="text-xs text-ink-500 dark:text-slate-400">{selection.requirementId}</span> : undefined}>
        {!selections.data ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : !selection ? (
          <p className="text-sm text-ink-500 dark:text-slate-400">No selection history for this person yet.</p>
        ) : (
          <Journey steps={journeyFor(selection)} />
        )}
      </Card>

      <label className="grid gap-1.5 text-sm">
        <span className="font-semibold text-ink-900 dark:text-white">Comment for the manager (required when rejecting)</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
      </label>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="danger" onClick={() => void reject()} loading={busy === 'reject'} disabled={busy !== null && busy !== 'reject'}>
          Reject
        </Button>
        <Button variant="primary" onClick={() => void approve()} loading={busy === 'approve'} disabled={busy !== null && busy !== 'approve'}>
          Approve allocation
        </Button>
      </div>
    </aside>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold tracking-widest text-ink-500 uppercase dark:text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-semibold text-ink-900 dark:text-white">{children || '—'}</dd>
    </div>
  )
}
