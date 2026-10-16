import { useState } from 'react'
import { Modal } from '../../../components/ui/Overlay'
import { Button, Field, FormError, Textarea } from '../../../components/ui/form'
import { useToast } from '../../../hooks/useToast'
import { getApiErrorMessage } from '../../../services/httpClient'
import { managerTeamService } from '../../../services/manager/team.service'

/** Take someone off one of the manager's projects. Their history on it stays; a reason is required. */
export default function RemoveFromTeamDialog({
  projectId,
  projectName,
  member,
  onClose,
  onDone,
}: {
  projectId: string
  projectName: string
  /** The person to remove, or null when the dialog is closed. */
  member: { employeeId: string; name: string } | null
  onClose: () => void
  onDone: () => void
}) {
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // A fresh reason each time someone new is chosen.
  const [who, setWho] = useState<string | null>(null)
  if ((member?.employeeId ?? null) !== who) {
    setWho(member?.employeeId ?? null)
    setReason('')
    setError(null)
  }

  async function remove() {
    if (!member) return
    if (!reason.trim()) {
      setError('Say why, so the history makes sense later.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await managerTeamService.removeMember(projectId, member.employeeId, reason.trim())
      toast.success(`${member.name} removed`, `From ${projectName}`)
      onDone()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not remove them. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={member !== null}
      onClose={busy ? () => undefined : onClose}
      title={member ? `Remove ${member.name}?` : 'Remove'}
      subtitle={`From ${projectName}. Their history on the project stays.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => void remove()} loading={busy}>
            Remove from project
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Reason" htmlFor="remove-reason" required>
          <Textarea id="remove-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="For example, moved to the Data Platform release" />
        </Field>
        <FormError message={error} />
      </div>
    </Modal>
  )
}
