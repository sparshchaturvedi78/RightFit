import { Search, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { getApiErrorMessage } from '../../../services/httpClient'
import { managerProjectService, type ResponsibilityDirectoryDTO } from '../../../services/manager/project.service'
import { initialsOf } from '../../../utils/format'

export interface PickedPerson {
  employeeId: string
  name: string
}

export type ResponsibilityKind = 'sourcer' | 'interviewer' | 'coordinator'

const VERB: Record<ResponsibilityKind, string> = { sourcer: 'sourcing', interviewer: 'interviewing', coordinator: 'coordinating' }

/** How busy someone already is with this kind of responsibility, as a small pill. */
function load(p: ResponsibilityDirectoryDTO, kind: ResponsibilityKind): { text: string; cls: string } {
  const n = p.workload?.[kind] ?? 0
  if (n === 0) return { text: 'Free', cls: 'bg-slate-500/10 text-ink-500 dark:text-slate-400' }
  return {
    text: `${n} ${VERB[kind]}`,
    cls: n >= 4 ? 'bg-amber-500/14 text-amber-700 dark:text-amber-300' : 'bg-brand-500/12 text-brand-700 dark:text-brand-400',
  }
}

/**
 * Choose the people who hold one responsibility on a requirement. Type to search the project's people;
 * a few matches are shown with how busy each already is. More than one person can be picked.
 */
export default function ResponsibilityPicker({
  title,
  hint,
  kind,
  projectId,
  value,
  onChange,
  disabled = false,
}: {
  title: string
  hint: string
  kind: ResponsibilityKind
  projectId: string
  value: PickedPerson[]
  onChange: (next: PickedPerson[]) => void
  /** Show who holds it, but don't let them be changed (a closed requirement). */
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [matches, setMatches] = useState<{ rows: ResponsibilityDirectoryDTO[]; total: number } | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const latest = useRef(0)

  async function search(q: string) {
    setText(q)
    const ticket = ++latest.current
    setLoading(true)
    try {
      const page = await managerProjectService.responsibilityCandidates(projectId, { q: q.trim() || undefined, size: 6 })
      if (ticket !== latest.current) return
      setMatches({ rows: page.content, total: page.totalElements })
      setFailed(null)
    } catch (err) {
      if (ticket === latest.current) setFailed(getApiErrorMessage(err, 'Couldn’t load people.'))
    } finally {
      if (ticket === latest.current) setLoading(false)
    }
  }

  function show() {
    setOpen(true)
    if (!matches) void search('')
  }

  function pick(p: ResponsibilityDirectoryDTO) {
    if (!value.some((v) => v.employeeId === p.employeeId)) onChange([...value, { employeeId: p.employeeId, name: p.name }])
    setOpen(false)
    setText('')
  }

  const chosen = new Set(value.map((v) => v.employeeId))
  const rows = (matches?.rows ?? []).filter((r) => !chosen.has(r.employeeId))

  return (
    <div className={`grid gap-2.5 rounded-2xl border bg-white p-3.5 dark:bg-white/3 ${open ? 'border-brand-500/40' : 'border-slate-200/80 dark:border-white/8'}`}>
      <div className="flex items-baseline justify-between gap-3">
        <b className="text-[13px] font-semibold text-ink-900 dark:text-white">{title}</b>
        <small className="text-xs text-ink-500 dark:text-slate-400">{hint}</small>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {value.map((p) => (
          <span key={p.employeeId} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-0.5 pr-2.5 pl-0.5 text-[13px] font-semibold text-ink-900 dark:border-white/10 dark:bg-white/5 dark:text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-brand-400 to-emerald-700 text-[10px] font-bold text-white">
              {initialsOf(p.name.split(' ')[0], p.name.split(' ')[1])}
            </span>
            {p.name}
            {!disabled && (
              <button type="button" aria-label={`Remove ${p.name}`} onClick={() => onChange(value.filter((v) => v.employeeId !== p.employeeId))}>
                <X className="h-3.5 w-3.5 text-ink-500 dark:text-slate-400" />
              </button>
            )}
          </span>
        ))}
        {value.length === 0 && disabled && <span className="text-xs text-ink-500 dark:text-slate-400">Nobody</span>}
        {!open && !disabled && (
          <button
            type="button"
            onClick={show}
            className="rounded-full border border-dashed border-slate-300 px-3 py-1 text-xs font-semibold text-ink-500 hover:border-brand-500/50 hover:text-brand-600 dark:border-white/15 dark:text-slate-400"
          >
            + Add
          </button>
        )}
      </div>

      {open && (
        <div className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-white/10 dark:bg-ink-925">
          <div className="mb-1 flex items-center gap-2 border-b border-slate-100 px-2 py-1.5 dark:border-white/6">
            <Search className="h-4 w-4 text-ink-500 dark:text-slate-400" />
            <input
              autoFocus
              value={text}
              onChange={(e) => void search(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
              placeholder="Search by name or ID"
              aria-label={`Search for a ${kind}`}
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-500/60 dark:placeholder:text-slate-500"
            />
            <button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold text-ink-500 dark:text-slate-400">
              Close
            </button>
          </div>
          {loading && <p className="px-2 py-2 text-xs text-ink-500 dark:text-slate-400">Searching…</p>}
          {failed && <p className="px-2 py-2 text-xs text-rose-600 dark:text-rose-400">{failed}</p>}
          {!loading && !failed && matches && rows.length === 0 && <p className="px-2 py-2 text-xs text-ink-500 dark:text-slate-400">No one on this project matches.</p>}
          <ul role="listbox" aria-label={`People for ${title}`}>
            {rows.map((p) => {
              const l = load(p, kind)
              return (
                <li key={p.employeeId}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => pick(p)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-sky-400 to-sky-700 text-[11px] font-bold text-white">
                      {initialsOf(p.name.split(' ')[0], p.name.split(' ')[1])}
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-[13px] font-semibold text-ink-900 dark:text-white">{p.name}</b>
                      <small className="block truncate text-[11px] text-ink-500 dark:text-slate-400">{[p.employeeId, p.designation].filter(Boolean).join(' · ')}</small>
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${l.cls}`}>{l.text}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          {matches && matches.total > rows.length + chosen.size && (
            <p className="px-2 pt-1.5 pb-1 text-[11px] text-ink-500 dark:text-slate-500">
              Showing {rows.length} of {matches.total} people. Keep typing to narrow it down.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
