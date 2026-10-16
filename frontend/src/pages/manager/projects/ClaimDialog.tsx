import { Check } from 'lucide-react'
import { useState } from 'react'
import { Modal } from '../../../components/ui/Overlay'
import { Button, FormError } from '../../../components/ui/form'
import { useToast } from '../../../hooks/useToast'
import type { ProjectDTO } from '../../../services/admin/project.service'
import { getApiErrorMessage } from '../../../services/httpClient'
import type { ProjectStaffingDTO } from '../../../services/manager/dashboard.service'
import { managerProjectService } from '../../../services/manager/project.service'
import { formatDay } from '../../admin/employees/employeeUi'

const WHAT_YOU_CAN_DO = [
  'Create requirements and choose who sources and interviews',
  'Build the team and ask the RMG for allocations',
  'See its candidates, interviews and reports',
]

/** Asks the manager to confirm before taking a project on, and says what changes once they do. */
export default function ClaimDialog({
  project,
  staffing,
  onClose,
  onClaimed,
}: {
  project: ProjectDTO | null
  staffing?: ProjectStaffingDTO
  onClose: () => void
  onClaimed: (project: ProjectDTO) => void
}) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function claim() {
    if (!project) return
    setBusy(true)
    setError(null)
    try {
      const claimed = await managerProjectService.claim(project.projectId)
      toast.success(`${project.projectName} is yours`, 'You can now create requirements for it.')
      onClaimed(claimed)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not claim the project. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={project !== null}
      onClose={busy ? () => undefined : onClose}
      title={project ? `Claim ${project.projectName}?` : 'Claim project'}
      subtitle="You become responsible for this project. To hand it back, ask the admin to reassign it."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void claim()} loading={busy}>
            Claim project
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <ul className="grid gap-2 text-sm text-ink-900 dark:text-white">
          {WHAT_YOU_CAN_DO.map((t) => (
            <li key={t} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
              {t}
            </li>
          ))}
        </ul>
        {project && (
          <dl className="grid gap-2 rounded-2xl bg-slate-100/70 p-3.5 text-[13px] dark:bg-white/5">
            {project.clientName && <Row label="Client" value={project.clientName} />}
            <Row label="Added by" value={[project.createdBy, formatDay(project.createdAt?.slice(0, 10))].filter(Boolean).join(', ') || '—'} />
            {staffing && (
              <Row
                label="Team now"
                value={`${staffing.activeMembers} ${staffing.activeMembers === 1 ? 'person' : 'people'} · ${staffing.openRequirements} open requirement${staffing.openRequirements === 1 ? '' : 's'}`}
              />
            )}
          </dl>
        )}
        <FormError message={error} />
      </div>
    </Modal>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right font-semibold text-ink-900 dark:text-white">{value}</dd>
    </div>
  )
}
