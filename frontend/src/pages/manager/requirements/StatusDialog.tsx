import { useState } from 'react'
import { Modal } from '../../../components/ui/Overlay'
import { Button, Field, FormError, Textarea } from '../../../components/ui/form'
import { useToast } from '../../../hooks/useToast'
import { getApiErrorMessage } from '../../../services/httpClient'
import { managerRequirementService, type RequirementDTO } from '../../../services/manager/requirement.service'
import { STATUS_ACTIONS, type StatusAction } from './statusActions'

const CALL = {
  publish: managerRequirementService.publish,
  hold: managerRequirementService.hold,
  resume: managerRequirementService.resume,
  close: managerRequirementService.close,
  cancel: managerRequirementService.cancel,
}

/** Asks for a reason, then changes the requirement's status. A reason is always recorded in its history. */
export default function StatusDialog({
  requirement,
  action,
  onClose,
  onDone,
}: {
  requirement: RequirementDTO
  action: StatusAction | null
  onClose: () => void
  onDone: (updated: RequirementDTO) => void
}) {
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // A fresh reason each time a different action is chosen.
  const [seen, setSeen] = useState<StatusAction | null>(null)
  if (action !== seen) {
    setSeen(action)
    setReason(action ? STATUS_ACTIONS[action].defaultReason : '')
    setError(null)
  }

  const info = action ? STATUS_ACTIONS[action] : null

  async function confirm() {
    if (!action || !info) return
    if (!reason.trim()) {
      setError('Say why, so the history makes sense later.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const updated = await CALL[action](requirement.requirementId, { reason: reason.trim() })
      toast.success(`${requirement.requirementId} ${info.done}`, requirement.positionTitle)
      onDone(updated)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not change the status. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={action !== null}
      onClose={busy ? () => undefined : onClose}
      title={info?.title ?? ''}
      subtitle={`${requirement.requirementId} · ${requirement.positionTitle}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Not now
          </Button>
          <Button variant={info?.tone === 'secondary' ? 'primary' : (info?.tone ?? 'primary')} onClick={() => void confirm()} loading={busy}>
            {info?.confirm}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <p className="text-sm text-ink-700 dark:text-slate-300">{info?.text}</p>
        <Field label="Reason" htmlFor="status-reason" required>
          <Textarea id="status-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="For example, the role was filled internally" />
        </Field>
        <FormError message={error} />
      </div>
    </Modal>
  )
}
