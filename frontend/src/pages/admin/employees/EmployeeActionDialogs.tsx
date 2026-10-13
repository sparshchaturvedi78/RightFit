import { CheckCircle2, Search, TriangleAlert, UserX } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Button, Field, FormError, Input, Textarea } from '../../../components/ui/form'
import { Modal } from '../../../components/ui/Overlay'
import { useToast } from '../../../hooks/useToast'
import { adminEmployeeService, type EmployeeDTO } from '../../../services/admin/employee.service'
import { getApiErrorMessage } from '../../../services/httpClient'
import { initialsOf } from '../../../utils/format'
import { avatarGradient, fullName, hasRole, isLeadershipRole } from './employeeUi'

type Saved = (saved: EmployeeDTO) => void

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function StatusForm({
  employee,
  mode,
  onClose,
  onSaved,
}: {
  employee: EmployeeDTO
  mode: 'deactivate' | 'reactivate'
  onClose: () => void
  onSaved: Saved
}) {
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [effectiveDate, setEffectiveDate] = useState(todayISO)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const deactivating = mode === 'deactivate'
  const leadership = deactivating && (employee.roles ?? []).some(isLeadershipRole)

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
      const saved = deactivating
        ? await adminEmployeeService.deactivate(employee.employeeId, payload)
        : await adminEmployeeService.reactivate(employee.employeeId, payload)
      toast.success(deactivating ? 'Employee deactivated' : 'Employee reactivated', fullName(saved))
      onSaved(saved)
    } catch (err) {
      setError(getApiErrorMessage(err, `Could not ${mode} this employee.`))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <p className="text-sm text-ink-500 dark:text-slate-400">
        {deactivating
          ? `${fullName(employee)} will lose access to RightFit and stop appearing in active lists.`
          : `${fullName(employee)} will be able to sign in again and appear in active lists.`}
      </p>

      {leadership && (
        <div className="flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/8 p-3.5 text-sm text-amber-800 dark:text-amber-200">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {fullName(employee)} is a {(employee.roles ?? []).filter(isLeadershipRole).join(' / ')}. People or projects
            that depend on them will need a replacement — handle that under Assignment Replacement afterwards.
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
          placeholder={deactivating ? 'e.g. Resigned — last working day 30 Oct' : 'e.g. Rejoined after sabbatical'}
        />
      </Field>
      <Field label="Effective date" htmlFor="status-date" hint="Optional — defaults to today">
        <Input id="status-date" type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
      </Field>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant={deactivating ? 'danger' : 'primary'} loading={saving}>
          {deactivating ? 'Deactivate' : 'Reactivate'}
        </Button>
      </div>
    </form>
  )
}

export function StatusDialog({
  employee,
  mode,
  onClose,
  onSaved,
}: {
  employee: EmployeeDTO | null
  mode: 'deactivate' | 'reactivate'
  onClose: () => void
  onSaved: Saved
}) {
  return (
    <Modal
      open={employee !== null}
      onClose={onClose}
      title={mode === 'deactivate' ? 'Deactivate employee' : 'Reactivate employee'}
      subtitle={employee ? `${fullName(employee)} · ${employee.employeeId}` : undefined}
    >
      {employee && <StatusForm key={employee.id + mode} employee={employee} mode={mode} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  )
}

/** How many RMG matches the search shows at once. */
const SUGGESTION_LIMIT = 6

type Lookup =
  | { state: 'idle' }
  | { state: 'searching' }
  | { state: 'found'; person: EmployeeDTO }
  | { state: 'error'; message: string }

function RmgForm({ employee, onClose, onSaved }: { employee: EmployeeDTO; onClose: () => void; onSaved: Saved }) {
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [lookup, setLookup] = useState<Lookup>({ state: 'idle' })
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [suggest, setSuggest] = useState<{ term: string; items: EmployeeDTO[]; total: number } | null>(null)

  // Search active RMGs on the server as the admin types (a page of matches, never the whole list).
  const term = query.trim()
  useEffect(() => {
    if (term.length < 2 || lookup.state !== 'idle') return
    const timer = setTimeout(() => {
      adminEmployeeService
        .list({ q: term, role: 'RMG', status: 'ACTIVE', size: SUGGESTION_LIMIT, sortBy: 'firstName' })
        .then((page) => setSuggest({ term, items: page.content, total: page.totalElements }))
        .catch(() => setSuggest({ term, items: [], total: 0 }))
    }, 250)
    return () => clearTimeout(timer)
  }, [term, lookup.state])

  const matches =
    suggest && suggest.term === term
      ? suggest.items.filter((p) => p.employeeId !== employee.employeeId && p.id !== employee.rmgId)
      : null
  const showSuggestions = lookup.state === 'idle' && term.length >= 2

  async function find(id: string) {
    const employeeId = id.trim().toUpperCase()
    setQuery(employeeId)
    setError(null)
    if (!employeeId) {
      setLookup({ state: 'error', message: 'Enter an employee ID, e.g. EMP002' })
      return
    }
    setLookup({ state: 'searching' })
    try {
      const person = await adminEmployeeService.byId(employeeId)
      setLookup({ state: 'found', person })
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status
      const message = getApiErrorMessage(err, '')
      setLookup({
        state: 'error',
        message:
          status === 404 || /not found/i.test(message)
            ? `Employee not found — no one has the ID ${employeeId}.`
            : message || "Couldn't look that ID up. Please try again.",
      })
    }
  }

  const person = lookup.state === 'found' ? lookup.person : null
  const blocker = !person
    ? null
    : person.employeeId === employee.employeeId
      ? 'Someone can’t be their own RMG.'
      : person.id === employee.rmgId
        ? `${fullName(employee)} already reports to ${fullName(person)}.`
        : person.employmentStatus !== 'ACTIVE'
          ? `${fullName(person)} is inactive and can’t be assigned as an RMG.`
          : null
  const notRmg = person && !blocker && !hasRole(person, 'RMG')

  async function submit(ev: FormEvent) {
    ev.preventDefault()
    if (!person || blocker) {
      setLookup((l) => (l.state === 'found' ? l : { state: 'error', message: 'Find the new RMG by employee ID first' }))
      return
    }
    setError(null)
    setSaving(true)
    try {
      const saved = await adminEmployeeService.changeRmg(employee.employeeId, {
        newRmgEmployeeId: person.employeeId,
        reason: reason.trim() || undefined,
      })
      toast.success('RMG updated', `${fullName(saved)} now reports to ${fullName(person)}`)
      onSaved(saved)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not change the RMG.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <p className="text-sm text-ink-500 dark:text-slate-400">
        Currently reports to{' '}
        <span className="font-semibold text-ink-900 dark:text-white">{employee.rmgName ?? 'nobody'}</span>.
      </p>
      <FormError message={error} />

      <Field label="New RMG’s employee ID" htmlFor="rmg-id" required>
        <div className="flex gap-2">
          <Input
            id="rmg-id"
            autoFocus
            autoComplete="off"
            value={query}
            placeholder="e.g. EMP002"
            onChange={(e) => {
              setQuery(e.target.value)
              if (lookup.state !== 'idle') setLookup({ state: 'idle' })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void find(query)
              }
            }}
            className="uppercase placeholder:normal-case"
          />
          <Button
            type="button"
            variant="secondary"
            loading={lookup.state === 'searching'}
            icon={<Search className="h-4 w-4" />}
            onClick={() => void find(query)}
            className="shrink-0"
          >
            Find
          </Button>
        </div>
      </Field>

      {lookup.state === 'idle' && term.length < 2 && (
        <p className="-mt-2 text-xs text-ink-500 dark:text-slate-500">
          Type an employee ID and press Find, or start typing an RMG’s name to search.
        </p>
      )}
      {showSuggestions && (
        <div className="-mt-2 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
          {matches === null ? (
            <p className="px-3 py-2.5 text-xs text-ink-500 dark:text-slate-400">Searching RMGs…</p>
          ) : matches.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-ink-500 dark:text-slate-400">
              No active RMG matches “{term}”. Press Find to look up an exact employee ID.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/6">
              {matches.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(p.employeeId)
                      setError(null)
                      setLookup({ state: 'found', person: p })
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br ${avatarGradient(p.id)} text-[11px] font-bold text-white`}
                    >
                      {initialsOf(p.firstName, p.lastName)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink-900 dark:text-white">{fullName(p)}</span>
                      <span className="block truncate text-xs text-ink-500 dark:text-slate-400">
                        {p.employeeId} · {p.designation}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              {suggest && suggest.total > SUGGESTION_LIMIT && (
                <li className="px-3 py-2 text-[11px] text-ink-500 dark:text-slate-500">
                  Showing {SUGGESTION_LIMIT} of {suggest.total} matches — keep typing to narrow it down.
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {lookup.state === 'error' && (
        <p role="alert" className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/8 px-3.5 py-2.5 text-sm text-rose-700 dark:text-rose-300">
          <UserX className="h-4 w-4 shrink-0" />
          {lookup.message}
        </p>
      )}

      {person && (
        <div
          className={`flex items-center gap-3 rounded-2xl border p-3 ${
            blocker
              ? 'border-rose-500/25 bg-rose-500/6'
              : 'border-brand-500/25 bg-brand-500/6'
          }`}
        >
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${avatarGradient(person.id)} text-xs font-bold text-white`}
          >
            {initialsOf(person.firstName, person.lastName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{fullName(person)}</p>
            <p className="truncate text-xs text-ink-500 dark:text-slate-400">
              {person.employeeId} · {person.designation}
              {person.departmentName ? ` · ${person.departmentName}` : ''}
            </p>
          </div>
          {!blocker && <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />}
        </div>
      )}
      {blocker && <p className="-mt-2 text-sm text-rose-600 dark:text-rose-400">{blocker}</p>}
      {notRmg && (
        <p className="-mt-2 flex gap-2 text-sm text-amber-700 dark:text-amber-300">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {fullName(person)} doesn’t have the RMG role yet. You can still assign them; add the role later under User roles.
        </p>
      )}

      <Field label="Reason" htmlFor="rmg-reason" hint="Optional — kept in the audit log">
        <Textarea id="rmg-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-3 pt-1">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={saving} disabled={!person || !!blocker}>
          Assign RMG
        </Button>
      </div>
    </form>
  )
}

export function AssignRmgDialog({
  employee,
  onClose,
  onSaved,
}: {
  employee: EmployeeDTO | null
  onClose: () => void
  onSaved: Saved
}) {
  return (
    <Modal
      open={employee !== null}
      onClose={onClose}
      title="Assign RMG"
      subtitle={employee ? `${fullName(employee)} · ${employee.employeeId}` : undefined}
    >
      {employee && <RmgForm key={employee.id} employee={employee} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  )
}
