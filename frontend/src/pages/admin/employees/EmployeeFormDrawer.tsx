import { Check, Copy, Eye, EyeOff, RefreshCw, UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import PersonPicker from '../../../components/people/PersonPicker'
import { Dropdown } from '../../../components/ui/Dropdown'
import { Button, Field, FormError, FormSection, Input } from '../../../components/ui/form'
import { Drawer } from '../../../components/ui/Overlay'
import { useResource } from '../../../hooks/useResource'
import { useToast } from '../../../hooks/useToast'
import {
  adminEmployeeService,
  type CreateEmployeeRequest,
  type EmployeeDTO,
  type UpdateEmployeeRequest,
} from '../../../services/admin/employee.service'
import { getApiErrorMessage } from '../../../services/httpClient'

interface FormState {
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  designation: string
  grade: string
  domain: string
  yearsOfExperience: string
  dateOfJoining: string
  workingHoursPerDay: string
  departmentId: string
  locationId: string
  rmgId: string
  roleId: string
  password: string
}

type Errors = Partial<Record<keyof FormState, string>>

const EMPTY: FormState = {
  employeeId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  designation: '',
  grade: '',
  domain: '',
  yearsOfExperience: '',
  dateOfJoining: '',
  workingHoursPerDay: '8',
  departmentId: '',
  locationId: '',
  rmgId: '',
  roleId: '',
  password: '',
}

function fromEmployee(e: EmployeeDTO): FormState {
  return {
    employeeId: e.employeeId,
    firstName: e.firstName,
    lastName: e.lastName,
    email: e.email,
    phone: e.phone ?? '',
    designation: e.designation,
    grade: e.grade ?? '',
    domain: e.domain ?? '',
    yearsOfExperience: e.yearsOfExperience != null ? String(e.yearsOfExperience) : '',
    dateOfJoining: e.dateOfJoining ?? '',
    workingHoursPerDay: e.workingHoursPerDay != null ? String(e.workingHoursPerDay) : '8',
    departmentId: e.departmentId != null ? String(e.departmentId) : '',
    locationId: e.locationId != null ? String(e.locationId) : '',
    rmgId: e.rmgId != null ? String(e.rmgId) : '',
    roleId: '',
    password: '',
  }
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%'
  const bytes = crypto.getRandomValues(new Uint32Array(12))
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

const SYSTEM_ROLE_CODES = ['ADMIN', 'MANAGER', 'RMG', 'ASSOCIATE']

function validate(form: FormState, mode: 'create' | 'edit', rmgRequired: boolean): Errors {
  const errors: Errors = {}
  const need = (key: keyof FormState, label: string) => {
    if (!form[key].trim()) errors[key] = `${label} is required`
  }
  if (mode === 'create') {
    need('employeeId', 'Employee ID')
    need('password', 'Password')
    if (rmgRequired) need('rmgId', 'RMG')
    if (form.password && form.password.length < 6) errors.password = 'Use at least 6 characters'
  }
  need('firstName', 'First name')
  need('lastName', 'Last name')
  need('email', 'Email')
  need('designation', 'Designation')
  need('departmentId', 'Department')
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address'
  if (form.yearsOfExperience && Number(form.yearsOfExperience) < 0) errors.yearsOfExperience = 'Cannot be negative'
  const hours = Number(form.workingHoursPerDay)
  if (form.workingHoursPerDay && (hours <= 0 || hours > 24)) errors.workingHoursPerDay = 'Between 1 and 24'
  return errors
}

const num = (value: string) => (value.trim() === '' ? undefined : Number(value))
const text = (value: string) => (value.trim() === '' ? undefined : value.trim())

function buildUpdate(form: FormState, original: FormState): UpdateEmployeeRequest {
  const patch: UpdateEmployeeRequest = {}
  const diff = <K extends keyof FormState>(key: K) => form[key] !== original[key]
  if (diff('firstName')) patch.firstName = form.firstName.trim()
  if (diff('lastName')) patch.lastName = form.lastName.trim()
  if (diff('email')) patch.email = form.email.trim()
  if (diff('phone')) patch.phone = text(form.phone)
  if (diff('designation')) patch.designation = form.designation.trim()
  if (diff('grade')) patch.grade = text(form.grade)
  if (diff('domain')) patch.domain = text(form.domain)
  if (diff('yearsOfExperience')) patch.yearsOfExperience = num(form.yearsOfExperience)
  if (diff('dateOfJoining')) patch.dateOfJoining = text(form.dateOfJoining)
  if (diff('workingHoursPerDay')) patch.workingHoursPerDay = num(form.workingHoursPerDay)
  if (diff('departmentId')) patch.departmentId = num(form.departmentId)
  if (diff('locationId')) patch.locationId = num(form.locationId)
  return patch
}

function PasswordField({
  value,
  error,
  onChange,
}: {
  value: string
  error?: string
  onChange: (value: string) => void
}) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard blocked: the admin can still select and copy the visible text
    }
  }

  const icon = 'flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-slate-100 hover:text-ink-900 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white'

  return (
    <Field
      label="Initial password"
      htmlFor="emp-password"
      required
      error={error}
      hint="Share it with the employee securely. They can change it later with “Forgot password”."
    >
      <div className="relative">
        <Input
          id="emp-password"
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-28 font-mono"
        />
        <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center">
          <button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible((v) => !v)} className={icon}>
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button type="button" aria-label="Copy password" disabled={!value} onClick={copy} className={icon}>
            {copied ? <Check className="h-4 w-4 text-brand-600" /> : <Copy className="h-4 w-4" />}
          </button>
          <button
            type="button"
            aria-label="Generate a password"
            title="Generate"
            onClick={() => {
              onChange(generatePassword())
              setVisible(true)
            }}
            className={icon}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Field>
  )
}

function FormBody({
  employee,
  onClose,
  onSaved,
  onSaving,
}: {
  employee: EmployeeDTO | null
  onClose: () => void
  onSaved: (saved: EmployeeDTO) => void
  onSaving: (saving: boolean) => void
}) {
  const mode = employee ? 'edit' : 'create'
  const toast = useToast()
  const lookups = useResource('admin/lookups')
  const rmgs = useResource('admin/rmg-roster')
  const roles = useResource('admin/roles')
  // Guard against an unexpected payload (e.g. an error page) so the form can never crash the screen.
  const departments = Array.isArray(lookups.data?.departments) ? lookups.data.departments : []
  const locations = Array.isArray(lookups.data?.locations) ? lookups.data.locations : []
  const designations = Array.isArray(lookups.data?.designations) ? lookups.data.designations : []
  const rmgOptions = Array.isArray(rmgs.data) ? rmgs.data : []
  const roleOptions = Array.isArray(roles.data) ? roles.data : []
  const [original] = useState<FormState>(() => (employee ? fromEmployee(employee) : EMPTY))
  const [form, setForm] = useState<FormState>(original)
  // A new Admin doesn't report to an RMG, so the RMG field is optional for them.
  const chosenRole = roleOptions.find((r) => String(r.id) === form.roleId)
  const roleCode = (chosenRole?.code ?? chosenRole?.name ?? '').toUpperCase()
  const newAdmin = mode === 'create' && roleCode === 'ADMIN'
  // A new RMG reports to an Admin (RMGs sit at the top of the resource chain); everyone else reports to an RMG.
  const newRmg = mode === 'create' && roleCode === 'RMG'
  const [reportsTo, setReportsTo] = useState<EmployeeDTO | null>(null)

  // ---- Editing: change the person's main role (e.g. promote an Associate to Manager) -----------------------
  const systemRoles = roleOptions.filter((r) => SYSTEM_ROLE_CODES.includes((r.code ?? '').toUpperCase()))
  const currentRoles = employee ? systemRoles.filter((r) => employee.roles?.some((n) => n.toLowerCase() === r.name.toLowerCase())) : []
  const hasSeveralRoles = currentRoles.length > 1
  const originalRoleId = currentRoles.length === 1 ? String(currentRoles[0].id) : ''
  const [pickedRoleId, setPickedRoleId] = useState<string | null>(null)
  const editRoleId = pickedRoleId ?? originalRoleId
  const roleChanged = mode === 'edit' && pickedRoleId !== null && pickedRoleId !== originalRoleId
  const toCode = (systemRoles.find((r) => String(r.id) === editRoleId)?.code ?? '').toUpperCase()
  // Any change to a non-Admin role asks for the reporting line (the server requires one unless the current
  // lead already fits the new role). It is required only when the person has no current RMG to keep.
  const needsLead = roleChanged && toCode !== 'ADMIN'
  const leadRequired = needsLead && !employee?.rmgId
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
    const found = validate(form, mode, !newAdmin && !newRmg)
    if (newRmg && !reportsTo) found.rmgId = 'Choose the Admin this RMG reports to'
    if (leadRequired && !reportsTo) found.rmgId = toCode === 'RMG' ? 'Choose the Admin this RMG reports to' : 'Choose the RMG they report to'
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setServerError(null)

    try {
      onSaving(true)
      if (employee) {
        const patch = buildUpdate(form, original)
        if (!roleChanged && Object.keys(patch).length === 0) {
          toast.info('Nothing to save', 'No fields were changed.')
          onClose()
          return
        }
        // Role first: it has the strictest rules, so if it is refused nothing else has been saved yet.
        let saved = employee
        if (roleChanged) {
          saved = await adminEmployeeService.changeRole(employee.employeeId, {
            newRoleId: Number(editRoleId),
            reportsToEmployeeId: needsLead ? reportsTo?.employeeId : undefined,
          })
        }
        if (Object.keys(patch).length > 0) {
          try {
            saved = await adminEmployeeService.update(employee.employeeId, patch)
          } catch (err) {
            if (roleChanged) onSaved(saved) // the role did change: refresh lists, then show what went wrong
            throw new Error(
              `${roleChanged ? 'The role was changed, but the other changes were not saved. ' : ''}${getApiErrorMessage(err, 'Could not save this employee.')}`,
              { cause: err },
            )
          }
        }
        toast.success(roleChanged ? 'Role updated' : 'Employee updated', `${saved.firstName} ${saved.lastName}`)
        onSaved(saved)
      } else {
        const payload: CreateEmployeeRequest = {
          employeeId: form.employeeId.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
          designation: form.designation.trim(),
          departmentId: Number(form.departmentId),
          // A new Admin doesn't report to an RMG.
          rmgId: newAdmin ? undefined : newRmg ? reportsTo!.id : Number(form.rmgId),
          phone: text(form.phone),
          grade: text(form.grade),
          domain: text(form.domain),
          yearsOfExperience: num(form.yearsOfExperience),
          dateOfJoining: text(form.dateOfJoining),
          workingHoursPerDay: num(form.workingHoursPerDay),
          locationId: num(form.locationId),
          optionalRoleId: num(form.roleId),
        }
        const saved = await adminEmployeeService.create(payload)
        toast.success('Employee created', `${saved.firstName} ${saved.lastName} (${saved.employeeId})`)
        onSaved(saved)
      }
    } catch (err) {
      setServerError(err instanceof Error && !('response' in err) ? err.message : getApiErrorMessage(err, 'Could not save this employee.'))
    } finally {
      onSaving(false)
    }
  }

  return (
    <form id="employee-form" onSubmit={submit} noValidate className="space-y-7">
      <FormError message={serverError} />

      <FormSection title="Personal">
        <Field label="First name" htmlFor="emp-first" required error={errors.firstName}>
          <Input id="emp-first" {...bind('firstName')} autoFocus autoComplete="off" />
        </Field>
        <Field label="Last name" htmlFor="emp-last" required error={errors.lastName}>
          <Input id="emp-last" {...bind('lastName')} autoComplete="off" />
        </Field>
        <Field label="Work email" htmlFor="emp-email" required error={errors.email}>
          <Input id="emp-email" type="email" {...bind('email')} placeholder="name@company.com" autoComplete="off" />
        </Field>
        <Field label="Phone" htmlFor="emp-phone">
          <Input id="emp-phone" type="tel" {...bind('phone')} placeholder="+91-9876543210" />
        </Field>
      </FormSection>

      <FormSection title="Job">
        <Field label="Designation" htmlFor="emp-designation" required error={errors.designation}>
          <Input id="emp-designation" list="designation-options" {...bind('designation')} placeholder="Senior Software Engineer" />
          <datalist id="designation-options">
            {designations.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </Field>
        <Field label="Grade" htmlFor="emp-grade">
          <Input id="emp-grade" {...bind('grade')} placeholder="L3" />
        </Field>
        <Field label="Domain" htmlFor="emp-domain">
          <Input id="emp-domain" {...bind('domain')} placeholder="Java / Spring" />
        </Field>
        <Field label="Experience (years)" htmlFor="emp-exp" error={errors.yearsOfExperience}>
          <Input id="emp-exp" type="number" min="0" step="0.5" {...bind('yearsOfExperience')} />
        </Field>
        <Field label="Date of joining" htmlFor="emp-doj" hint={mode === 'create' ? 'Defaults to today' : undefined}>
          <Input id="emp-doj" type="date" {...bind('dateOfJoining')} />
        </Field>
        <Field label="Working hours / day" htmlFor="emp-hours" error={errors.workingHoursPerDay}>
          <Input id="emp-hours" type="number" min="1" max="24" step="0.5" {...bind('workingHoursPerDay')} />
        </Field>
      </FormSection>

      <FormSection title="Placement">
        <Field label="Department" htmlFor="emp-dept" required error={errors.departmentId}>
          <Dropdown
            id="emp-dept"
            value={form.departmentId}
            onChange={set('departmentId')}
            invalid={!!errors.departmentId}
            placeholder={lookups.data ? 'Select department…' : 'Loading…'}
            options={departments.map((d) => ({ value: String(d.id), label: d.name }))}
          />
        </Field>
        <Field label="Location" htmlFor="emp-loc">
          <Dropdown
            id="emp-loc"
            value={form.locationId}
            onChange={set('locationId')}
            placeholder={lookups.data ? 'Select location…' : 'Loading…'}
            options={locations.map((l) => ({ value: String(l.id), label: l.name, hint: l.city && l.city !== l.name ? l.city : undefined }))}
          />
        </Field>
        {mode === 'edit' && (
          <>
            <Field
              label="Role"
              htmlFor="emp-edit-role"
              className={needsLead ? '' : 'sm:col-span-2'}
              hint={
                hasSeveralRoles
                  ? 'This person holds several roles — manage them on the User roles page.'
                  : roleChanged
                    ? 'The role changes when you save.'
                    : 'Change it to promote or move this person, e.g. Associate → Manager.'
              }
            >
              <Dropdown
                id="emp-edit-role"
                value={editRoleId}
                disabled={hasSeveralRoles || roleOptions.length === 0}
                placeholder={roles.data ? (hasSeveralRoles ? 'Several roles' : 'No role yet') : 'Loading…'}
                onChange={(id) => {
                  setPickedRoleId(id)
                  setReportsTo(null)
                  setErrors((e) => ({ ...e, rmgId: undefined }))
                }}
                options={systemRoles.map((r) => ({ value: String(r.id), label: r.name }))}
              />
            </Field>
            {roleChanged && toCode === 'ADMIN' && (
              <p className="text-xs text-amber-700 sm:col-span-2 dark:text-amber-300">
                Admins don’t report to anyone, so the current reporting line is removed.
              </p>
            )}
            {needsLead && (
              <div className="sm:col-span-2">
                <PersonPicker
                  id="emp-edit-reports-to"
                  label={toCode === 'RMG' ? 'Reports to (Admin)' : 'Reports to (RMG)'}
                  role={toCode === 'RMG' ? 'ADMIN' : 'RMG'}
                  roleLabel={toCode === 'RMG' ? 'Admin' : 'RMG'}
                  value={reportsTo}
                  onChange={(person) => {
                    setReportsTo(person)
                    setErrors((e) => ({ ...e, rmgId: undefined }))
                  }}
                  blocker={(person) =>
                    person.id === employee?.id
                      ? 'Someone can’t report to themselves.'
                      : person.employmentStatus !== 'ACTIVE'
                        ? `${person.firstName} ${person.lastName} is inactive.`
                        : null
                  }
                  error={errors.rmgId}
                />
                <p className="mt-2 text-xs text-ink-500 dark:text-slate-500">
                  {employee?.rmgName
                    ? `Currently reports to ${employee.rmgName}. Leave this empty to keep them there, or choose someone else.`
                    : 'They have no one above them yet, so choose who they report to.'}
                </p>
              </div>
            )}
          </>
        )}
        {mode === 'create' && (
          <>
            <Field label="Role" htmlFor="emp-role" hint="Optional — add more on the User roles page">
              <Dropdown
                id="emp-role"
                value={form.roleId}
                onChange={(roleId) => {
                  set('roleId')(roleId)
                  // The reporting person is a different kind of person for an RMG, so start that choice over.
                  setReportsTo(null)
                  set('rmgId')('')
                  setErrors((e) => ({ ...e, rmgId: undefined }))
                }}
                options={[{ value: '', label: 'No role yet' }, ...roleOptions.map((r) => ({ value: String(r.id), label: r.name }))]}
              />
            </Field>
            {newRmg ? (
              <div className="sm:col-span-2">
                <PersonPicker
                  id="emp-reports-to"
                  label="Reports to (Admin)"
                  role="ADMIN"
                  roleLabel="Admin"
                  value={reportsTo}
                  onChange={(person) => {
                    setReportsTo(person)
                    setErrors((e) => ({ ...e, rmgId: undefined }))
                  }}
                  blocker={(person) =>
                    person.employmentStatus !== 'ACTIVE' ? `${person.firstName} ${person.lastName} is inactive.` : null
                  }
                  error={errors.rmgId}
                />
                <p className="mt-3 text-xs text-ink-500 dark:text-slate-500">
                  RMGs report to an Admin, not to another RMG.
                </p>
              </div>
            ) : (
            <Field
              label="RMG"
              htmlFor="emp-rmg"
              required={!newAdmin}
              error={errors.rmgId}
              hint={newAdmin ? 'Not needed — Admins don’t report to an RMG.' : 'Who this person reports to. Change it later with “Assign RMG”.'}
            >
              <Dropdown
                id="emp-rmg"
                value={newAdmin ? '' : form.rmgId}
                onChange={set('rmgId')}
                disabled={newAdmin}
                invalid={!!errors.rmgId}
                placeholder={newAdmin ? 'Not required for Admins' : rmgs.data ? 'Select RMG…' : 'Loading RMGs…'}
                emptyText="No RMGs yet — give someone the RMG role first"
                options={rmgOptions.map((r) => ({
                  value: String(r.rmgId),
                  label: `${r.rmgName} (${r.employeeId})`,
                  hint: `${r.associateCount} associate${r.associateCount === 1 ? '' : 's'}`,
                }))}
              />
            </Field>
            )}
          </>
        )}
      </FormSection>

      {mode === 'create' && (
        <FormSection title="Sign-in account">
          <Field label="Employee ID" htmlFor="emp-id" required error={errors.employeeId} hint="Used to sign in, e.g. EMP007">
            <Input id="emp-id" {...bind('employeeId')} placeholder="EMP007" autoComplete="off" />
          </Field>
          <PasswordField value={form.password} error={errors.password} onChange={set('password')} />
        </FormSection>
      )}
    </form>
  )
}

/** Create (employee === null) or edit drawer. The form body mounts only while open, so it always starts fresh. */
export default function EmployeeFormDrawer({
  open,
  employee,
  onClose,
  onSaved,
}: {
  open: boolean
  employee: EmployeeDTO | null
  onClose: () => void
  onSaved: (saved: EmployeeDTO) => void
}) {
  const [saving, setSaving] = useState(false)
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={employee ? 'Edit employee' : 'Add employee'}
      subtitle={employee ? `${employee.firstName} ${employee.lastName} · ${employee.employeeId}` : 'Creates the profile and a sign-in account'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="employee-form"
            variant="primary"
            loading={saving}
            icon={employee ? undefined : <UserPlus className="h-4 w-4" />}
          >
            {employee ? 'Save changes' : 'Create employee'}
          </Button>
        </>
      }
    >
      {open && <FormBody employee={employee} onClose={onClose} onSaved={onSaved} onSaving={setSaving} />}
    </Drawer>
  )
}
