import { TriangleAlert } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import PersonPicker from '../../../components/people/PersonPicker'
import { Button, Field, FormError, Input, Textarea } from '../../../components/ui/form'
import { Modal } from '../../../components/ui/Overlay'
import { useToast } from '../../../hooks/useToast'
import type { EmployeeDTO } from '../../../services/admin/employee.service'
import { adminProjectService, type ProjectDTO } from '../../../services/admin/project.service'
import { getApiErrorMessage } from '../../../services/httpClient'

type Saved = (saved: ProjectDTO) => void

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function StatusForm({
  project,
  mode,
  onClose,
  onSaved,
}: {
  project: ProjectDTO
  mode: 'close' | 'reopen'
  onClose: () => void
  onSaved: Saved
}) {
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [effectiveDate, setEffectiveDate] = useState(todayISO)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const closing = mode === 'close'

  async function submit(ev: FormEvent) {
    ev.preventDefault()
    if (!reason.trim()) {
      setFieldError('Please give a reason — it is kept in the audit log')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const payload = { reason: reason.trim(), effectiveDate: effectiveDate || undefined }
      const saved = closing
        ? await adminProjectService.close(project.projectId, payload)
        : await adminProjectService.reopen(project.projectId, payload)
      toast.success(closing ? 'Project closed' : 'Project reopened', saved.projectName)
      onSaved(saved)
    } catch (err) {
      setError(getApiErrorMessage(err, `Could not ${mode} this project.`))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <p className="text-sm text-ink-500 dark:text-slate-400">
        {closing
          ? `${project.projectName} will stop appearing in active lists.`
          : `${project.projectName} will become active again.`}
      </p>

      {closing && (
        <div className="flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/8 p-3.5 text-sm text-amber-800 dark:text-amber-200">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Closing ends the project’s allocations and closes its open requirements, and people who are free are
            returned to the Resource Pool. History is kept.
          </p>
        </div>
      )}

      <FormError message={error} />

      <Field label="Reason" htmlFor="status-reason" required error={fieldError}>
        <Textarea
          id="status-reason"
          autoFocus
          value={reason}
          onChange={(e) => {
            setReason(e.target.value)
            setFieldError(null)
          }}
          placeholder={closing ? 'e.g. Delivered — client sign-off received' : 'e.g. Client extended the contract'}
        />
      </Field>
      <Field label="Effective date" htmlFor="status-date" hint="Optional — defaults to today">
        <Input id="status-date" type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
      </Field>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant={closing ? 'danger' : 'primary'} loading={saving}>
          {closing ? 'Close project' : 'Reopen project'}
        </Button>
      </div>
    </form>
  )
}

export function StatusDialog({
  project,
  mode,
  onClose,
  onSaved,
}: {
  project: ProjectDTO | null
  mode: 'close' | 'reopen'
  onClose: () => void
  onSaved: Saved
}) {
  return (
    <Modal
      open={project !== null}
      onClose={onClose}
      title={mode === 'close' ? 'Close project' : 'Reopen project'}
      subtitle={project ? `${project.projectName} · ${project.projectId}` : undefined}
    >
      {project && <StatusForm key={project.id + mode} project={project} mode={mode} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  )
}

function ManagerForm({ project, onClose, onSaved }: { project: ProjectDTO; onClose: () => void; onSaved: Saved }) {
  const toast = useToast()
  const [manager, setManager] = useState<EmployeeDTO | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const blocker = (person: EmployeeDTO) =>
    person.id === project.managerId
      ? `${person.firstName} ${person.lastName} already manages this project.`
      : person.employmentStatus !== 'ACTIVE'
        ? `${person.firstName} ${person.lastName} is inactive and can’t manage a project.`
        : null

  async function submit(ev: FormEvent) {
    ev.preventDefault()
    if (!manager) {
      setFieldError('Find the new manager by employee ID first')
      return
    }
    if (blocker(manager)) return
    setError(null)
    setSaving(true)
    try {
      const saved = await adminProjectService.changeManager(project.projectId, {
        newManagerEmployeeId: manager.employeeId,
        reason: reason.trim() || undefined,
      })
      toast.success('Manager changed', `${saved.projectName} is now managed by ${saved.managerName ?? manager.firstName}`)
      onSaved(saved)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not change the manager.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <p className="text-sm text-ink-500 dark:text-slate-400">
        Currently managed by{' '}
        <span className="font-semibold text-ink-900 dark:text-white">{project.managerName ?? 'nobody'}</span>. The new
        manager will have to claim the project again.
      </p>
      <FormError message={error} />

      <PersonPicker
        id="manager-id"
        label="New manager"
        role="MANAGER"
        roleLabel="Manager"
        value={manager}
        onChange={(person) => {
          setManager(person)
          setFieldError(null)
        }}
        blocker={blocker}
        error={fieldError}
      />

      <Field label="Reason" htmlFor="manager-reason" hint="Optional — kept in the audit log">
        <Textarea id="manager-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-3 pt-1">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={saving} disabled={!manager || !!blocker(manager)}>
          Change manager
        </Button>
      </div>
    </form>
  )
}

export function ChangeManagerDialog({
  project,
  onClose,
  onSaved,
}: {
  project: ProjectDTO | null
  onClose: () => void
  onSaved: Saved
}) {
  return (
    <Modal
      open={project !== null}
      onClose={onClose}
      title="Change manager"
      subtitle={project ? `${project.projectName} · ${project.projectId}` : undefined}
    >
      {project && <ManagerForm key={project.id} project={project} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  )
}
