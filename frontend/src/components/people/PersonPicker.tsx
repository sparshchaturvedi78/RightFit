import { CheckCircle2, Search, TriangleAlert, UserX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Field, Input } from '../ui/form'
import { adminEmployeeService, type EmployeeDTO } from '../../services/admin/employee.service'
import { getApiErrorMessage } from '../../services/httpClient'
import { avatarGradient, fullName, hasRole } from '../../pages/admin/employees/employeeUi'
import { initialsOf } from '../../utils/format'

/** How many matches the name search shows at once. */
const SUGGESTION_LIMIT = 6

type Lookup = { kind: 'idle' } | { kind: 'searching' } | { kind: 'error'; message: string }

/**
 * Pick one employee: type an employee ID and press Find (a wrong ID says "Employee not found"), or type a name
 * and choose from at most 6 server-side matches. Used for choosing a project's manager.
 */
export default function PersonPicker({
  id,
  label,
  role,
  roleLabel,
  value,
  onChange,
  blocker,
  error,
}: {
  id: string
  label: string
  /** Backend role code the name search is limited to, e.g. MANAGER. */
  role: string
  /** Human name for that role, e.g. "Manager". */
  roleLabel: string
  value: EmployeeDTO | null
  onChange: (person: EmployeeDTO | null) => void
  /** Return a reason to refuse this person (shown in red); null to accept. */
  blocker?: (person: EmployeeDTO) => string | null
  error?: string | null
}) {
  const [query, setQuery] = useState(value?.employeeId ?? '')
  const [lookup, setLookup] = useState<Lookup>({ kind: 'idle' })
  const [suggest, setSuggest] = useState<{ term: string; items: EmployeeDTO[]; total: number } | null>(null)

  const term = query.trim()
  const showSuggestions = !value && lookup.kind === 'idle' && term.length >= 2

  // Search active people of that role on the server as the admin types (a page of matches, never the whole list).
  useEffect(() => {
    if (!showSuggestions) return
    const timer = setTimeout(() => {
      adminEmployeeService
        .list({ q: term, role, status: 'ACTIVE', size: SUGGESTION_LIMIT, sortBy: 'firstName' })
        .then((page) => setSuggest({ term, items: page.content, total: page.totalElements }))
        .catch(() => setSuggest({ term, items: [], total: 0 }))
    }, 250)
    return () => clearTimeout(timer)
  }, [term, role, showSuggestions])

  const matches = suggest && suggest.term === term ? suggest.items : null

  async function find(raw: string) {
    const employeeId = raw.trim().toUpperCase()
    setQuery(employeeId)
    if (!employeeId) {
      setLookup({ kind: 'error', message: 'Enter an employee ID, e.g. EMP003' })
      return
    }
    setLookup({ kind: 'searching' })
    try {
      onChange(await adminEmployeeService.byId(employeeId))
      setLookup({ kind: 'idle' })
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status
      const message = getApiErrorMessage(err, '')
      setLookup({
        kind: 'error',
        message:
          status === 404 || /not found/i.test(message)
            ? `Employee not found — no one has the ID ${employeeId}.`
            : message || "Couldn't look that ID up. Please try again.",
      })
    }
  }

  const refused = value ? (blocker?.(value) ?? null) : null
  const missingRole = value && !refused && !hasRole(value, roleLabel)

  return (
    <div className="space-y-3">
      <Field label={label} htmlFor={id} required error={error}>
        <div className="flex gap-2">
          <Input
            id={id}
            autoComplete="off"
            value={query}
            placeholder="Employee ID (EMP003) or start typing a name"
            onChange={(e) => {
              setQuery(e.target.value)
              if (value) onChange(null)
              if (lookup.kind !== 'idle') setLookup({ kind: 'idle' })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void find(query)
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            loading={lookup.kind === 'searching'}
            icon={<Search className="h-4 w-4" />}
            onClick={() => void find(query)}
            className="shrink-0"
          >
            Find
          </Button>
        </div>
      </Field>

      {showSuggestions && (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
          {matches === null ? (
            <p className="px-3 py-2.5 text-xs text-ink-500 dark:text-slate-400">Searching {roleLabel}s…</p>
          ) : matches.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-ink-500 dark:text-slate-400">
              No active {roleLabel} matches “{term}”. Press Find to look up an exact employee ID.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/6">
              {matches.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(p.employeeId)
                      onChange(p)
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

      {lookup.kind === 'error' && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/8 px-3.5 py-2.5 text-sm text-rose-700 dark:text-rose-300"
        >
          <UserX className="h-4 w-4 shrink-0" />
          {lookup.message}
        </p>
      )}

      {value && (
        <div
          className={`flex items-center gap-3 rounded-2xl border p-3 ${
            refused ? 'border-rose-500/25 bg-rose-500/6' : 'border-brand-500/25 bg-brand-500/6'
          }`}
        >
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${avatarGradient(value.id)} text-xs font-bold text-white`}
          >
            {initialsOf(value.firstName, value.lastName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{fullName(value)}</p>
            <p className="truncate text-xs text-ink-500 dark:text-slate-400">
              {value.employeeId} · {value.designation}
              {value.departmentName ? ` · ${value.departmentName}` : ''}
            </p>
          </div>
          {!refused && <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />}
        </div>
      )}
      {refused && <p className="text-sm text-rose-600 dark:text-rose-400">{refused}</p>}
      {missingRole && (
        <p className="flex gap-2 text-sm text-amber-700 dark:text-amber-300">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {fullName(value)} doesn’t have the {roleLabel} role yet. You can still choose them; add the role later under
          User roles.
        </p>
      )}
    </div>
  )
}
