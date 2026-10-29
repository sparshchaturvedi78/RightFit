import { ClipboardList } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../components/dashboard/Panel'
import { Button } from '../../components/ui/form'
import RefreshButton from '../../components/ui/RefreshButton'
import { useQuery } from '../../hooks/useQuery'
import { useToast } from '../../hooks/useToast'
import { getApiErrorMessage } from '../../services/httpClient'
import { rmgAvailabilityService, type EmployeeAvailabilityDTO } from '../../services/rmg/availability.service'
import { useAppDispatch } from '../../store'
import { invalidateQueries } from '../../store/queriesSlice'
import { humanize, timeAgo } from '../../utils/format'
import { formatDay } from '../admin/employees/employeeUi'
import PageHeader from '../associate/PageHeader'
import { Tag, Who } from './rmgUi'

/** Leave and unavailability people have declared. Approving pauses their bench days for those dates. */
export default function AvailabilityPage() {
  const list = useQuery('rmgAvailability', {})
  const [picked, setPicked] = useState<number | null>(null)
  const items = list.data ?? []
  const selected = items.find((a) => a.id === picked) ?? items[0]

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <PageHeader
        eyebrow="Resource · Availability"
        title="Availability checks"
        sub="Leave and unavailability that people have declared. Approving it pauses their bench days for those dates."
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
          <EmptyState icon={<ClipboardList className="h-5 w-5" />}>No availability checks are waiting.</EmptyState>
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-5">
          <div className="grid content-start gap-3.5">
            {items.map((a) => (
              <RequestCard key={a.id} request={a} on={a.id === selected?.id} onPick={() => setPicked(a.id)} />
            ))}
          </div>
          {selected && <DecisionPanel key={selected.id} request={selected} onDone={() => setPicked(null)} />}
        </div>
      )}
    </div>
  )
}

function RequestCard({ request: a, on, onPick }: { request: EmployeeAvailabilityDTO; on: boolean; onPick: () => void }) {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  async function approve() {
    setBusy(true)
    try {
      await rmgAvailabilityService.approve(a.id)
      toast.success('Availability approved', a.employeeName ?? a.employeeId)
      dispatch(invalidateQueries('rmgAvailability'))
      dispatch(invalidateQueries('rmgDashboard'))
    } catch (err) {
      toast.error('Could not approve', getApiErrorMessage(err, 'Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      onClick={onPick}
      className={`${TILE_SURFACE} grid cursor-pointer content-start gap-3 p-5 ${on ? 'shadow-[inset_0_0_0_1.5px_var(--color-brand-500)]' : ''}`}
      aria-label={`Availability for ${a.employeeName ?? a.employeeId}`}
    >
      <div className="flex items-start justify-between gap-3">
        <Who name={a.employeeName ?? a.employeeId} detail={`${a.employeeId} · ${humanize(a.availabilityStatus)}`} />
        <Tag tone="muted">Waiting</Tag>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <Fact label="Return by">{a.expectedReturnDate ? formatDay(a.expectedReturnDate) : 'Not given'}</Fact>
        <Fact label="Declared">{a.createdAt ? timeAgo(a.createdAt) : '—'}</Fact>
      </dl>
      {a.reason && <p className="text-sm text-ink-700 dark:text-slate-300">“{a.reason}”</p>}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={(e) => { e.stopPropagation(); void approve() }} loading={busy}>
          Approve
        </Button>
        <Button
          variant="danger"
          onClick={(e) => {
            e.stopPropagation()
            onPick()
          }}
        >
          Reject…
        </Button>
      </div>
    </section>
  )
}

/** The decision for the selected request: approve, or reject with a reason the employee and manager can read. */
function DecisionPanel({ request: a, onDone }: { request: EmployeeAvailabilityDTO; onDone: () => void }) {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const name = a.employeeName ?? a.employeeId

  async function reject() {
    if (!reason.trim()) {
      setError('Add a reason so the employee knows why.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await rmgAvailabilityService.reject(a.id, reason.trim())
      toast.success('Availability rejected', name)
      dispatch(invalidateQueries('rmgAvailability'))
      dispatch(invalidateQueries('rmgDashboard'))
      onDone()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not reject. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className={`${TILE_SURFACE} grid content-start gap-4 p-5`}>
      <h2 className="text-[15px] font-semibold text-ink-900 dark:text-white">Decision for {name}</h2>
      <p className="rounded-2xl bg-sky-500/10 px-4 py-3 text-sm text-ink-700 dark:text-slate-300">Approving pauses bench days for these dates.</p>
      <label className="grid gap-1.5 text-sm">
        <span className="font-semibold text-ink-900 dark:text-white">Reason (required when rejecting)</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
      </label>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onDone} disabled={busy}>
          Cancel
        </Button>
        <Button variant="danger" onClick={() => void reject()} loading={busy}>
          Reject
        </Button>
        <Button
          variant="primary"
          onClick={async () => {
            setBusy(true)
            try {
              await rmgAvailabilityService.approve(a.id)
              toast.success('Availability approved', name)
              dispatch(invalidateQueries('rmgAvailability'))
              dispatch(invalidateQueries('rmgDashboard'))
              onDone()
            } catch (err) {
              setError(getApiErrorMessage(err, 'Could not approve. Try again.'))
            } finally {
              setBusy(false)
            }
          }}
          loading={busy}
        >
          Approve
        </Button>
      </div>
    </aside>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold tracking-widest text-ink-500 uppercase dark:text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-semibold text-ink-900 dark:text-white">{children}</dd>
    </div>
  )
}
