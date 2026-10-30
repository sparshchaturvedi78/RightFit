import { FolderPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import PersonPicker from '../../../components/people/PersonPicker'
import { Button, Field, FormError, FormSection, Input, Textarea } from '../../../components/ui/form'
import { Drawer } from '../../../components/ui/Overlay'
import { useToast } from '../../../hooks/useToast'
import type { EmployeeDTO } from '../../../services/admin/employee.service'
import {
  adminProjectService,
  type CreateProjectRequest,
  type ProjectDTO,
  type UpdateProjectRequest,
} from '../../../services/admin/project.service'
import { getApiErrorMessage } from '../../../services/httpClient'

interface FormState {
  projectId: string
  projectName: string
  clientName: string
  description: string
  startDate: string
  endDate: string
}

type Errors = Partial<Record<keyof FormState | 'manager', string>>

const EMPTY: FormState = { projectId: '', projectName: '', clientName: '', description: '', startDate: '', endDate: '' }

function fromProject(p: ProjectDTO): FormState {
  return {
    projectId: p.projectId,
    projectName: p.projectName,
    clientName: p.clientName ?? '',
    description: p.description ?? '',
    startDate: p.startDate ?? '',
    endDate: p.endDate ?? '',
  }
}

function validate(form: FormState, mode: 'create' | 'edit'): Errors {
  const errors: Errors = {}
  if (mode === 'create' && !form.projectId.trim()) errors.projectId = 'Project ID is required'
  if (!form.projectName.trim()) errors.projectName = 'Project name is required'
  if (form.startDate && form.endDate && form.endDate < form.startDate) errors.endDate = 'End date can’t be before the start date'
  return errors
}

const text = (value: string) => (value.trim() === '' ? undefined : value.trim())

function buildUpdate(form: FormState, original: FormState): UpdateProjectRequest {
  const patch: UpdateProjectRequest = {}
  if (form.projectName !== original.projectName) patch.projectName = form.projectName.trim()
  if (form.clientName !== original.clientName) patch.clientName = text(form.clientName)
  if (form.description !== original.description) patch.description = text(form.description)
  if (form.startDate !== original.startDate) patch.startDate = text(form.startDate)
  if (form.endDate !== original.endDate) patch.endDate = text(form.endDate)
  return patch
}

function FormBody({
  project,
  onClose,
  onSaved,
  onSaving,
}: {
  project: ProjectDTO | null
  onClose: () => void
  onSaved: (saved: ProjectDTO) => void
  onSaving: (saving: boolean) => void
}) {
  const mode = project ? 'edit' : 'create'
  const toast = useToast()
  const [original] = useState<FormState>(() => (project ? fromProject(project) : EMPTY))
  const [form, setForm] = useState<FormState>(original)
  const [manager, setManager] = useState<EmployeeDTO | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const set = (key: keyof FormState) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }
  const bind = (key: keyof FormState) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) => set(key)(e.target.value),
  })

  async function submit(ev: FormEvent) {
    ev.preventDefault()
    const found = validate(form, mode)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setServerError(null)

    try {
      onSaving(true)
      if (project) {
        const patch = buildUpdate(form, original)
        if (Object.keys(patch).length === 0) {
          toast.info('Nothing to save', 'No fields were changed.')
          onClose()
          return
        }
        const saved = await adminProjectService.update(project.projectId, patch)
        toast.success('Project updated', saved.projectName)
        onSaved(saved)
      } else {
        const payload: CreateProjectRequest = {
          projectId: form.projectId.trim(),
          projectName: form.projectName.trim(),
          managerId: manager?.id,
          clientName: text(form.clientName),
          description: text(form.description),
          startDate: text(form.startDate),
          endDate: text(form.endDate),
        }
        const saved = await adminProjectService.create(payload)
        toast.success('Project created', `${saved.projectName} (${saved.projectId})`)
        onSaved(saved)
      }
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Could not save this project.'))
    } finally {
      onSaving(false)
    }
  }

  return (
    <form id="project-form" onSubmit={submit} noValidate className="space-y-7">
      <FormError message={serverError} />

      <FormSection title="Project">
        <Field label="Project name" htmlFor="proj-name" required error={errors.projectName} className="sm:col-span-2">
          <Input id="proj-name" {...bind('projectName')} autoFocus autoComplete="off" placeholder="FinTech Platform Modernization" />
        </Field>
        <Field label="Client" htmlFor="proj-client">
          <Input id="proj-client" {...bind('clientName')} autoComplete="off" placeholder="Acme Bank" />
        </Field>
        {mode === 'create' && (
          <Field label="Project ID" htmlFor="proj-id" required error={errors.projectId} hint="Unique, e.g. PROJ005">
            <Input id="proj-id" {...bind('projectId')} autoComplete="off" placeholder="PROJ005" />
          </Field>
        )}
        <Field label="Description" htmlFor="proj-desc" className="sm:col-span-2">
          <Textarea id="proj-desc" {...bind('description')} placeholder="What the project delivers" />
        </Field>
      </FormSection>

      <FormSection title="Schedule">
        <Field label="Start date" htmlFor="proj-start">
          <Input id="proj-start" type="date" {...bind('startDate')} />
        </Field>
        <Field label="End date" htmlFor="proj-end" error={errors.endDate}>
          <Input id="proj-end" type="date" {...bind('endDate')} />
        </Field>
      </FormSection>

      {mode === 'create' && (
        <FormSection title="Ownership">
          <div className="sm:col-span-2">
            <PersonPicker
              id="proj-manager"
              label="Project manager (optional)"
              role="MANAGER"
              roleLabel="Manager"
              value={manager}
              onChange={(person) => {
                setManager(person)
                setErrors((e) => ({ ...e, manager: undefined }))
              }}
              blocker={(person) =>
                person.employmentStatus !== 'ACTIVE' ? `${person.firstName} ${person.lastName} is inactive and can’t manage a project.` : null
              }
              error={errors.manager}
            />
            <p className="mt-3 text-xs text-ink-500 dark:text-slate-500">
              Optional. Without a manager the project is visible to admins only until one is assigned. The manager has to claim the project before they can work on it.
            </p>
          </div>
        </FormSection>
      )}
    </form>
  )
}

/** Create (project === null) or edit drawer. The form body mounts only while open, so it always starts fresh. */
export default function ProjectFormDrawer({
  open,
  project,
  onClose,
  onSaved,
}: {
  open: boolean
  project: ProjectDTO | null
  onClose: () => void
  onSaved: (saved: ProjectDTO) => void
}) {
  const [saving, setSaving] = useState(false)
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={project ? 'Edit project' : 'Add project'}
      subtitle={project ? `${project.projectName} · ${project.projectId}` : 'Creates the project and assigns its manager'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="project-form"
            variant="primary"
            loading={saving}
            icon={project ? undefined : <FolderPlus className="h-4 w-4" />}
          >
            {project ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      {open && <FormBody project={project} onClose={onClose} onSaved={onSaved} onSaving={setSaving} />}
    </Drawer>
  )
}
