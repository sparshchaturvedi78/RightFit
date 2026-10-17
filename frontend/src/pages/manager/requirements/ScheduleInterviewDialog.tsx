import axios from 'axios'
import { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/form'
import { Modal } from '../../../components/ui/Overlay'
import { useToast } from '../../../hooks/useToast'
import { getApiErrorMessage } from '../../../services/httpClient'
import type { CandidateDTO } from '../../../services/manager/candidate.service'
import { interviewService } from '../../../services/interview.service'

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
 * Book an interview for an accepted candidate. If the time clashes with the interviewer's or the candidate's
 * other interviews, the clashes are shown with free times to choose from, instead of a bare error.
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
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clash, setClash] = useState<ClashBody | null>(null)
  const [suggested, setSuggested] = useState<string[] | null>(null)
  const name = candidate.employeeName ?? candidate.employeeId

  // Free times are worked out before the manager picks one, so a booking does not clash by default.
  useEffect(() => {
    let live = true
    interviewService
      .suggestSlots(candidate.applicationId, minutes)
      .then((slots) => {
        if (live) setSuggested(slots)
      })
      .catch(() => {
        if (live) setSuggested([])
      })
    return () => {
      live = false
    }
  }, [candidate.applicationId, minutes])

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
            <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} minutes
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-ink-900 dark:text-white">Mode</span>
            <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
              <option value="ONLINE">Online</option>
              <option value="IN_PERSON">In person</option>
              <option value="PHONE">Phone</option>
            </select>
          </label>
        </div>
        <label className="grid gap-1.5 text-sm">
          <span className="font-semibold text-ink-900 dark:text-white">Room or meeting link (optional)</span>
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
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
            {clash.suggestions && clash.suggestions.length > 0 ? (
              <div className="grid gap-2">
                <span className="text-xs font-semibold text-ink-700 dark:text-slate-300">Free times that work for both</span>
                <div className="flex flex-wrap gap-2">
                  {clash.suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setWhen(s.slice(0, 16))
                        setClash(null)
                      }}
                      className="rounded-xl border border-amber-500/40 bg-white px-3 py-1.5 text-xs font-semibold text-ink-900 hover:bg-amber-500/10 dark:bg-white/5 dark:text-white"
                    >
                      {whenLabel(s)}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-ink-700 dark:text-slate-300">No free time in the next two weeks. Try a later date.</p>
            )}
          </div>
        )}
        {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    </Modal>
  )
}
