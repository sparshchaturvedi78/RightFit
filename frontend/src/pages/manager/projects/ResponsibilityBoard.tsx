import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Dropdown } from '../../../components/ui/Dropdown'
import { FormError } from '../../../components/ui/form'
import { getApiErrorMessage } from '../../../services/httpClient'
import { managerProjectService, type ResponsibilityDirectoryDTO } from '../../../services/manager/project.service'
import { initialsOf } from '../../../utils/format'
import type { PickedPerson } from './ResponsibilityPicker'

type RoleType = 'SOURCER' | 'INTERVIEWER' | 'COORDINATOR'
export type RoleValue = Record<RoleType, PickedPerson[]>

const ROLES: { type: RoleType; label: string; letter: string; badge: string; chip: string }[] = [
  { type: 'SOURCER', label: 'Sourcer', letter: 'S', badge: 'bg-sky-500/15 text-sky-700 dark:text-sky-300', chip: 'border-sky-500/30' },
  { type: 'INTERVIEWER', label: 'Interviewer', letter: 'I', badge: 'bg-violet-500/15 text-violet-700 dark:text-violet-300', chip: 'border-violet-500/30' },
  { type: 'COORDINATOR', label: 'Coordinator', letter: 'C', badge: 'bg-brand-500/15 text-brand-700 dark:text-brand-400', chip: 'border-brand-500/30' },
]

/** "2 sourcing · 1 interviewing", or "Free" when they hold no responsibility yet. */
function busy(p: ResponsibilityDirectoryDTO): string {
  const w = p.workload
  const parts = [
    w.sourcer ? `${w.sourcer} sourcing` : null,
    w.interviewer ? `${w.interviewer} interviewing` : null,
    w.coordinator ? `${w.coordinator} coordinating` : null,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'Free'
}

/**
 * One place to choose who sources, interviews and coordinates. The project's team is loaded once and shared by all
 * three roles: pick a person, then the role(s) to give them. Each role's people are listed under it, and can be removed.
 */
export default function ResponsibilityBoard({
  projectId,
  value,
  onChange,
  disabled = false,
}: {
  projectId: string
  value: RoleValue
  onChange: (type: RoleType, next: PickedPerson[]) => void
  disabled?: boolean
}) {
  const [people, setPeople] = useState<ResponsibilityDirectoryDTO[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [picked, setPicked] = useState('')

  useEffect(() => {
    let live = true
    managerProjectService
      .responsibilityCandidates(projectId, { size: 200 })
      .then((page) => {
        if (live) setPeople(page.content)
      })
      .catch((err) => {
        if (live) setError(getApiErrorMessage(err, 'Couldn’t load the team.'))
      })
    return () => {
      live = false
    }
  }, [projectId])

  const person = people?.find((p) => p.employeeId === picked)
  const options = (people ?? []).map((p) => ({ value: p.employeeId, label: p.name, hint: `${p.employeeId} · ${busy(p)}` }))

  function add(type: RoleType) {
    if (!person || value[type].some((x) => x.employeeId === person.employeeId)) return
    onChange(type, [...value[type], { employeeId: person.employeeId, name: person.name }])
    setPicked('')
  }

  return (
    <div className="grid gap-4">
      <FormError message={error} />

      {!disabled && (
        <div className="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 dark:border-white/8 dark:bg-white/3">
          <Dropdown
            ariaLabel="Choose someone from the team"
            value={picked}
            onChange={setPicked}
            disabled={people === null}
            placeholder={people === null ? 'Loading the team…' : 'Choose someone from the team'}
            emptyText="Nobody on the team yet"
            options={options}
          />
          {person && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-ink-500 dark:text-slate-400">Give {person.name}</span>
              {ROLES.map((r) => {
                const has = value[r.type].some((x) => x.employeeId === person.employeeId)
                return (
                  <button
                    key={r.type}
                    type="button"
                    onClick={() => add(r.type)}
                    disabled={has}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-ink-700 transition-colors hover:border-brand-500/40 hover:text-brand-600 disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:text-brand-400"
                  >
                    {has ? `${r.label} already` : `as ${r.label.toLowerCase()}`}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-2.5">
        {ROLES.map((r) => (
          <div key={r.type} className="flex flex-wrap items-center gap-2">
            <span className="flex w-28 items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-extrabold ${r.badge}`}>{r.letter}</span>
              <span className="text-xs font-semibold text-ink-700 dark:text-slate-300">{r.label}</span>
            </span>
            {value[r.type].length === 0 ? (
              <span className="text-xs text-ink-500 dark:text-slate-400">Nobody yet</span>
            ) : (
              value[r.type].map((p) => (
                <span
                  key={p.employeeId}
                  className={`inline-flex items-center gap-2 rounded-full border bg-white py-0.5 pr-1.5 pl-0.5 text-xs font-semibold text-ink-900 dark:bg-white/5 dark:text-white ${r.chip}`}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-linear-to-br from-brand-400 to-emerald-700 text-[9px] font-bold text-white">
                    {initialsOf(p.name.split(' ')[0], p.name.split(' ')[1])}
                  </span>
                  {p.name}
                  {!disabled && (
                    <button
                      type="button"
                      aria-label={`Remove ${p.name} as ${r.label}`}
                      onClick={() => onChange(r.type, value[r.type].filter((x) => x.employeeId !== p.employeeId))}
                      className="rounded-full p-0.5 text-ink-500 hover:bg-slate-100 hover:text-ink-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
