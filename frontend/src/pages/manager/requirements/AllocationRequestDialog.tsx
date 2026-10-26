import { useState } from 'react'
import { Button } from '../../../components/ui/form'
import { Modal } from '../../../components/ui/Overlay'
import { useToast } from '../../../hooks/useToast'
import { allocationService } from '../../../services/allocation.service'
import { getApiErrorMessage } from '../../../services/httpClient'
import type { CandidateDTO } from '../../../services/manager/candidate.service'

/**
 * Ask RMG to put a selected candidate on the project. Every allocation is the full working day, open ended, so the
 * only choice is when it starts (the requirement's start date is used when left empty). Sending it moves the other
 * candidates on the requirement on hold.
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
  const [start, setStart] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const name = candidate.employeeName ?? candidate.employeeId

  async function send() {
    setBusy(true)
    setError(null)
    try {
      await allocationService.create(candidate.applicationId, { startDate: start || undefined })
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
          <span className="font-semibold text-ink-900 dark:text-white">Starts on (optional)</span>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
        </label>
        <p className="text-xs text-ink-500 dark:text-slate-400">
          The full working day from the start date, open ended. Leave the date empty to use the requirement&apos;s start date.
        </p>
        {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    </Modal>
  )
}
