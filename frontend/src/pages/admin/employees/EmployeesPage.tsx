import { motion } from 'motion/react'
import { RefreshCw, UserPlus } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TILE_SURFACE, PanelError } from '../../../components/dashboard/Panel'
import { Button } from '../../../components/ui/form'
import { Pagination } from '../../../components/ui/Pagination'
import { useResource } from '../../../hooks/useResource'
import { useQuery } from '../../../hooks/useQuery'
import type { EmployeeDTO, EmployeeListFilters } from '../../../services/admin/employee.service'
import { useAppDispatch } from '../../../store'
import type { ResourceKey } from '../../../store/resourceRegistry'
import { invalidateQueries } from '../../../store/queriesSlice'
import { loadResource } from '../../../store/resourcesSlice'
import { SORT_KEYS, type SortKey } from './employeeUi'
import { AssignRmgDialog, StatusDialog } from './EmployeeActionDialogs'
import EmployeeFilters, { type EmployeeFilterValues } from './EmployeeFilters'
import EmployeeFormDrawer from './EmployeeFormDrawer'
import EmployeeProfileDrawer from './EmployeeProfileDrawer'
import EmployeeTable, { type RowActions } from './EmployeeTable'

const DEFAULT_SIZE = 20
/** Cached dashboard / roster numbers that change when someone is added, deactivated or moved. */
const STALE_AFTER_CHANGE: ResourceKey[] = ['admin/dashboard', 'admin/rmg-roster', 'admin/lookups', 'admin/recent-activity']

/** `fromProfile`: the action was started from the profile drawer, so finishing or cancelling goes back to it. */
type Dialog =
  | { kind: 'profile'; employee: EmployeeDTO }
  | { kind: 'form'; employee: EmployeeDTO | null; fromProfile?: boolean }
  | { kind: 'rmg'; employee: EmployeeDTO; fromProfile?: boolean }
  | { kind: 'status'; employee: EmployeeDTO; mode: 'deactivate' | 'reactivate'; fromProfile?: boolean }

function Stat({ label, value, tone }: { label: string; value?: number; tone?: string }) {
  return (
    <div className="flex items-baseline gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs shadow-sm dark:border-white/8 dark:bg-white/4 dark:shadow-none">
      <span className={`text-sm font-bold tabular-nums ${tone ?? 'text-ink-900 dark:text-white'}`}>{value ?? '–'}</span>
      <span className="text-ink-500 dark:text-slate-400">{label}</span>
    </div>
  )
}

export default function EmployeesPage() {
  const dispatch = useAppDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const [dialog, setDialog] = useState<Dialog | null>(null)

  const dashboard = useResource('admin/dashboard')
  const lookups = useResource('admin/lookups')

  // ---- URL state: filters, sorting and paging are shareable and survive navigation -----------------------------
  const filters: EmployeeFilterValues = {
    q: searchParams.get('q') ?? '',
    status: searchParams.get('status') ?? '',
    dept: searchParams.get('dept') ?? '',
    loc: searchParams.get('loc') ?? '',
    role: searchParams.get('role') ?? '',
    wf: searchParams.get('wf') ?? '',
  }
  const page = Math.max(0, Number(searchParams.get('page') ?? 0) || 0)
  const size = Number(searchParams.get('size')) || DEFAULT_SIZE
  const sortParam = searchParams.get('sort') as SortKey | null
  const sortBy: SortKey = sortParam && SORT_KEYS.includes(sortParam) ? sortParam : 'firstName'
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
    (patch: Partial<EmployeeFilterValues>) => {
      const mapped: Record<string, string | undefined> = {}
      for (const [key, value] of Object.entries(patch)) mapped[key] = value
      update(mapped)
    },
    [update],
  )

  // ---- Data -------------------------------------------------------------------------------------------------
  const query = searchParams.toString()
  const request = useMemo<EmployeeListFilters>(
    () => ({
      q: filters.q || undefined,
      status: filters.status || undefined,
      departmentId: filters.dept ? Number(filters.dept) : undefined,
      locationId: filters.loc ? Number(filters.loc) : undefined,
      role: filters.role || undefined,
      workforce: filters.wf || undefined,
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
  const list = useQuery('employees', request)
  const data = list.data
  const loading = list.loading
  const error = data === null ? list.error : null

  // ---- Actions ----------------------------------------------------------------------------------------------
  /** Refresh button and after any change: reload this list (others reload when next opened) and the cached stats. */
  function afterChange() {
    dispatch(invalidateQueries('employees'))
    dispatch(invalidateQueries('employeeProjects'))
    STALE_AFTER_CHANGE.forEach((key) => void dispatch(loadResource({ key, force: true })))
  }

  function onSaved(saved: EmployeeDTO) {
    afterChange()
    // Back to the profile (with fresh data) when the change was started from it; otherwise just close.
    setDialog((d) => (d && d.kind !== 'profile' && d.fromProfile ? { kind: 'profile', employee: saved } : null))
  }

  function closeDialog() {
    setDialog((d) => (d && d.kind !== 'profile' && d.fromProfile && d.employee ? { kind: 'profile', employee: d.employee } : null))
  }

  const statusMode = (employee: EmployeeDTO): 'deactivate' | 'reactivate' =>
    employee.employmentStatus === 'ACTIVE' ? 'deactivate' : 'reactivate'

  const actions: RowActions = {
    onOpen: (employee) => setDialog({ kind: 'profile', employee }),
    onEdit: (employee) => setDialog({ kind: 'form', employee }),
    onAssignRmg: (employee) => setDialog({ kind: 'rmg', employee }),
    onToggleStatus: (employee) => setDialog({ kind: 'status', employee, mode: statusMode(employee) }),
  }

  const profileActions = {
    onEdit: (employee: EmployeeDTO) => setDialog({ kind: 'form', employee, fromProfile: true }),
    onAssignRmg: (employee: EmployeeDTO) => setDialog({ kind: 'rmg', employee, fromProfile: true }),
    onToggleStatus: (employee: EmployeeDTO) =>
      setDialog({ kind: 'status', employee, mode: statusMode(employee), fromProfile: true }),
  }

  function toggleSort(field: SortKey) {
    if (sortBy === field) update({ sort: field, dir: direction === 'ASC' ? 'DESC' : 'ASC' })
    else update({ sort: field, dir: 'ASC' })
  }

  const d = dashboard.data
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
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl dark:text-white">Employees</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-slate-400">Everyone in the organization — add, edit, move between RMGs or deactivate.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Stat label="total" value={d?.totalEmployees} />
            <Stat label="active" value={d?.activeEmployees} tone="text-brand-600 dark:text-brand-400" />
            <Stat label="inactive" value={d?.inactiveEmployees} tone="text-rose-600 dark:text-rose-400" />
            <Stat label={d?.totalRmgs === 1 ? 'RMG' : 'RMGs'} value={d?.totalRmgs} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            aria-label="Refresh employees"
            disabled={loading}
            onClick={afterChange}
            icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button variant="primary" icon={<UserPlus className="h-4 w-4" />} onClick={() => setDialog({ kind: 'form', employee: null })}>
            Add employee
          </Button>
        </div>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className={`${TILE_SURFACE} overflow-hidden`}
      >
        <EmployeeFilters
          values={filters}
          lookups={lookups.data}
          onChange={onFilterChange}
          onClear={() => setSearchParams({}, { replace: true })}
        />

        {error ? (
          <PanelError message={error} status={null} onRetry={afterChange} />
        ) : empty ? (
          <div className="flex flex-col items-center gap-3 border-t border-slate-100 px-6 py-16 text-center dark:border-white/6">
            <p className="text-base font-semibold text-ink-900 dark:text-white">
              {filtered ? 'No employees match your search' : 'No employees yet'}
            </p>
            <p className="max-w-sm text-sm text-ink-500 dark:text-slate-400">
              {filtered ? 'Try a different name or ID, or clear the filters.' : 'Add the first employee to get started.'}
            </p>
            {filtered ? (
              <Button onClick={() => setSearchParams({}, { replace: true })}>Clear filters</Button>
            ) : (
              <Button variant="primary" onClick={() => setDialog({ kind: 'form', employee: null })}>
                Add employee
              </Button>
            )}
          </div>
        ) : (
          <>
            <EmployeeTable
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

      <EmployeeProfileDrawer
        employee={dialog?.kind === 'profile' ? dialog.employee : null}
        actions={profileActions}
        onClose={() => setDialog(null)}
      />
      <EmployeeFormDrawer
        open={dialog?.kind === 'form'}
        employee={dialog?.kind === 'form' ? dialog.employee : null}
        onClose={closeDialog}
        onSaved={onSaved}
      />
      <AssignRmgDialog
        employee={dialog?.kind === 'rmg' ? dialog.employee : null}
        onClose={closeDialog}
        onSaved={onSaved}
      />
      <StatusDialog
        employee={dialog?.kind === 'status' ? dialog.employee : null}
        mode={dialog?.kind === 'status' ? dialog.mode : 'deactivate'}
        onClose={closeDialog}
        onSaved={onSaved}
      />
    </div>
  )
}
