import { motion } from 'motion/react'
import { FolderPlus, RefreshCw } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { TILE_SURFACE, PanelError } from '../../../components/dashboard/Panel'
import { Button } from '../../../components/ui/form'
import { Pagination } from '../../../components/ui/Pagination'
import { useResource } from '../../../hooks/useResource'
import { useQuery } from '../../../hooks/useQuery'
import type { ProjectDTO, ProjectListFilters } from '../../../services/admin/project.service'
import { useAppDispatch } from '../../../store'
import type { ResourceKey } from '../../../store/resourceRegistry'
import { invalidateQueries } from '../../../store/queriesSlice'
import { loadResource } from '../../../store/resourcesSlice'
import { ChangeManagerDialog, StatusDialog } from './ProjectActionDialogs'
import ProjectFilters, { type ProjectFilterValues } from './ProjectFilters'
import ProjectFormDrawer from './ProjectFormDrawer'
import ProjectProfileDrawer from './ProjectProfileDrawer'
import ProjectTable, { type RowActions } from './ProjectTable'
import { SORT_KEYS, type SortKey } from './projectUi'

const DEFAULT_SIZE = 20
/** Cached dashboard numbers that change when a project is added, closed or handed to another manager. */
const STALE_AFTER_CHANGE: ResourceKey[] = ['admin/dashboard', 'admin/recent-activity']

/** `fromProfile`: the action was started from the profile drawer, so finishing or cancelling goes back to it. */
type Dialog =
  | { kind: 'profile'; project: ProjectDTO }
  | { kind: 'form'; project: ProjectDTO | null; fromProfile?: boolean }
  | { kind: 'manager'; project: ProjectDTO; fromProfile?: boolean }
  | { kind: 'status'; project: ProjectDTO; mode: 'close' | 'reopen'; fromProfile?: boolean }

function Stat({ label, value, tone }: { label: string; value?: number; tone?: string }) {
  return (
    <div className="flex items-baseline gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs shadow-sm dark:border-white/8 dark:bg-white/4 dark:shadow-none">
      <span className={`text-sm font-bold tabular-nums ${tone ?? 'text-ink-900 dark:text-white'}`}>{value ?? '–'}</span>
      <span className="text-ink-500 dark:text-slate-400">{label}</span>
    </div>
  )
}

export default function ProjectsPage() {
  const dispatch = useAppDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const [dialog, setDialog] = useState<Dialog | null>(null)

  const dashboard = useResource('admin/dashboard')

  // ---- URL state: filters, sorting and paging are shareable and survive navigation -----------------------------
  const filters: ProjectFilterValues = {
    q: searchParams.get('q') ?? '',
    status: searchParams.get('status') ?? '',
    claim: searchParams.get('claim') ?? '',
    mgr: searchParams.get('mgr') ?? '',
  }
  const page = Math.max(0, Number(searchParams.get('page') ?? 0) || 0)
  const size = Number(searchParams.get('size')) || DEFAULT_SIZE
  const sortParam = searchParams.get('sort') as SortKey | null
  const sortBy: SortKey = sortParam && SORT_KEYS.includes(sortParam) ? sortParam : 'projectName'
  const direction: 'ASC' | 'DESC' = searchParams.get('dir') === 'DESC' ? 'DESC' : 'ASC'

  const update = useCallback(
    (patch: Record<string, string | number | undefined>, resetPage = true) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(patch)) {
            if (value === undefined || value === '' || value === 0) next.delete(key)
            else next.set(key, String(value))
          }
          if (resetPage && !('page' in patch)) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const onFilterChange = useCallback(
    (patch: Partial<ProjectFilterValues>) => {
      const mapped: Record<string, string | undefined> = {}
      for (const [key, value] of Object.entries(patch)) mapped[key] = value
      update(mapped)
    },
    [update],
  )

  // ---- Data -------------------------------------------------------------------------------------------------
  const query = searchParams.toString()
  const request = useMemo<ProjectListFilters>(
    () => ({
      q: filters.q || undefined,
      status: filters.status || undefined,
      claimed: filters.claim ? filters.claim === 'true' : undefined,
      managerStatus: filters.mgr || undefined,
      page,
      size,
      sortBy,
      sortDirection: direction,
    }),
    // `query` already encodes every URL-derived value used above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query],
  )

  // Every search / filter / page combination is kept in the Redux store: revisiting it shows the stored list with
  // no request (the backend and database are on slow free tiers). Refresh or any change reloads it.
  const list = useQuery('projects', request)
  const data = list.data
  const loading = list.loading
  const error = data === null ? list.error : null

  // ---- Actions ----------------------------------------------------------------------------------------------
  /** Refresh button and after any change: reload this list (others reload when next opened) and the cached stats. */
  function afterChange() {
    dispatch(invalidateQueries('projects'))
    dispatch(invalidateQueries('projectTeam'))
    STALE_AFTER_CHANGE.forEach((key) => void dispatch(loadResource({ key, force: true })))
  }

  function onSaved(saved: ProjectDTO) {
    afterChange()
    // Back to the profile (with fresh data) when the change was started from it; otherwise just close.
    setDialog((d) => (d && d.kind !== 'profile' && d.fromProfile ? { kind: 'profile', project: saved } : null))
  }

  function closeDialog() {
    setDialog((d) => (d && d.kind !== 'profile' && d.fromProfile && d.project ? { kind: 'profile', project: d.project } : null))
  }

  const statusMode = (project: ProjectDTO): 'close' | 'reopen' => (project.status === 'ACTIVE' ? 'close' : 'reopen')

  const actions: RowActions = {
    onOpen: (project) => setDialog({ kind: 'profile', project }),
    onEdit: (project) => setDialog({ kind: 'form', project }),
    onChangeManager: (project) => setDialog({ kind: 'manager', project }),
    onToggleStatus: (project) => setDialog({ kind: 'status', project, mode: statusMode(project) }),
  }

  const profileActions = {
    onEdit: (project: ProjectDTO) => setDialog({ kind: 'form', project, fromProfile: true }),
    onChangeManager: (project: ProjectDTO) => setDialog({ kind: 'manager', project, fromProfile: true }),
    onToggleStatus: (project: ProjectDTO) =>
      setDialog({ kind: 'status', project, mode: statusMode(project), fromProfile: true }),
  }

  function toggleSort(field: SortKey) {
    if (sortBy === field) update({ sort: field, dir: direction === 'ASC' ? 'DESC' : 'ASC' })
    else update({ sort: field, dir: 'ASC' })
  }

  const d = dashboard.data
  const closed = d ? d.totalProjects - d.activeProjects : undefined
  const empty = data !== null && data.content.length === 0
  const filtered = Object.values(filters).some(Boolean)

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl dark:text-white">Projects</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-slate-400">Every project in the organization — add, edit, change its manager or close it.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Stat label="total" value={d?.totalProjects} />
            <Stat label="active" value={d?.activeProjects} tone="text-brand-600 dark:text-brand-400" />
            <Stat label="closed" value={closed} />
            {d && d.pendingManagerReplacements > 0 && (
              <Link
                to="/admin/projects?mgr=INACTIVE"
                title="Show the projects whose manager is inactive"
                className="flex items-baseline gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/8 px-3.5 py-1.5 text-xs text-rose-700 transition-colors hover:bg-rose-500/15 dark:text-rose-300"
              >
                <span className="text-sm font-bold tabular-nums">{d.pendingManagerReplacements}</span>
                {d.pendingManagerReplacements === 1 ? 'needs a new manager' : 'need a new manager'}
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            aria-label="Refresh projects"
            disabled={loading}
            onClick={afterChange}
            icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button variant="primary" icon={<FolderPlus className="h-4 w-4" />} onClick={() => setDialog({ kind: 'form', project: null })}>
            Add project
          </Button>
        </div>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className={`${TILE_SURFACE} overflow-hidden`}
      >
        <ProjectFilters values={filters} onChange={onFilterChange} onClear={() => setSearchParams({}, { replace: true })} />

        {error ? (
          <PanelError message={error} status={null} onRetry={afterChange} />
        ) : empty ? (
          <div className="flex flex-col items-center gap-3 border-t border-slate-100 px-6 py-16 text-center dark:border-white/6">
            <p className="text-base font-semibold text-ink-900 dark:text-white">
              {filtered ? 'No projects match your search' : 'No projects yet'}
            </p>
            <p className="max-w-sm text-sm text-ink-500 dark:text-slate-400">
              {filtered ? 'Try a different name, client or manager, or clear the filters.' : 'Add the first project to get started.'}
            </p>
            {filtered ? (
              <Button onClick={() => setSearchParams({}, { replace: true })}>Clear filters</Button>
            ) : (
              <Button variant="primary" onClick={() => setDialog({ kind: 'form', project: null })}>
                Add project
              </Button>
            )}
          </div>
        ) : (
          <>
            <ProjectTable
              rows={data?.content ?? null}
              loading={loading}
              sortBy={sortBy}
              direction={direction}
              onSort={toggleSort}
              actions={actions}
            />
            {data && (
              <Pagination
                page={data.number}
                size={data.size}
                totalElements={data.totalElements}
                totalPages={data.totalPages}
                onPage={(p) => update({ page: p }, false)}
                onSize={(s) => update({ size: s === DEFAULT_SIZE ? undefined : s })}
              />
            )}
          </>
        )}
      </motion.section>

      <ProjectProfileDrawer
        project={dialog?.kind === 'profile' ? dialog.project : null}
        actions={profileActions}
        onClose={() => setDialog(null)}
      />
      <ProjectFormDrawer
        open={dialog?.kind === 'form'}
        project={dialog?.kind === 'form' ? dialog.project : null}
        onClose={closeDialog}
        onSaved={onSaved}
      />
      <ChangeManagerDialog
        project={dialog?.kind === 'manager' ? dialog.project : null}
        onClose={closeDialog}
        onSaved={onSaved}
      />
      <StatusDialog
        project={dialog?.kind === 'status' ? dialog.project : null}
        mode={dialog?.kind === 'status' ? dialog.mode : 'close'}
        onClose={closeDialog}
        onSaved={onSaved}
      />
    </div>
  )
}
