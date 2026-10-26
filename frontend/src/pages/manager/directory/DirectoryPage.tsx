import { motion } from 'motion/react'
import { Search, UserPlus, Users, X } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../../components/dashboard/Panel'
import { Dropdown } from '../../../components/ui/Dropdown'
import { Button, Field, Input } from '../../../components/ui/form'
import RefreshButton from '../../../components/ui/RefreshButton'
import { useQuery } from '../../../hooks/useQuery'
import type { CandidateSearchFilters, EmployeeCandidateDTO } from '../../../services/manager/employee.service'
import { initialsOf, humanize } from '../../../utils/format'
import AddToRequirementDialog from './AddToRequirementDialog'
import DirectoryProfile from './DirectoryProfile'

const PAGE = 25

const LEVELS = Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: `Level ${i + 1} and above` }))

const SORTS: { value: NonNullable<CandidateSearchFilters['sortBy']>; label: string }[] = [
  { value: 'employeeId', label: 'Employee ID' },
  { value: 'firstName', label: 'Name' },
  { value: 'yearsOfExperience', label: 'Experience' },
  { value: 'grade', label: 'Grade' },
]

/** Filter keys in the URL, so a search can be shared or reloaded. `show` is how many rows are loaded so far. */
const FILTER_KEYS = ['skill', 'level', 'free', 'location', 'minExp', 'grade', 'domain', 'cert'] as const

function num(value: string | null): number | undefined {
  return value ? Number(value) : undefined
}

/** Everyone in the company who is not on the manager's own projects, filtered for finding people for a requirement. */
/** `manager` for the People directory; `sourcer` for an associate who sources (adds people to their own requirements). */
export default function DirectoryPage({ source = 'manager' }: { source?: 'manager' | 'sourcer' }) {
  const [params, setParams] = useSearchParams()
  const [skillText, setSkillText] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState<{ employeeId: string; name: string } | null>(null)

  const q = params.get('q') ?? ''
  const skills = params.getAll('skill')
  const show = Number(params.get('show') ?? PAGE) || PAGE
  const sort = params.get('sort') ?? 'employeeId'
  const direction = params.get('dir') === 'DESC' ? 'DESC' : 'ASC'
  const freeOnly = params.get('free') === '1'

  const set = (patch: Record<string, string | string[] | undefined>, resetShow = true) =>
    setParams(
      (cur) => {
        const n = new URLSearchParams(cur)
        for (const [k, v] of Object.entries(patch)) {
          n.delete(k)
          if (Array.isArray(v)) v.forEach((x) => n.append(k, x))
          else if (v) n.set(k, v)
        }
        if (resetShow) n.delete('show')
        return n
      },
      { replace: true },
    )

  const filters: CandidateSearchFilters = {
    q: q.trim() || undefined,
    skills: skills.length ? skills : undefined,
    minProficiency: num(params.get('level')),
    availableOnly: freeOnly || undefined,
    location: params.get('location') || undefined,
    minExperience: num(params.get('minExp')),
    grade: params.get('grade') || undefined,
    domain: params.get('domain') || undefined,
    certification: params.get('cert') || undefined,
    excludeMyTeam: true,
    forSourcing: source === 'sourcer' ? true : undefined,
    sortBy: sort as CandidateSearchFilters['sortBy'],
    sortDirection: direction,
    page: 0,
    size: show,
  }

  const dir = useQuery('managerDirectory', filters)
  const rows = dir.data?.content ?? []
  const total = dir.data?.totalElements ?? 0
  const activeCount = FILTER_KEYS.filter((k) => params.has(k)).length + (freeOnly ? 1 : 0)

  function addSkill() {
    const name = skillText.trim()
    if (!name) return
    if (!skills.some((s) => s.toLowerCase() === name.toLowerCase())) set({ skill: [...skills, name] })
    setSkillText('')
  }

  function clearFilters() {
    set(Object.fromEntries(FILTER_KEYS.map((k) => [k, undefined])))
  }

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-ink-500 uppercase dark:text-slate-400">Projects &amp; people</p>
          <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">Employee directory</h1>
          <p className="mt-1 max-w-[62ch] text-sm text-ink-500 dark:text-slate-400">
            Find people outside your projects by skill, location and availability, then add them to one of your live requirements.
          </p>
        </div>
        <RefreshButton onClick={dir.refresh} loading={dir.loading} />
      </motion.header>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-60 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 sm:max-w-md dark:border-white/10 dark:bg-white/5">
          <Search className="h-4 w-4 shrink-0 text-ink-500 dark:text-slate-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => set({ q: e.target.value || undefined })}
            placeholder="Name, ID or email"
            aria-label="Search employees"
            className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-ink-500/60 dark:placeholder:text-slate-500"
          />
        </label>
        <div className="w-56 max-w-full">
          <Dropdown
            ariaLabel="Sort by"
            value={sort}
            onChange={(v) => set({ sort: v || undefined })}
            options={SORTS.map((s) => ({ value: s.value, label: `Sort: ${s.label}` }))}
          />
        </div>
        {dir.data && (
          <span className="ml-auto text-xs text-ink-500 tabular-nums dark:text-slate-400">
            {total} {total === 1 ? 'person' : 'people'} match
          </span>
        )}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-5">
        <aside
          aria-label="Filters"
          className={`${TILE_SURFACE} grid gap-5 p-5 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto`}
        >
          <div className="flex items-center justify-between">
            <b className="text-[15px] font-semibold text-ink-900 dark:text-white">Filters</b>
            {activeCount > 0 && (
              <button type="button" onClick={clearFilters} className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">
                Clear all
              </button>
            )}
          </div>

          <section className="grid gap-2.5" aria-label="Skills">
            <h3 className="text-[11px] font-bold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-400">Skills</h3>
            <div className="flex gap-2">
              <Input
                value={skillText}
                onChange={(e) => setSkillText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSkill()
                  }
                }}
                placeholder="For example, Java"
                aria-label="Skill to add"
              />
              <Button variant="secondary" onClick={addSkill} disabled={!skillText.trim()}>
                Add
              </Button>
            </div>
            {skills.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <li key={s}>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/12 py-1 pr-1 pl-2.5 text-xs font-semibold text-brand-700 dark:text-brand-300">
                      {s}
                      <button
                        type="button"
                        onClick={() => set({ skill: skills.filter((x) => x !== s) }, true)}
                        aria-label={`Remove ${s}`}
                        className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Field label="Minimum level for each skill" htmlFor="dir-level">
              <Dropdown
                id="dir-level"
                ariaLabel="Minimum level"
                value={params.get('level') ?? ''}
                onChange={(v) => set({ level: v || undefined })}
                placeholder="Any level"
                options={[{ value: '', label: 'Any level' }, ...LEVELS]}
              />
            </Field>
          </section>

          <section className="grid gap-2.5" aria-label="Availability">
            <h3 className="text-[11px] font-bold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-400">Availability</h3>
            <button
              type="button"
              aria-pressed={freeOnly}
              onClick={() => set({ free: freeOnly ? undefined : '1' })}
              className="flex items-center gap-3 text-left text-sm text-ink-900 dark:text-white"
            >
              <span
                className={`flex h-4.5 w-4.5 items-center justify-center rounded-md border ${
                  freeOnly ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 dark:border-white/20'
                }`}
              >
                {freeOnly && <span className="text-[10px] font-bold">✓</span>}
              </span>
              Available now
            </button>
          </section>

          <section className="grid gap-2.5" aria-label="Location">
            <h3 className="text-[11px] font-bold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-400">Location</h3>
            <Input
              value={params.get('location') ?? ''}
              onChange={(e) => set({ location: e.target.value || undefined })}
              placeholder="For example, Bangalore"
              aria-label="Location"
            />
          </section>

          <section className="grid gap-2.5" aria-label="Experience">
            <h3 className="text-[11px] font-bold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-400">Years of experience</h3>
            <Field label="At least" htmlFor="dir-exp">
              <Input
                id="dir-exp"
                type="number"
                min={0}
                step={0.5}
                value={params.get('minExp') ?? ''}
                onChange={(e) => set({ minExp: e.target.value || undefined })}
                placeholder="For example, 3"
              />
            </Field>
          </section>

          <section className="grid gap-2.5" aria-label="Grade, domain and certification">
            <h3 className="text-[11px] font-bold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-400">Grade, domain, certification</h3>
            <Input value={params.get('grade') ?? ''} onChange={(e) => set({ grade: e.target.value || undefined })} placeholder="Grade, e.g. L3" aria-label="Grade" />
            <Input value={params.get('domain') ?? ''} onChange={(e) => set({ domain: e.target.value || undefined })} placeholder="Domain, e.g. Backend" aria-label="Domain" />
            <Input value={params.get('cert') ?? ''} onChange={(e) => set({ cert: e.target.value || undefined })} placeholder="Certification" aria-label="Certification" />
          </section>
        </aside>

        <section className={`${TILE_SURFACE} min-w-0`} aria-label="Results">
          {dir.error && !dir.data ? (
            <div className="p-5">
              <PanelError message={dir.error} status={dir.status} onRetry={dir.refresh} />
            </div>
          ) : !dir.data ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="px-6 py-12">
              <EmptyState icon={<Users className="h-5 w-5" />}>
                {activeCount > 0 || q ? 'No one matches these filters. Try removing a skill or widening the experience range.' : 'No one outside your projects is available to search yet.'}
              </EmptyState>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/6" aria-busy={dir.loading}>
              {rows.map((p) => (
                <DirectoryRow key={p.employeeId} person={p} highlight={skills} onOpen={() => setOpenId(p.employeeId)} onAdd={() => setAdding({ employeeId: p.employeeId, name: p.name })} />
              ))}
            </ul>
          )}

          {dir.data && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5 text-xs text-ink-500 dark:border-white/6 dark:text-slate-400">
              <span className="tabular-nums">
                Showing {rows.length} of {total}
              </span>
              {rows.length < total && (
                <Button variant="secondary" onClick={() => set({ show: String(show + PAGE) }, false)} loading={dir.loading}>
                  Show {Math.min(PAGE, total - rows.length)} more
                </Button>
              )}
            </div>
          )}
        </section>
      </div>

      {openId && (
        <DirectoryProfile
          employeeId={openId}
          onClose={() => setOpenId(null)}
          onAdd={(p) => setAdding({ employeeId: p.employeeId, name: p.name })}
        />
      )}

      {adding && <AddToRequirementDialog source={source} person={adding} onClose={() => setAdding(null)} />}
    </div>
  )
}

function DirectoryRow({
  person,
  highlight,
  onOpen,
  onAdd,
}: {
  person: EmployeeCandidateDTO
  highlight: string[]
  onOpen: () => void
  onAdd: () => void
}) {
  const wanted = new Set(highlight.map((s) => s.toLowerCase()))
  const shown = (person.skills ?? []).slice(0, 4)
  const free = person.availabilityStatus === 'AVAILABLE'
  return (
    <li className="grid gap-3 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
      <button type="button" onClick={onOpen} className="flex min-w-0 items-start gap-3 text-left" aria-label={`Open ${person.name}`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-400 to-emerald-700 text-xs font-bold text-white">
          {initialsOf(person.name.split(' ')[0], person.name.split(' ')[1])}
        </span>
        <span className="min-w-0">
          <b className="block truncate text-sm font-semibold text-ink-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400">{person.name}</b>
          <small className="block truncate text-xs text-ink-500 dark:text-slate-400">
            {[person.employeeId, person.designation, person.grade].filter(Boolean).join(' · ')}
          </small>
          <small className="block truncate text-xs text-ink-500 dark:text-slate-400">
            {[person.location, person.yearsOfExperience != null ? `${person.yearsOfExperience} yrs` : null].filter(Boolean).join(' · ')}
          </small>
          {shown.length > 0 && (
            <span className="mt-1.5 flex flex-wrap gap-1.5">
              {shown.map((s) => (
                <span
                  key={s.skill}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    wanted.has(s.skill.toLowerCase())
                      ? 'bg-brand-500/12 text-brand-700 dark:text-brand-300'
                      : 'bg-slate-100 text-ink-700 dark:bg-white/8 dark:text-slate-300'
                  }`}
                >
                  {s.skill}
                  {s.proficiency != null && <span className="ml-1 opacity-70">{s.proficiency}</span>}
                </span>
              ))}
            </span>
          )}
        </span>
      </button>
      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            free ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 text-ink-700 dark:bg-white/8 dark:text-slate-300'
          }`}
        >
          {person.availabilityStatus ? humanize(person.availabilityStatus) : 'Status unknown'}
        </span>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-ink-900 hover:border-brand-500/40 hover:text-brand-600 dark:border-white/10 dark:text-white dark:hover:text-brand-400"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Add to requirement
        </button>
      </div>
    </li>
  )
}
