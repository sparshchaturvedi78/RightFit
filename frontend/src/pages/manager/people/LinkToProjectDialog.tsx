import { useState } from 'react'
import { Dropdown } from '../../../components/ui/Dropdown'
import { Modal } from '../../../components/ui/Overlay'
import { Button, Field, FormError, Input } from '../../../components/ui/form'
import { useToast } from '../../../hooks/useToast'
import type { ProjectDTO } from '../../../services/admin/project.service'
import { getApiErrorMessage } from '../../../services/httpClient'
import { managerTeamService, type PersonDTO } from '../../../services/manager/team.service'
import CapacityBar from './CapacityBar'

/**
 * Link someone who is already on one of the manager's projects to another of their projects, for some hours a day.
 * From a person, pick the project; from a project's Team tab, pick the person.
 */
export default function LinkToProjectDialog({
  open,
  onClose,
  people,
  projects,
  employeeId,
  projectId,
  onDone,
}: {
  open: boolean
  onClose: () => void
  people: PersonDTO[]
  /** The manager's claimed projects. */
  projects: ProjectDTO[]
  /** Fixed when opened from a person. */
  employeeId?: string
  /** Fixed when opened from a project. */
  projectId?: string
  onDone: () => void
}) {
  const toast = useToast()
  const [emp, setEmp] = useState('')
  const [proj, setProj] = useState('')
  const [hours, setHours] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [role, setRole] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const person = people.find((p) => p.employeeId === emp)
  const free = person?.availableHoursPerDay ?? 0

  /** Start the hours at a sensible figure: four a day, or whatever is free if less. */
  const suggest = (p: PersonDTO | undefined) => setHours(p ? String(Math.max(0, Math.min(p.availableHoursPerDay ?? 4, 4))) : '')

  // A fresh form each time the dialog opens.
  const [wasOpen, setWasOpen] = useState(false)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setEmp(employeeId ?? '')
      setProj(projectId ?? '')
      suggest(people.find((p) => p.employeeId === employeeId))
      setStart('')
      setEnd('')
      setRole('')
      setError(null)
    }
  }

  const onProjects = new Set(person?.projects.map((p) => p.projectId))
  const projectOptions = projects
    .filter((p) => p.status === 'ACTIVE' && !onProjects.has(p.projectId))
    .map((p) => ({ value: p.projectId, label: p.projectName, hint: p.projectId }))
  const personOptions = people
    .filter((p) => !projectId || !p.projects.some((x) => x.projectId === projectId))
    .map((p) => ({ value: p.employeeId, label: p.name, hint: `${p.employeeId} · ${p.availableHoursPerDay ?? 0} h free` }))

  const h = Number(hours)
  const problem =
    !emp ? 'Choose a person.' : !proj ? 'Choose a project.' : !(h > 0) ? 'Enter the hours a day.' : person && h > free ? `${person.name} has only ${free} hours a day free.` : end && start && end < start ? 'The end date can’t be before the start date.' : null

  async function submit() {
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await managerTeamService.addMember(proj, { employeeId: emp, hoursPerDay: h, startDate: start || undefined, endDate: end || undefined, role: role.trim() || undefined })
      const target = projects.find((p) => p.projectId === proj)
      toast.success(`${person?.name ?? emp} added to ${target?.projectName ?? proj}`, `${h} hours a day`)
      onDone()
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not add them to the project. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onClose}
      title="Add to a project"
      subtitle="Someone on your projects can work on more than one. Their hours are shared between them."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void submit()} loading={busy}>
            Add to project
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Person" htmlFor="link-person" required>
          <Dropdown
            id="link-person"
            value={emp}
            onChange={(v) => {
              setEmp(v)
              suggest(people.find((p) => p.employeeId === v))
              if (!projectId) setProj('')
            }}
            disabled={Boolean(employeeId)}
            placeholder="Choose a person"
            emptyText="Nobody else is on your projects"
            options={personOptions}
          />
        </Field>
        {person && (
          <div className="rounded-xl bg-slate-100/70 p-3 dark:bg-white/5">
            <p className="mb-2 text-xs text-ink-500 dark:text-slate-400">
              Already on: {person.projects.map((p) => `${p.projectName}${p.hoursPerDay != null ? ` (${p.hoursPerDay} h)` : ''}`).join(', ')}
            </p>
            <CapacityBar working={person.workingHoursPerDay} booked={person.allocatedHoursPerDay} adding={h > 0 ? h : 0} />
          </div>
        )}
        <Field label="Project" htmlFor="link-project" required hint="Only your own projects that they aren’t on yet.">
          <Dropdown
            id="link-project"
            value={proj}
            onChange={setProj}
            disabled={Boolean(projectId)}
            placeholder={emp ? 'Choose a project' : 'Choose a person first'}
            emptyText="They are on all your projects already"
            options={projectOptions}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Hours a day" htmlFor="link-hours" required>
            <Input id="link-hours" type="number" min={0.5} step={0.5} value={hours} onChange={(e) => setHours(e.target.value)} />
          </Field>
          <Field label="From" htmlFor="link-start" hint="Blank means today.">
            <Input id="link-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="Until" htmlFor="link-end" hint="Optional.">
            <Input id="link-end" type="date" min={start || undefined} value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>
        <Field label="Role on this project" htmlFor="link-role" hint="Optional, for example Developer or QA.">
          <Input id="link-role" value={role} onChange={(e) => setRole(e.target.value)} />
        </Field>
        <FormError message={error} />
      </div>
    </Modal>
  )
}
