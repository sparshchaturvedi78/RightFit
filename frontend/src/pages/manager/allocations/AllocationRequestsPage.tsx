import { motion } from 'motion/react'
import { ClipboardCheck } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../../components/dashboard/Panel'
import { Drawer } from '../../../components/ui/Overlay'
import { Button } from '../../../components/ui/form'
import RefreshButton from '../../../components/ui/RefreshButton'
import { useQuery } from '../../../hooks/useQuery'
import { useToast } from '../../../hooks/useToast'
import { allocationService, type AllocationRequestDTO } from '../../../services/allocation.service'
import { getApiErrorMessage } from '../../../services/httpClient'
import { useAppDispatch } from '../../../store'
import { invalidateQueries } from '../../../store/queriesSlice'
import { humanize, parseServerDate } from '../../../utils/format'
import ManagerLink from '../ManagerLink'

/**
 * Each request sits in one stage. The RMG has no separate "reviewing" state in the data, so a request is either
 * waiting for them (sent) or decided. Approved requests move to Started once their start date has passed.
 */
type Stage = 'sent' | 'approved' | 'started' | 'closed'

const STAGES: { key: Stage; label: string; hint: string; line: string }[] = [
  { key: 'sent', label: 'Sent to RMG', hint: 'Waiting for RMG to decide', line: 'border-slate-400' },
  { key: 'approved', label: 'Approved', hint: 'Starts on the date shown', line: 'border-emerald-500' },
  { key: 'started', label: 'Started', hint: 'Running on a project now', line: 'border-ink-700' },
  { key: 'closed', label: 'Rejected or cancelled', hint: 'Kept in the history', line: 'border-slate-300' },
]

function stageOf(r: AllocationRequestDTO, now: Date): Stage {
  if (r.status === 'SUBMITTED') return 'sent'
  if (r.status === 'APPROVED') return parseServerDate(r.requestedStartDate) <= now ? 'started' : 'approved'
  return 'closed'
}

/** Booked and asked hours against the working day. `over` means the request would push them past it. */
function capacity(r: AllocationRequestDTO) {
  const day = r.employeeWorkingHoursPerDay ?? 0
  const booked = r.employeeAllocatedHoursPerDay ?? 0
  const asked = r.requestedHoursPerDay ?? 0
  const total = Math.max(day, booked + asked, 1)
  return { day, booked, asked, total, over: day > 0 && booked + asked > day, overBy: Math.max(0, booked + asked - day) }
}

function pct(part: number, total: number): string {
  return `${Math.min(100, (part / total) * 100)}%`
}

function dayLabel(value: string): string {
  return parseServerDate(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export default function AllocationRequestsPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { requestId } = useParams()
  const list = useQuery('managerAllocations', {})
  const [now] = useState(() => new Date())
  const [project, setProject] = useState<string>('')
  const [overOnly, setOverOnly] = useState(false)
  const [query, setQuery] = useState('')

  const all = useMemo(() => list.data ?? [], [list.data])
  const projects = useMemo(() => [...new Set(all.map((r) => r.projectName))].sort(), [all])
  const text = query.trim().toLowerCase()

  const shown = all.filter(
    (r) =>
      (!project || r.projectName === project) &&
      (!overOnly || capacity(r).over) &&
      (!text || [r.employeeName, r.requirementId, r.requestId, r.projectName].some((v) => v?.toLowerCase().includes(text))),
  )

  const columns = STAGES.map((s) => ({ ...s, items: shown.filter((r) => stageOf(r, now) === s.key) }))
  const selected = requestId ? all.find((r) => r.requestId === requestId) : undefined

  function close() {
    navigate('/manager/allocation-requests')
  }

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-ink-500 uppercase dark:text-slate-400">Hiring</p>
          <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">Allocation requests</h1>
          <p className="mt-1 max-w-[62ch] text-sm text-ink-500 dark:text-slate-400">
            Each request moves left to right: sent to RMG, approved, then started on the project.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex w-64 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Person, requirement or ID"
              aria-label="Search allocation requests"
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-ink-500/60 dark:placeholder:text-slate-500"
            />
          </label>
          <RefreshButton onClick={list.refresh} loading={list.loading} />
        </div>
      </motion.header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Project">
          <Chip pressed={project === ''} onClick={() => setProject('')}>
            All projects
          </Chip>
          {projects.map((p) => (
            <Chip key={p} pressed={project === p} onClick={() => setProject(p)}>
              {p}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show only">
          <Chip pressed={overOnly} onClick={() => setOverOnly((v) => !v)}>
            Over capacity
          </Chip>
        </div>
      </div>

      {list.error && !list.data ? (
        <PanelError message={list.error} status={list.status} onRetry={list.refresh} />
      ) : !list.data ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : all.length === 0 ? (
        <div className={`${TILE_SURFACE} px-6 py-12`}>
          <EmptyState icon={<ClipboardCheck className="h-5 w-5" />}>
            No allocation requests yet. Send one from a selected candidate on a requirement.
          </EmptyState>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Requests by stage">
          {columns.map((col) => (
            <section key={col.key} className="grid min-w-0 content-start gap-2.5" aria-label={col.label}>
              <div className={`grid gap-0.5 border-b-2 px-0.5 pb-2 ${col.line}`}>
                <b className="flex items-center justify-between text-sm text-ink-900 dark:text-white">
                  {col.label}
                  <span className="rounded-full bg-slate-100 px-2 text-xs font-bold text-ink-500 tabular-nums dark:bg-white/8 dark:text-slate-400">{col.items.length}</span>
                </b>
                <small className="text-xs text-ink-500 dark:text-slate-400">{col.hint}</small>
              </div>
              {col.items.length === 0 && <p className="rounded-2xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-ink-500 dark:border-white/10 dark:text-slate-400">Nothing here</p>}
              {col.items.map((r) => (
                <RequestCard key={r.requestId} request={r} current={r.requestId === requestId} onOpen={() => navigate(`/manager/allocation-requests/${r.requestId}`)} />
              ))}
            </section>
          ))}
        </div>
      )}

      {all.some((r) => r.status === 'REJECTED' || r.status === 'CANCELLED') && (
        <p className="text-xs text-ink-500 dark:text-slate-400">
          Rejected and cancelled requests stay in the history, in the last column.
        </p>
      )}

      {requestId && (
        <Drawer open onClose={close} title={selected ? `${selected.employeeName} → ${selected.projectName}` : requestId} subtitle={selected ? `${selected.requestId} · ${humanize(selected.status)}` : undefined}>
          {selected ? (
            <RequestDetail request={selected} now={now} onChanged={() => dispatch(invalidateQueries('managerAllocations'))} />
          ) : list.data ? (
            <EmptyState icon={<ClipboardCheck className="h-5 w-5" />}>This request is not on your projects.</EmptyState>
          ) : (
            <Skeleton className="h-64 rounded-2xl" />
          )}
        </Drawer>
      )}
    </div>
  )
}

function RequestCard({ request: r, current, onOpen }: { request: AllocationRequestDTO; current: boolean; onOpen: () => void }) {
  const c = capacity(r)
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-current={current ? 'true' : undefined}
      className={`${TILE_SURFACE} grid w-full gap-3 p-4 text-left transition-shadow ${current ? 'ring-2 ring-brand-500' : 'hover:shadow-md'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <b className="block truncate text-sm font-semibold text-ink-900 dark:text-white">{r.employeeName}</b>
          <span className="block truncate text-xs text-ink-500 dark:text-slate-400">
            {r.projectName} · {r.requirementId}
          </span>
        </div>
        <span className="shrink-0 text-[11px] font-bold tracking-wide text-ink-500 dark:text-slate-400">{r.requestId}</span>
      </div>

      <span className="text-xs text-ink-700 dark:text-slate-300">
        From {dayLabel(r.requestedStartDate)}
        {r.requestedEndDate ? ` to ${dayLabel(r.requestedEndDate)}` : ' · open ended'} · {r.requestedHoursPerDay} h a day
      </span>

      {c.day > 0 && (
        <div className="grid gap-1" role="img" aria-label={`${c.booked} hours booked, ${c.asked} asked, ${c.day} hour working day`}>
          <div className="flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/8">
            <i className="block h-full bg-slate-500" style={{ width: pct(c.booked, c.total) }} />
            <i className="block h-full bg-sky-500" style={{ width: pct(c.asked, c.total) }} />
            {c.over && <i className="block h-full bg-amber-500" style={{ width: pct(c.overBy, c.total) }} />}
          </div>
          <small className="text-[11px] text-ink-500 tabular-nums dark:text-slate-400">
            {c.booked} booked + {c.asked} asked of {c.day} h
          </small>
          {c.over && <span className="w-fit rounded-full bg-amber-500/14 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">Over by {c.overBy} h</span>}
        </div>
      )}
    </button>
  )
}

function RequestDetail({ request: r, now, onChanged }: { request: AllocationRequestDTO; now: Date; onChanged: () => void }) {
  const toast = useToast()
  const [cancelling, setCancelling] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const c = capacity(r)
  const stage = stageOf(r, now)
  const steps = [
    { label: 'Selected', done: true, now: false },
    { label: 'Sent to RMG', done: true, now: stage === 'sent' },
    { label: 'RMG decision', done: stage !== 'sent', now: stage === 'sent' },
    { label: 'Started', done: stage === 'started', now: stage === 'approved' },
  ]

  async function cancel() {
    if (!reason.trim()) {
      setError('Say why, so RMG knows.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await allocationService.managerCancel(r.requestId, reason.trim())
      toast.success('Request cancelled', `${r.employeeName} stays on the requirement as Selected`)
      onChanged()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not cancel. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-1 text-sm text-ink-700 dark:text-slate-300">
        <span>
          <ManagerLink to={`/manager/requirements/${r.requirementId}`} className="font-semibold text-ink-900 dark:text-white" hoverClassName="hover:text-brand-600 dark:hover:text-brand-400">
            {r.requirementId}
          </ManagerLink>{' '}
          · {r.projectName}
        </span>
        <span>
          {r.requestedHoursPerDay} h a day from {dayLabel(r.requestedStartDate)}
          {r.requestedEndDate ? ` to ${dayLabel(r.requestedEndDate)}` : ', open ended'}
        </span>
        <span className="text-xs text-ink-500 dark:text-slate-400">Sent {parseServerDate(r.submittedAt).toLocaleDateString()} by {r.submittedByName}</span>
      </div>

      <ol className="grid grid-cols-4 gap-1" aria-label="Progress">
        {steps.map((s) => (
          <li key={s.label} className="grid gap-1.5 text-[11px] font-bold text-ink-500 dark:text-slate-400">
            <span className={`h-1.5 rounded-full ${s.done ? 'bg-sky-500' : s.now ? 'bg-sky-500/40' : 'bg-slate-200 dark:bg-white/10'}`} />
            <span className={s.done || s.now ? 'text-ink-900 dark:text-white' : ''}>{s.label}</span>
          </li>
        ))}
      </ol>

      <table className="w-full text-sm" aria-label="Capacity on the working day">
        <tbody className="[&_td]:border-b [&_td]:border-slate-100 [&_td]:py-2.5 dark:[&_td]:border-white/6">
          <tr>
            <td className="text-ink-700 dark:text-slate-300">Booked now</td>
            <td className="text-right font-semibold tabular-nums">{c.booked} h</td>
          </tr>
          <tr>
            <td className="text-ink-700 dark:text-slate-300">Asked in this request</td>
            <td className="text-right font-semibold tabular-nums">{c.asked} h</td>
          </tr>
          <tr>
            <td className="text-ink-700 dark:text-slate-300">Working day</td>
            <td className="text-right font-semibold tabular-nums">{c.day} h</td>
          </tr>
          <tr>
            <td className="font-semibold text-ink-900 dark:text-white">{c.over ? 'Over the day by' : 'Still free after approval'}</td>
            <td className={`text-right font-bold tabular-nums ${c.over ? 'text-amber-600 dark:text-amber-400' : ''}`}>{c.over ? `${c.overBy} h` : `${Math.max(0, c.day - c.booked - c.asked)} h`}</td>
          </tr>
        </tbody>
      </table>

      {r.reviewComments && (
        <p className="rounded-2xl bg-sky-500/8 px-3.5 py-2.5 text-sm text-ink-700 dark:text-slate-300">
          RMG: {r.reviewComments}
        </p>
      )}
      {r.rejectionReason && (
        <p className="rounded-2xl bg-rose-500/8 px-3.5 py-2.5 text-sm text-ink-700 dark:text-slate-300">
          Rejected: {r.rejectionReason}
        </p>
      )}

      {r.status === 'SUBMITTED' && (
        <div className="grid gap-3">
          <p className="text-xs text-ink-500 dark:text-slate-400">
            Approval is RMG&apos;s decision. You can cancel while it waits; {r.employeeName} stays on the requirement as Selected.
          </p>
          {cancelling ? (
            <>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-ink-900 dark:text-white">Why cancel?</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
                />
              </label>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setCancelling(false)} disabled={busy}>
                  Keep it
                </Button>
                <Button variant="danger" loading={busy} onClick={() => void cancel()}>
                  Cancel request
                </Button>
              </div>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setCancelling(true)} className="w-fit">
              Cancel request
            </Button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  )
}

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
        pressed
          ? 'border-brand-500/30 bg-brand-500/12 text-brand-700 dark:text-brand-300'
          : 'border-slate-200 text-ink-500 hover:text-ink-900 dark:border-white/10 dark:text-slate-400 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
