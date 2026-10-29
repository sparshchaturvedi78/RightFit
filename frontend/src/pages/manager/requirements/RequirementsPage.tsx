import { motion } from 'motion/react'
import { ChevronRight, ClipboardList, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../../components/dashboard/Panel'
import { Button } from '../../../components/ui/form'
import { Dropdown } from '../../../components/ui/Dropdown'
import RefreshButton from '../../../components/ui/RefreshButton'
import { useQuery } from '../../../hooks/useQuery'
import { useResource } from '../../../hooks/useResource'
import type { RequirementCardDTO } from '../../../services/manager/dashboard.service'
import { useAppDispatch } from '../../../store'
import { invalidateQueries } from '../../../store/queriesSlice'
import { projectGradient, projectInitials } from '../../admin/projects/projectUi'
import ManagerLink from '../ManagerLink'
import { matchesReqFilter, REQ_FILTERS, type ReqFilter } from '../managerUi'
import NewRequirementPanel from '../projects/NewRequirementPanel'
import RequirementRow from '../RequirementRow'

/** Short line under each status tile. */
const TILE_NOTE: Record<ReqFilter, string> = {
  open: 'Draft, published or on hold',
  DRAFT: 'Not published yet',
  PUBLISHED: 'Hiring now',
  ON_HOLD: 'Paused',
  closed: 'Closed or cancelled',
}

/** Every requirement across the manager's projects, grouped by project. Pick a status, search, or narrow to one project. */
export default function RequirementsPage() {
  const dispatch = useAppDispatch()
  const [params, setParams] = useSearchParams()
  const projects = useResource('manager/projects')
  const dashboard = useResource('manager/dashboard')
  const all = useQuery('managerAllRequirements', {})
  const [creating, setCreating] = useState(false)

  const asked = params.get('status')
  const status: ReqFilter = REQ_FILTERS.some((f) => f.value === asked) ? (asked as ReqFilter) : 'open'
  const projectId = params.get('project') ?? ''
  const q = params.get('q') ?? ''
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

  const cards = useMemo(() => all.data ?? [], [all.data])
  const claimed = projects.data?.claimed ?? []
  const text = q.trim().toLowerCase()
  const inScope = cards.filter(
    (r) => (!projectId || r.projectId === projectId) && (!text || [r.requirementId, r.positionTitle, r.projectName].some((v) => v?.toLowerCase().includes(text))),
  )
  const shown = inScope.filter((r) => matchesReqFilter(r.status, status))

  // One group per project, by name.
  const byProject = new Map<string, RequirementCardDTO[]>()
  for (const r of shown) byProject.set(r.projectId, [...(byProject.get(r.projectId) ?? []), r])
  const groups = [...byProject.entries()]
    .map(([id, rows]) => ({ id, name: rows[0].projectName, rows, project: claimed.find((p) => p.projectId === id) }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const refreshing = all.loading || projects.loading

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-ink-500 uppercase dark:text-slate-400">Hiring</p>
          <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">Requirements</h1>
          <p className="mt-1 max-w-[62ch] text-sm text-ink-500 dark:text-slate-400">Every requirement on your projects, where its candidates are, and who handles it.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RefreshButton
            onClick={() => {
              dispatch(invalidateQueries('managerAllRequirements'))
              projects.reload()
              dashboard.reload()
            }}
            loading={refreshing}
          />
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)} disabled={claimed.length === 0} title={claimed.length === 0 ? 'Claim a project first' : undefined}>
            New requirement
          </Button>
        </div>
      </motion.header>

      {/* Status tiles: each shows how many there are, and is the filter */}
      <div role="group" aria-label="Status" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {REQ_FILTERS.map((f) => {
          const on = status === f.value
          const n = all.data ? inScope.filter((r) => matchesReqFilter(r.status, f.value)).length : undefined
          return (
            <button
              key={f.value}
              type="button"
              aria-pressed={on}
              onClick={() => set({ status: f.value === 'open' ? undefined : f.value })}
              className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                on
                  ? 'border-brand-500/40 bg-brand-500/10 shadow-sm'
                  : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-white/8 dark:bg-white/3 dark:hover:border-white/15'
              }`}
            >
              <span className={`block text-xs font-semibold ${on ? 'text-brand-700 dark:text-brand-400' : 'text-ink-500 dark:text-slate-400'}`}>{f.label}</span>
              <span className="mt-0.5 block text-2xl font-extrabold tracking-tight text-ink-900 tabular-nums dark:text-white">{n ?? '–'}</span>
              <span className="block truncate text-[11px] text-ink-500 dark:text-slate-400">{TILE_NOTE[f.value]}</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-60 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 sm:max-w-md dark:border-white/10 dark:bg-white/5">
          <Search className="h-4 w-4 shrink-0 text-ink-500 dark:text-slate-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Search by ID, title or project"
            aria-label="Search requirements"
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
        {all.data && (
          <span className="ml-auto text-xs text-ink-500 tabular-nums dark:text-slate-400">
            {shown.length} of {cards.length} requirement{cards.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {all.error && !all.data ? (
        <section className={`${TILE_SURFACE} p-5`}>
          <PanelError message={all.error} status={all.status} onRetry={all.refresh} />
        </section>
      ) : !all.data ? (
        <div className="grid gap-4">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-48 rounded-3xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <section className={`${TILE_SURFACE} px-6 py-12`}>
          <EmptyState icon={<ClipboardList className="h-5 w-5" />}>
            {cards.length === 0 ? 'No requirements yet. Create one from a project you manage.' : 'No requirement matches these filters.'}
          </EmptyState>
        </section>
      ) : (
        <div className="grid gap-4">
          {groups.map((g) => (
            <section key={g.id} className={`${TILE_SURFACE} overflow-hidden`} aria-label={g.name}>
              <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-white/6">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-xs font-bold text-white ${projectGradient(g.project?.id ?? 0)}`}>
                    {projectInitials(g.name)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-ink-900 dark:text-white">{g.name}</h2>
                    <p className="text-xs text-ink-500 dark:text-slate-400">
                      {g.id} · {g.rows.length} requirement{g.rows.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <ManagerLink to={`/manager/projects/${g.id}`} className="flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400" hoverClassName="hover:underline">
                  Open project <ChevronRight className="h-3.5 w-3.5" />
                </ManagerLink>
              </header>
              <div className="grid grid-cols-[minmax(0,1fr)] divide-y divide-slate-100 px-2 py-1 sm:px-3 dark:divide-white/6">
                {g.rows.map((r) => (
                  <RequirementRow key={r.requirementId} r={r} showProject={false} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <NewRequirementPanel
        open={creating}
        onClose={() => setCreating(false)}
        projects={claimed}
        initialProjectId={projectId || undefined}
        onCreated={() => {
          dispatch(invalidateQueries('managerAllRequirements'))
          dispatch(invalidateQueries('managerProjectRequirements'))
          dashboard.reload()
        }}
      />
    </div>
  )
}
