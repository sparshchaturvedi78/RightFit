import { useState } from 'react'
import { Dropdown } from '../../../components/ui/Dropdown'
import { Modal } from '../../../components/ui/Overlay'
import { Button, Field, FormError, Input, Textarea } from '../../../components/ui/form'
import { useToast } from '../../../hooks/useToast'
import type { ProjectDTO } from '../../../services/admin/project.service'
import { getApiErrorMessage } from '../../../services/httpClient'
import { managerTeamService, type PersonDTO } from '../../../services/manager/team.service'

/** Move someone's hours from one of the manager's projects to another. They stop on the first and start on the second. */
export default function MoveDialog({
  open,
  onClose,
  person,
  fromProjectId,
  projects,
  onDone,
}: {
  open: boolean
  onClose: () => void
  person: PersonDTO | null
  fromProjectId: string
  projects: ProjectDTO[]
  onDone: () => void
}) {
  const toast = useToast()
  const [to, setTo] = useState('')
  const [hours, setHours] = useState('')
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = person?.projects.find((p) => p.projectId === fromProjectId)
  const booked = from?.hoursPerDay ?? null

  const [wasOpen, setWasOpen] = useState(false)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setTo('')
      setHours(booked != null ? String(booked) : '')
      setDate('')
      setReason('')
      setError(null)
    }
  }

  const onProjects = new Set(person?.projects.map((p) => p.projectId))
  const options = projects
    .filter((p) => p.status === 'ACTIVE' && !onProjects.has(p.projectId))
    .map((p) => ({ value: p.projectId, label: p.projectName, hint: p.projectId }))
  const nothingToMove = booked == null

  async function submit() {
    if (!person) return
    if (!to) return setError('Choose the project to move them to.')
    if (!reason.trim()) return setError('Say why, so the history makes sense later.')
    const h = hours ? Number(hours) : undefined
    if (h !== undefined && !(h > 0)) return setError('Enter the hours a day.')
    setBusy(true)
    setError(null)
    try {
      await managerTeamService.moveAllocation(person.employeeId, {
        fromProjectId,
        toProjectId: to,
        hoursPerDay: h,
        effectiveDate: date || undefined,
        reason: reason.trim(),
      })
      toast.success(`${person.name} moved`, `${from?.projectName ?? fromProjectId} to ${projects.find((p) => p.projectId === to)?.projectName ?? to}`)
      onDone()
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not move them. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onClose}
      title={person ? `Move ${person.name}` : 'Move'}
      subtitle={from ? `Away from ${from.projectName}, to another of your projects.` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void submit()} loading={busy} disabled={nothingToMove}>
            Move
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {nothingToMove && (
          <p className="rounded-xl border border-amber-500/25 bg-amber-500/8 px-3.5 py-2.5 text-sm text-ink-700 dark:text-slate-300">
            No hours are booked on {from?.projectName ?? 'this project'}, so there is nothing to move. Add them to the other project instead.
          </p>
        )}
        <Field label="Move to" htmlFor="move-to" required hint="Only your own projects that they aren’t on yet.">
          <Dropdown id="move-to" value={to} onChange={setTo} placeholder="Choose a project" emptyText="They are on all your projects already" options={options} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Hours a day" htmlFor="move-hours" hint={booked != null ? `${booked} now. Leave as is to move all of them.` : undefined}>
            <Input id="move-hours" type="number" min={0.5} step={0.5} value={hours} onChange={(e) => setHours(e.target.value)} />
          </Field>
          <Field label="From" htmlFor="move-date" hint="Blank means today.">
            <Input id="move-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Why" htmlFor="move-reason" required>
          <Textarea id="move-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="For example, the Data Platform release needs them more" />
        </Field>
        <FormError message={error} />
      </div>
    </Modal>
  )
}
