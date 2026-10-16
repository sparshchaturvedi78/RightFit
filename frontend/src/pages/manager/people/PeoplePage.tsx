import { motion } from 'motion/react'
import { Search, Users } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../../components/dashboard/Panel'
import { Dropdown } from '../../../components/ui/Dropdown'
import { Button } from '../../../components/ui/form'
import RefreshButton from '../../../components/ui/RefreshButton'
import { useQuery } from '../../../hooks/useQuery'
import { useResource } from '../../../hooks/useResource'
import type { PersonDTO } from '../../../services/manager/team.service'
import { useAppDispatch } from '../../../store'
import { invalidateQueries } from '../../../store/queriesSlice'
import { initialsOf } from '../../../utils/format'
import CapacityBar from './CapacityBar'
import EmployeeDrawer from './EmployeeDrawer'
import LinkToProjectDialog from './LinkToProjectDialog'

/** Everyone on the manager's projects in one place: where each person works, how full their day is, and a way to link them to more projects. */
export default function PeoplePage() {
  const dispatch = useAppDispatch()
  const [params, setParams] = useSearchParams()
  const projects = useResource('manager/projects')
  const dashboard = useResource('manager/dashboard')
  const people = useQuery('managerPeople', {})
  const [open, setOpen] = useState<string | null>(null)
  const [linking, setLinking] = useState<string | null>(null)

  const q = params.get('q') ?? ''
  const projectId = params.get('project') ?? ''
  const freeOnly = params.get('free') === '1'
  const set = (patch: Record<string, string | undefined>) =>
    setParams(
      (cur) => {
        const n = new URLSearchParams(cur)
        for (const [k, v] of Object.entries(patch)) {
          if (v) n.set(k, v)
          else n.delete(k)
        }
        return n
      },
      { replace: true },
    )

  const claimed = projects.data?.claimed ?? []
  const all = people.data ?? []
  const text = q.trim().toLowerCase()
  const shown = all.filter(
    (p: PersonDTO) =>
      (!projectId || p.projects.some((x) => x.projectId === projectId)) &&
      (!freeOnly || (p.availableHoursPerDay ?? 0) > 0) &&
      (!text || [p.name, p.employeeId, p.designation].some((v) => v?.toLowerCase().includes(text))),
  )

  function changed() {
    dispatch(invalidateQueries('managerProjectTeam'))
    dispatch(invalidateQueries('managerPeople'))
    dashboard.reload()
  }

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-ink-500 uppercase dark:text-slate-400">Projects &amp; people</p>
          <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">My people</h1>
          <p className="mt-1 max-w-[62ch] text-sm text-ink-500 dark:text-slate-400">
            Everyone on your projects. Open a person to see their details, link them to another project or move them.
          </p>
        </div>
        <RefreshButton
          onClick={() => {
            people.refresh()
            projects.reload()
            dashboard.reload()
          }}
          loading={people.loading || projects.loading}
        />
      </motion.header>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-60 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 sm:max-w-md dark:border-white/10 dark:bg-white/5">
          <Search className="h-4 w-4 shrink-0 text-ink-500 dark:text-slate-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Search by name, ID or title"
            aria-label="Search people"
            className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-ink-500/60 dark:placeholder:text-slate-500"
          />
        </label>
        <div className="w-64 max-w-full">
          <Dropdown
            ariaLabel="Project"
            value={projectId}
            onChange={(v) => set({ project: v || undefined })}
            options={[{ value: '', label: 'All projects' }, ...claimed.map((p) => ({ value: p.projectId, label: p.projectName, hint: p.projectId }))]}
          />
        </div>
        <button
          type="button"
          aria-pressed={freeOnly}
          onClick={() => set({ free: freeOnly ? undefined : '1' })}
          className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
            freeOnly ? 'border-brand-500/30 bg-brand-500/12 text-brand-600 dark:text-brand-400' : 'border-slate-200 text-ink-500 hover:text-ink-900 dark:border-white/10 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          Has free time
        </button>
        {people.data && (
          <span className="ml-auto text-xs text-ink-500 tabular-nums dark:text-slate-400">
            {shown.length} of {all.length} {all.length === 1 ? 'person' : 'people'}
          </span>
        )}
      </div>

      <section className={`${TILE_SURFACE} p-2 sm:p-3`} aria-label="People">
        {people.error && !people.data ? (
          <PanelError message={people.error} status={people.status} onRetry={people.refresh} />
        ) : !people.data ? (
          <div className="space-y-2 p-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="px-6 py-10">
            <EmptyState icon={<Users className="h-5 w-5" />}>
              {all.length === 0 ? 'Nobody is on your projects yet. People join through allocation requests the RMG approves.' : 'No one matches these filters.'}
            </EmptyState>
          </div>
        ) : (
          <ul className="grid grid-cols-[minmax(0,1fr)] divide-y divide-slate-100 dark:divide-white/6">
            {shown.map((p) => (
              <li key={p.employeeId} className="grid items-center gap-x-6 gap-y-3 px-3 py-3.5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.5fr)_minmax(0,1fr)_auto]">
                <button type="button" onClick={() => setOpen(p.employeeId)} className="flex min-w-0 items-center gap-3 text-left" aria-label={`Open ${p.name}`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand-400 to-emerald-700 text-xs font-bold text-white">
                    {initialsOf(p.name.split(' ')[0], p.name.split(' ')[1])}
                  </span>
                  <span className="min-w-0">
                    <b className="block truncate text-sm font-semibold text-ink-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400">{p.name}</b>
                    <small className="block truncate text-xs text-ink-500 dark:text-slate-400">{[p.employeeId, p.designation].filter(Boolean).join(' · ')}</small>
                  </span>
                </button>
                <div className="flex flex-wrap gap-1.5">
                  {p.projects.map((x) => (
                    <span key={x.projectId} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-ink-700 dark:bg-white/8 dark:text-slate-300">
                      {x.projectName}
                      {x.hoursPerDay != null && <span className="ml-1.5 font-medium text-ink-500 dark:text-slate-400">{x.hoursPerDay} h</span>}
                    </span>
                  ))}
                </div>
                <CapacityBar working={p.workingHoursPerDay} booked={p.allocatedHoursPerDay} />
                <Button variant="secondary" className="px-3 py-1.5" onClick={() => setLinking(p.employeeId)} disabled={p.projects.length >= claimed.length} title={p.projects.length >= claimed.length ? 'They are on all your projects already' : undefined}>
                  Add to project
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <EmployeeDrawer employeeId={open} onClose={() => setOpen(null)} projects={claimed} onChanged={changed} />
      <LinkToProjectDialog open={linking !== null} onClose={() => setLinking(null)} people={all} projects={claimed} employeeId={linking ?? undefined} onDone={changed} />
    </div>
  )
}
