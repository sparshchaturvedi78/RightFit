import { useState } from 'react'
import { Dropdown } from '../../../components/ui/Dropdown'
import { Button } from '../../../components/ui/form'
import { Modal } from '../../../components/ui/Overlay'
import { useToast } from '../../../hooks/useToast'
import { getApiErrorMessage } from '../../../services/httpClient'
import type { CandidateDTO } from '../../../services/manager/candidate.service'
import { managerDecisionService } from '../../../services/manager/decision.service'

const REASONS: { value: string; label: string }[] = [
  { value: 'SKILL_GAP', label: 'Skill gap' },
  { value: 'EXPERIENCE_GAP', label: 'Experience gap' },
  { value: 'DOMAIN_MISMATCH', label: 'Domain mismatch' },
  { value: 'LOCATION_MISMATCH', label: 'Location mismatch' },
  { value: 'WORK_MODE_MISMATCH', label: 'Work mode mismatch' },
  { value: 'COMMUNICATION', label: 'Communication' },
  { value: 'PROJECT_FIT', label: 'Project fit' },
  { value: 'OTHER', label: 'Other' },
]

/** The manager's final call on a candidate after their interviews: select them for allocation, or reject them. */
export default function DecisionDialog({
  candidate,
  decision,
  onClose,
  onDone,
}: {
  candidate: CandidateDTO
  decision: 'SELECT' | 'REJECT'
  onClose: () => void
  onDone: () => void
}) {
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const name = candidate.employeeName ?? candidate.employeeId
  const selecting = decision === 'SELECT'

  async function save() {
    if (!selecting && !reason) {
      setError('Choose a reason, so the record makes sense later.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await managerDecisionService.decide(candidate.applicationId, {
        decision,
        reasonCode: selecting ? undefined : reason,
        comment: comment.trim() || undefined,
      })
      toast.success(selecting ? `${name} selected` : `${name} rejected`, candidate.requirementId)
      onDone()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save the decision. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={busy ? () => undefined : onClose}
      title={selecting ? `Select ${name}?` : `Reject ${name}?`}
      subtitle={selecting ? 'Selecting them lets you request their allocation next.' : `From ${candidate.requirementId}. Their history stays.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={selecting ? 'primary' : 'danger'} onClick={() => void save()} loading={busy}>
            {selecting ? 'Select' : 'Reject'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {!selecting && (
          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-ink-900 dark:text-white">Reason</span>
            <Dropdown ariaLabel="Reason" value={reason} onChange={setReason} placeholder="Choose" options={REASONS.map((r) => ({ value: r.value, label: r.label }))} />
          </label>
        )}
        <label className="grid gap-1.5 text-sm">
          <span className="font-semibold text-ink-900 dark:text-white">Note (optional)</span>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
        </label>
        {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    </Modal>
  )
}
