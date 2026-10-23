import { ClipboardList } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../../components/dashboard/Panel'
import { Button } from '../../../components/ui/form'
import { Modal } from '../../../components/ui/Overlay'
import RefreshButton from '../../../components/ui/RefreshButton'
import { useQuery } from '../../../hooks/useQuery'
import { useToast } from '../../../hooks/useToast'
import { getApiErrorMessage } from '../../../services/httpClient'
import { managerCandidateService, type CandidateDTO } from '../../../services/manager/candidate.service'
import { managerInvitationService } from '../../../services/manager/invitation.service'
import { useAppDispatch } from '../../../store'
import { invalidateQueries } from '../../../store/queriesSlice'
import { humanize, timeAgo } from '../../../utils/format'
import { STAGES, stageOfStatus } from '../managerUi'
import AllocationRequestDialog from './AllocationRequestDialog'
import DecisionDialog from './DecisionDialog'
import ScheduleInterviewDialog from './ScheduleInterviewDialog'

/** Statuses a candidate can no longer move on from. */
const OUT = 'out'
const TERMINAL = new Set(['ALLOCATED', 'DECLINED', 'REJECTED', 'WITHDRAWN'])

const HOLD = 'hold'
/** Stages where the manager can select or reject: the interviews are done and the feedback is in. */
const DECIDABLE = new Set(['INTERVIEW_COMPLETED', 'RECOMMENDED', 'MANAGER_REVIEW'])
const TABS: { key: string; label: string }[] = [
  ...STAGES.map((s) => ({ key: s.key, label: s.label })),
  { key: HOLD, label: 'On hold' },
  { key: OUT, label: 'Out of process' },
]

/**
 * Everyone in one requirement's pipeline, one stage at a time. The manager can shortlist identified people and
 * withdraw anyone still in the process. Inviting and interviews are separate pages.
 */
/** What the viewer may do. A manager can do everything; a SOURCER only shortlists, a COORDINATOR invites and books. */
export interface CandidateAbilities {
  shortlist: boolean
  invite: boolean
  book: boolean
  decide: boolean
  allocate: boolean
  withdraw: boolean
}

const EVERYTHING: CandidateAbilities = { shortlist: true, invite: true, book: true, decide: true, allocate: true, withdraw: true }

export default function CandidatesPanel({
  requirementId,
  status,
  can = EVERYTHING,
  intro = 'Add people from the employee directory. Move them forward one step at a time.',
}: {
  requirementId: string
  status: string
  can?: CandidateAbilities
  intro?: string
}) {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const list = useQuery('managerCandidates', { requirementId })
  const [tab, setTab] = useState('identified')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [withdrawing, setWithdrawing] = useState<CandidateDTO | null>(null)
  const [inviting, setInviting] = useState<CandidateDTO | null>(null)
  const [scheduling, setScheduling] = useState<CandidateDTO | null>(null)
  const [requesting, setRequesting] = useState<CandidateDTO | null>(null)
  const [deciding, setDeciding] = useState<{ candidate: CandidateDTO; decision: 'SELECT' | 'REJECT' } | null>(null)

  const all = list.data ?? []
  const stageOf = (c: CandidateDTO) => (c.status === 'ON_HOLD' ? HOLD : (stageOfStatus(c.status) ?? OUT))
  const counts = Object.fromEntries(TABS.map((t) => [t.key, all.filter((c) => stageOf(c) === t.key).length]))
  const shown = all.filter((c) => stageOf(c) === tab)

  /** Anyone who moved in or out of a pipeline also changes what the directory should show. */
  function changed() {
    dispatch(invalidateQueries('managerCandidates'))
    dispatch(invalidateQueries('managerRequirementCard'))
    dispatch(invalidateQueries('managerDirectory'))
    dispatch(invalidateQueries('managerAllocations'))
  }

  async function shortlist(c: CandidateDTO) {
    setBusyId(c.applicationId)
    try {
      await managerCandidateService.shortlist(c.applicationId)
      toast.success(`${c.employeeName ?? c.employeeId} shortlisted`, requirementId)
      changed()
    } catch (err) {
      toast.error('Could not shortlist', getApiErrorMessage(err, 'Try again.'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className={`${TILE_SURFACE} grid gap-5 p-6`} aria-label="Candidates in this requirement">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-ink-900 dark:text-white">Candidates</h2>
          <p className="mt-0.5 text-xs text-ink-500 dark:text-slate-400">{intro}</p>
        </div>
        <RefreshButton onClick={list.refresh} loading={list.loading} />
      </div>

      {status === 'DRAFT' ? (
        <EmptyState icon={<ClipboardList className="h-5 w-5" />}>Publish this requirement to start adding candidates.</EmptyState>
      ) : list.error && !list.data ? (
        <PanelError message={list.error} status={list.status} onRetry={list.refresh} />
      ) : !list.data ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : (
        <>
          <div role="tablist" aria-label="Pipeline stages" className="flex gap-1.5 overflow-x-auto pb-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                  tab === t.key
                    ? 'border-brand-500/30 bg-brand-500/12 text-brand-700 dark:text-brand-300'
                    : 'border-slate-200 text-ink-500 hover:text-ink-900 dark:border-white/10 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {t.label}
                <span className="rounded-full bg-slate-100 px-1.5 text-[11px] tabular-nums dark:bg-white/8">{counts[t.key]}</span>
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-ink-500 dark:bg-white/3 dark:text-slate-400">
              Nobody is in this stage yet.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/6">
              {shown.map((c) => (
                <li key={c.applicationId} className="grid gap-3 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-900 dark:text-white">
                      <span className="truncate">{c.employeeName ?? c.employeeId}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-ink-700 dark:bg-white/8 dark:text-slate-300">{humanize(c.status)}</span>
                    </p>
                    <p className="truncate text-xs text-ink-500 dark:text-slate-400">
                      {[c.employeeId, c.designation, c.grade].filter(Boolean).join(' · ')}
                    </p>
                    <p className="truncate text-xs text-ink-500 dark:text-slate-400">
                      {c.identifiedByName ? `Added by ${c.identifiedByName}` : 'Added'}
                      {c.identifiedAt ? ` ${timeAgo(c.identifiedAt)}` : ''}
                      {c.notes ? ` · ${c.notes}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {c.status === 'IDENTIFIED' && can.shortlist && (
                      <Button variant="primary" loading={busyId === c.applicationId} onClick={() => void shortlist(c)}>
                        Shortlist
                      </Button>
                    )}
                    {c.status === 'SHORTLISTED' && can.invite && (
                      <Button variant="primary" onClick={() => setInviting(c)}>
                        Send invite
                      </Button>
                    )}
                    {c.status === 'SELECTED' && can.allocate && (
                      <Button variant="primary" onClick={() => setRequesting(c)}>
                        Request allocation
                      </Button>
                    )}
                    {DECIDABLE.has(c.status) && can.decide && (
                      <>
                        <Button variant="secondary" onClick={() => setDeciding({ candidate: c, decision: 'REJECT' })}>
                          Reject
                        </Button>
                        <Button variant="primary" onClick={() => setDeciding({ candidate: c, decision: 'SELECT' })}>
                          Select
                        </Button>
                      </>
                    )}
                    {c.status === 'ACCEPTED' && can.book && (
                      <Button variant="primary" onClick={() => setScheduling(c)}>
                        Book interview
                      </Button>
                    )}
                    {!TERMINAL.has(c.status) && can.withdraw && (
                      <Button variant="secondary" onClick={() => setWithdrawing(c)}>
                        Withdraw
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {requesting && (
        <AllocationRequestDialog
          candidate={requesting}
          onClose={() => setRequesting(null)}
          onDone={() => {
            setRequesting(null)
            changed()
          }}
        />
      )}

      {deciding && (
        <DecisionDialog
          candidate={deciding.candidate}
          decision={deciding.decision}
          onClose={() => setDeciding(null)}
          onDone={() => {
            setDeciding(null)
            changed()
          }}
        />
      )}

      {scheduling && (
        <ScheduleInterviewDialog
          candidate={scheduling}
          onClose={() => setScheduling(null)}
          onDone={() => {
            setScheduling(null)
            changed()
          }}
        />
      )}

      {inviting && (
        <InviteDialog
          candidate={inviting}
          onClose={() => setInviting(null)}
          onDone={() => {
            setInviting(null)
            changed()
          }}
        />
      )}

      {withdrawing && (
        <WithdrawDialog
          candidate={withdrawing}
          onClose={() => setWithdrawing(null)}
          onDone={() => {
            setWithdrawing(null)
            changed()
          }}
        />
      )}
    </section>
  )
}

/** The invitation the employee answers: an optional note, whether an interview comes first, and an optional answer-by date. */
function InviteDialog({ candidate, onClose, onDone }: { candidate: CandidateDTO; onClose: () => void; onDone: () => void }) {
  const toast = useToast()
  const [message, setMessage] = useState('')
  const [interview, setInterview] = useState(true)
  const [deadline, setDeadline] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const name = candidate.employeeName ?? candidate.employeeId

  async function send() {
    setBusy(true)
    setError(null)
    try {
      await managerInvitationService.send(candidate.applicationId, {
        message: message.trim() || undefined,
        requiresInterview: interview,
        responseDeadline: deadline || undefined,
      })
      toast.success(`Invitation sent to ${name}`, candidate.requirementId)
      onDone()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not send the invitation. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={busy ? () => undefined : onClose}
      title={`Invite ${name}?`}
      subtitle={`For ${candidate.requirementId}. They answer in their own dashboard.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void send()} loading={busy}>
            Send invitation
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={interview} onChange={(e) => setInterview(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-500" />
          <span>
            <span className="font-semibold text-ink-900 dark:text-white">An interview comes first</span>
            <span className="block text-xs text-ink-500 dark:text-slate-400">Untick for direct joining, where the employee can accept without an interview.</span>
          </span>
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-semibold text-ink-900 dark:text-white">Answer by (optional)</span>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-semibold text-ink-900 dark:text-white">Note to the employee (optional)</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="For example, a short note about the role and the team"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
          />
        </label>
        {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    </Modal>
  )
}

function WithdrawDialog({ candidate, onClose, onDone }: { candidate: CandidateDTO; onClose: () => void; onDone: () => void }) {
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const name = candidate.employeeName ?? candidate.employeeId

  async function withdraw() {
    if (!reason.trim()) {
      setError('Say why, so the pipeline history makes sense later.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await managerCandidateService.withdraw(candidate.applicationId, reason.trim())
      toast.success(`${name} withdrawn`, candidate.requirementId)
      onDone()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not withdraw them. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={busy ? () => undefined : onClose}
      title={`Withdraw ${name}?`}
      subtitle={`From ${candidate.requirementId}. Their history stays.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => void withdraw()} loading={busy}>
            Withdraw
          </Button>
        </>
      }
    >
      <label className="grid gap-1.5 text-sm">
        <span className="font-semibold text-ink-900 dark:text-white">Reason</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="For example, accepted another offer"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
      </label>
      {error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </Modal>
  )
}
