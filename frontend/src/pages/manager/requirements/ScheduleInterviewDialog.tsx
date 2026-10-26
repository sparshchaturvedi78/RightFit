import axios from 'axios'
import { useEffect, useState } from 'react'
import { Dropdown } from '../../../components/ui/Dropdown'
import { Button } from '../../../components/ui/form'
import { Modal } from '../../../components/ui/Overlay'
import { useToast } from '../../../hooks/useToast'
import { getApiErrorMessage } from '../../../services/httpClient'
import type { CandidateDTO } from '../../../services/manager/candidate.service'
import { interviewService } from '../../../services/interview.service'
import { managerRequirementAssignmentService } from '../../../services/manager/requirementAssignment.service'

const DURATIONS = [30, 45, 60, 90]

/** What the server sends back when the requested time clashes: the clashes, and free times to pick instead. */
interface ClashBody {
  conflicts?: string[]
  suggestions?: string[]
}

function whenLabel(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/**
 * Book an interview for an accepted candidate. The person interviewing is chosen from the requirement's interviewers
 * (or the project manager). If the time clashes with the interviewer's or the candidate's other interviews, the clashes
 * are shown with free times to choose from, instead of a bare error.
 */
export default function ScheduleInterviewDialog({
  candidate,
  onClose,
  onDone,
}: {
  candidate: CandidateDTO
  onClose: () => void
  onDone: () => void
}) {
  const toast = useToast()
  const [when, setWhen] = useState('')
  const [minutes, setMinutes] = useState(60)
  const [mode, setMode] = useState<'ONLINE' | 'IN_PERSON' | 'PHONE'>('ONLINE')
  const [place, setPlace] = useState('')
  const [interviewer, setInterviewer] = useState('')
  const [interviewers, setInterviewers] = useState<{ employeeId: string; name: string }[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clash, setClash] = useState<ClashBody | null>(null)
  const [suggested, setSuggested] = useState<string[] | null>(null)
  const name = candidate.employeeName ?? candidate.employeeId

  // The people with the INTERVIEWER responsibility on this requirement.
  useEffect(() => {
    let live = true
    managerRequirementAssignmentService
      .list(candidate.requirementId, 'INTERVIEWER')
      .then((rows) => {
        if (!live) return
        setInterviewers(rows.map((r) => ({ employeeId: r.employeeId, name: r.employeeName ?? r.employeeId })))
        // When the requirement already names an interviewer, that is who the interview is with unless someone else is picked.
        if (rows.length > 0) setInterviewer((current) => current || rows[0].employeeId)
      })
      .catch(() => {
        if (live) setInterviewers([])
      })
    return () => {
      live = false
    }
  }, [candidate.requirementId])

  // Free times are worked out for the chosen interviewer before one is picked, so a booking does not clash by default.
  useEffect(() => {
    let live = true
    interviewService
      .suggestSlots(candidate.applicationId, minutes, interviewer || undefined)
      .then((slots) => {
        if (live) setSuggested(slots)
      })
      .catch(() => {
        if (live) setSuggested([])
      })
    return () => {
      live = false
    }
  }, [candidate.applicationId, minutes, interviewer])

  async function book() {
    if (!when) {
      setError('Pick a date and time.')
      return
    }
    setBusy(true)
    setError(null)
    setClash(null)
    try {
      await interviewService.schedule(candidate.applicationId, {
        scheduledAt: when,
        durationMinutes: minutes,
        mode,
        locationOrLink: place.trim() || undefined,
        interviewerEmployeeId: interviewer || undefined,
      })
      toast.success(`Interview booked with ${name}`, whenLabel(when))
      onDone()
    } catch (err) {
      const body = axios.isAxiosError(err) ? (err.response?.data as ClashBody | undefined) : undefined
      if (axios.isAxiosError(err) && err.response?.status === 409 && body?.suggestions) {
        setClash(body)
      } else {
        setError(getApiErrorMessage(err, 'Could not book the interview. Try again.'))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={busy ? () => undefined : onClose}
      title={`Book an interview with ${name}`}
      subtitle={`For ${candidate.requirementId}. Two people cannot be booked at the same time.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void book()} loading={busy}>
            Book interview
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <label className="grid gap-1.5 text-sm">
          <span className="font-semibold text-ink-900 dark:text-white">Interviewer</span>
          <Dropdown
            ariaLabel="Interviewer"
            value={interviewer}
            onChange={(v) => {
              setInterviewer(v)
              setClash(null)
            }}
            options={[
              ...interviewers.map((i) => ({ value: i.employeeId, label: i.name })),
              { value: '', label: 'Project manager' },
            ]}
          />
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-semibold text-ink-900 dark:text-white">Date and time</span>
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => {
              setWhen(e.target.value)
              setClash(null)
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-ink-900 dark:text-white">Length</span>
            <Dropdown
              ariaLabel="Length"
              value={String(minutes)}
              onChange={(v) => setMinutes(Number(v))}
              options={DURATIONS.map((d) => ({ value: String(d), label: `${d} minutes` }))}
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-ink-900 dark:text-white">Mode</span>
            <Dropdown
              ariaLabel="Mode"
              value={mode}
              onChange={(v) => setMode(v as typeof mode)}
              options={[
                { value: 'ONLINE', label: 'Online' },
                { value: 'IN_PERSON', label: 'In person' },
                { value: 'PHONE', label: 'Phone' },
              ]}
            />
          </label>
        </div>
        <label className="grid gap-1.5 text-sm">
          <span className="font-semibold text-ink-900 dark:text-white">{mode === 'IN_PERSON' ? 'Room' : 'Meeting link'} (optional)</span>
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder={mode === 'IN_PERSON' ? 'For example, Room B2' : 'https://meet.example.com/...'}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
          />
        </label>

        <div className="grid gap-2">
          <span className="text-xs font-semibold text-ink-700 dark:text-slate-300">Free times that will not clash</span>
          {suggested === null ? (
            <span className="text-xs text-ink-500 dark:text-slate-400">Finding free times…</span>
          ) : suggested.length === 0 ? (
            <span className="text-xs text-ink-500 dark:text-slate-400">No free time in the next two weeks. Pick a later date.</span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {suggested.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={when === s.slice(0, 16)}
                  onClick={() => {
                    setWhen(s.slice(0, 16))
                    setClash(null)
                  }}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    when === s.slice(0, 16)
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-slate-200 text-ink-900 hover:border-brand-500/40 dark:border-white/10 dark:text-white'
                  }`}
                >
                  {whenLabel(s)}
                </button>
              ))}
            </div>
          )}
        </div>

        {clash && (
          <div role="alert" className="grid gap-3 rounded-2xl bg-amber-500/10 p-4 text-sm">
            <p className="font-semibold text-amber-800 dark:text-amber-300">That time is taken.</p>
            <ul className="grid gap-1 text-xs text-ink-700 dark:text-slate-300">
              {(clash.conflicts ?? []).map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}
        {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    </Modal>
  )
}
