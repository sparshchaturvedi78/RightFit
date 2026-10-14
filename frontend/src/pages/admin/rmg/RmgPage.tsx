import { motion } from 'motion/react'
import { RefreshCw } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TILE_SURFACE, PanelError } from '../../../components/dashboard/Panel'
import { Button } from '../../../components/ui/form'
import { Pagination } from '../../../components/ui/Pagination'
import { useQuery } from '../../../hooks/useQuery'
import type { EmployeeDTO } from '../../../services/admin/employee.service'
import type { RmgDetailDTO, RmgListFilters, RmgTeamMember } from '../../../services/admin/rmg.service'
import { useAppDispatch } from '../../../store'
import { invalidateQueries } from '../../../store/queriesSlice'
import type { ResourceKey } from '../../../store/resourceRegistry'
import { loadResource } from '../../../store/resourcesSlice'
import { AssignRmgDialog } from '../employees/EmployeeActionDialogs'
import RmgFilters, { type RmgFilterValues } from './RmgFilters'
import RmgProfileDrawer from './RmgProfileDrawer'
import RmgTable from './RmgTable'
import { SORT_KEYS, type SortKey } from './rmgUi'

const DEFAULT_SIZE = 20
/** Cached dashboard numbers that change when someone moves to another RMG. */
const STALE_AFTER_CHANGE: ResourceKey[] = ['admin/rmg-roster', 'admin/recent-activity']

type Dialog = { kind: 'profile'; rmg: RmgDetailDTO } | { kind: 'move'; member: RmgTeamMember; rmg: RmgDetailDTO }

/** The Assign RMG dialog works on an employee; a team row has everything it reads. */
function asEmployee(m: RmgTeamMember, rmg: RmgDetailDTO): EmployeeDTO {
  return {
    id: m.id,
    employeeId: m.employeeId,
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email,
    designation: m.designation ?? '',
    grade: m.grade,
    rmgId: rmg.rmgId,
    rmgName: rmg.rmgName,
    rmgEmployeeId: rmg.employeeId,
    employmentStatus: 'ACTIVE',
    allocationStatus: '',
    availabilityStatus: '',
  }
}

function Stat({ label, value, tone }: { label: string; value?: number; tone?: string }) {
  return (
    <div className="flex items-baseline gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs shadow-sm dark:border-white/8 dark:bg-white/4 dark:shadow-none">
      <span className={`text-sm font-bold tabular-nums ${tone ?? 'text-ink-900 dark:text-white'}`}>{value ?? '–'}</span>
      <span className="text-ink-500 dark:text-slate-400">{label}</span>
    </div>
  )
}

export default function RmgPage() {
  const dispatch = useAppDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const [dialog, setDialog] = useState<Dialog | null>(null)

  // ---- URL state: filters, sorting and paging are shareable and survive navigation -----------------------------
  const filters: RmgFilterValues = {
    q: searchParams.get('q') ?? '',
    status: searchParams.get('status') ?? '',
    team: searchParams.get('team') ?? '',
  }
  const page = Math.max(0, Number(searchParams.get('page') ?? 0) || 0)
  const size = Number(searchParams.get('size')) || DEFAULT_SIZE
  const sortParam = searchParams.get('sort') as SortKey | null
  const sortBy: SortKey = sortParam && SORT_KEYS.includes(sortParam) ? sortParam : 'name'
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

  // ---- Data -------------------------------------------------------------------------------------------------
  const query = searchParams.toString()
  const request = useMemo<RmgListFilters>(
    () => ({
      q: filters.q || undefined,
      status: filters.status || undefined,
      team: filters.team || undefined,
      page,
      size,
      sortBy,
      sortDirection: direction,
    }),
    // `query` already encodes every URL-derived value used above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query],
  )

  // Kept in the Redux store per search / filter / page: revisiting shows the stored list with no request.
  const list = useQuery('rmgs', request)
  const data = list.data
  const loading = list.loading
  const error = data === null ? list.error : null

  // ---- Actions ----------------------------------------------------------------------------------------------
  function afterChange() {
    dispatch(invalidateQueries('rmgs'))
    dispatch(invalidateQueries('rmgTeam'))
    STALE_AFTER_CHANGE.forEach((key) => void dispatch(loadResource({ key, force: true })))
  }

  function onMoved() {
    afterChange()
    // Someone's RMG changed: the Employees lists and profiles are stale too.
    dispatch(invalidateQueries('employees'))
    setDialog((d) => (d?.kind === 'move' ? { kind: 'profile', rmg: d.rmg } : null))
  }

  function toggleSort(field: SortKey) {
    if (sortBy === field) update({ sort: field, dir: direction === 'ASC' ? 'DESC' : 'ASC' })
    // Team size reads best biggest-first.
    else update({ sort: field, dir: field === 'associateCount' ? 'DESC' : 'ASC' })
  }

  // The open RMG follows the freshest list data, so its numbers update after a move.
  const open = dialog?.kind === 'profile' ? (data?.content.find((r) => r.rmgId === dialog.rmg.rmgId) ?? dialog.rmg) : null

  const empty = data !== null && data.content.length === 0
  const filtered = Object.values(filters).some(Boolean)
  const avg = data && data.activeRmgs ? Math.round(data.associatesCovered / data.activeRmgs) : undefined

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl dark:text-white">RMG</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-slate-400">
            Resource managers, how many people report to each and where those people are right now.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Stat label="RMGs" value={data?.totalRmgs} />
            <Stat label="active" value={data?.activeRmgs} tone="text-brand-600 dark:text-brand-400" />
            <Stat label="associates covered" value={data?.associatesCovered} />
            <Stat label="per RMG on average" value={avg} />
            {data && data.needReplacement > 0 && (
              <button
                type="button"
                onClick={() => setSearchParams({ status: 'INACTIVE', team: 'WITH' }, { replace: true })}
                title="Show the inactive RMGs people still report to"
                className="flex items-baseline gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/8 px-3.5 py-1.5 text-xs text-rose-700 transition-colors hover:bg-rose-500/15 dark:text-rose-300"
              >
                <span className="text-sm font-bold tabular-nums">{data.needReplacement}</span>
                inactive {data.needReplacement === 1 ? 'RMG still has' : 'RMGs still have'} associates
              </button>
            )}
          </div>
        </div>
        <Button
          variant="secondary"
          aria-label="Refresh RMGs"
          disabled={loading}
          onClick={afterChange}
          icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
        >
          Refresh
        </Button>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className={`${TILE_SURFACE} overflow-hidden`}
      >
        <RmgFilters
          values={filters}
          onChange={(patch) => update({ ...patch })}
          onClear={() => setSearchParams({}, { replace: true })}
        />

        {error ? (
          <PanelError message={error} status={null} onRetry={afterChange} />
        ) : empty ? (
          <div className="flex flex-col items-center gap-3 border-t border-slate-100 px-6 py-16 text-center dark:border-white/6">
            <p className="text-base font-semibold text-ink-900 dark:text-white">
              {filtered ? 'No RMGs match your search' : 'No RMGs yet'}
            </p>
            <p className="max-w-sm text-sm text-ink-500 dark:text-slate-400">
              {filtered
                ? 'Try a different name or ID, or clear the filters.'
                : 'Give someone the RMG role from Employees → Edit to see them here.'}
            </p>
            {filtered && <Button onClick={() => setSearchParams({}, { replace: true })}>Clear filters</Button>}
          </div>
        ) : (
          <>
            <RmgTable
              rows={data?.content ?? null}
              loading={loading}
              sortBy={sortBy}
              direction={direction}
              onSort={toggleSort}
              onOpen={(rmg) => setDialog({ kind: 'profile', rmg })}
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

      <RmgProfileDrawer
        rmg={open}
        onMove={(member, rmg) => setDialog({ kind: 'move', member, rmg })}
        onClose={() => setDialog(null)}
      />
      <AssignRmgDialog
        employee={dialog?.kind === 'move' ? asEmployee(dialog.member, dialog.rmg) : null}
        onClose={() => setDialog((d) => (d?.kind === 'move' ? { kind: 'profile', rmg: d.rmg } : null))}
        onSaved={onMoved}
      />
    </div>
  )
}
