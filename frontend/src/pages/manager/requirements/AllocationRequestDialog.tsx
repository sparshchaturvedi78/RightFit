import { useState } from 'react'
import { Button } from '../../../components/ui/form'
import { Modal } from '../../../components/ui/Overlay'
import { useToast } from '../../../hooks/useToast'
import { allocationService } from '../../../services/allocation.service'
import { getApiErrorMessage } from '../../../services/httpClient'
import type { CandidateDTO } from '../../../services/manager/candidate.service'

/**
 * Ask RMG to put a selected candidate on the project. The dates are optional: the requirement's dates are used
 * when they are left empty. Sending it moves the other candidates on the requirement on hold.
 */
export default function AllocationRequestDialog({
  candidate,
  onClose,
  onDone,
}: {
  candidate: CandidateDTO
  onClose: () => void
  onDone: () => void
}) {
  const toast = useToast()
  const [hours, setHours] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const name = candidate.employeeName ?? candidate.employeeId

  async function send() {
    const perDay = Number(hours)
    if (!hours || !(perDay > 0)) {
      setError('Enter the hours a day.')
      return
    }
    if (start && end && end < start) {
      setError('The end date is before the start date.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await allocationService.create(candidate.applicationId, {
        hoursPerDay: perDay,
        startDate: start || undefined,
        endDate: end || undefined,
      })
      toast.success(`Sent ${name} to RMG`, candidate.requirementId)
      onDone()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not send the request. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={busy ? () => undefined : onClose}
      title={`Request allocation for ${name}`}
      subtitle="RMG decides. The other people on this requirement wait on hold until RMG answers."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void send()} loading={busy}>
            Send to RMG
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <label className="grid gap-1.5 text-sm">
          <span className="font-semibold text-ink-900 dark:text-white">Hours a day</span>
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-ink-900 dark:text-white">Starts (optional)</span>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-ink-900 dark:text-white">Ends (optional)</span>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
          </label>
        </div>
        <p className="text-xs text-ink-500 dark:text-slate-400">The system checks their hours against the working day before sending.</p>
        {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    </Modal>
  )
}
