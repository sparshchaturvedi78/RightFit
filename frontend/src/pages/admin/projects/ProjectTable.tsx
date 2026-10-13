import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, RotateCcw, UserCog, XCircle } from 'lucide-react'
import { Badge } from '../../../components/ui/Badge'
import { Skeleton } from '../../../components/dashboard/Panel'
import type { ProjectDTO } from '../../../services/admin/project.service'
import { humanize } from '../../../utils/format'
import { formatDay } from '../employees/employeeUi'
import { claimBadge, managerInactive, projectGradient, projectInitials, statusTone, timeline, type SortKey } from './projectUi'

export interface RowActions {
  onOpen: (p: ProjectDTO) => void
  onEdit: (p: ProjectDTO) => void
  onChangeManager: (p: ProjectDTO) => void
  onToggleStatus: (p: ProjectDTO) => void
}

function Tile({ p, size = 'h-10 w-10' }: { p: ProjectDTO; size?: string }) {
  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${projectGradient(p.id)} text-xs font-bold text-white shadow-sm`}
    >
      {projectInitials(p.projectName)}
    </span>
  )
}

function IconAction({
  label,
  onClick,
  tone = 'default',
  children,
}: {
  label: string
  onClick: () => void
  tone?: 'default' | 'danger' | 'success'
  children: React.ReactNode
}) {
  const hover =
    tone === 'danger'
      ? 'hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400'
      : tone === 'success'
        ? 'hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-400'
        : 'hover:bg-slate-100 hover:text-ink-900 dark:hover:bg-white/10 dark:hover:text-white'
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(ev) => {
        ev.stopPropagation()
        onClick()
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition-colors dark:text-slate-400 ${hover}`}
    >
      {children}
    </button>
  )
}

function Actions({ p, actions }: { p: ProjectDTO; actions: RowActions }) {
  const active = p.status === 'ACTIVE'
  return (
    <div className="flex items-center justify-end gap-0.5">
      <IconAction label="Edit" onClick={() => actions.onEdit(p)}>
        <Pencil className="h-4 w-4" />
      </IconAction>
      <IconAction label="Change manager" onClick={() => actions.onChangeManager(p)}>
        <UserCog className="h-4 w-4" />
      </IconAction>
      <IconAction
        label={active ? 'Close project' : 'Reopen project'}
        tone={active ? 'danger' : 'success'}
        onClick={() => actions.onToggleStatus(p)}
      >
        {active ? <XCircle className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
      </IconAction>
    </div>
  )
}

function SortHeader({
  label,
  field,
  sortBy,
  direction,
  onSort,
}: {
  label: string
  field: SortKey
  sortBy: string
  direction: 'ASC' | 'DESC'
  onSort: (field: SortKey) => void
}) {
  const active = sortBy === field
  const Icon = !active ? ArrowUpDown : direction === 'ASC' ? ArrowUp : ArrowDown
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase transition-colors ${
        active ? 'text-ink-900 dark:text-white' : 'text-ink-500 hover:text-ink-900 dark:text-slate-500 dark:hover:text-white'
      }`}
    >
      {label}
      <Icon className="h-3 w-3" />
    </button>
  )
}

const TH = 'px-4 py-3 text-left text-[11px] font-semibold tracking-wide text-ink-500 uppercase dark:text-slate-500'

export default function ProjectTable({
  rows,
  loading,
  sortBy,
  direction,
  onSort,
  actions,
}: {
  rows: ProjectDTO[] | null
  loading: boolean
  sortBy: string
  direction: 'ASC' | 'DESC'
  onSort: (field: SortKey) => void
  actions: RowActions
}) {
  if (rows === null) {
    return (
      <div className="space-y-3 p-4 sm:p-5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-y border-slate-100 bg-slate-50/70 dark:border-white/6 dark:bg-white/2">
            <tr>
              <th className={TH}>
                <SortHeader label="Project" field="projectName" sortBy={sortBy} direction={direction} onSort={onSort} />
              </th>
              <th className={TH}>
                <SortHeader label="Client" field="clientName" sortBy={sortBy} direction={direction} onSort={onSort} />
              </th>
              <th className={TH}>Manager</th>
              <th className={TH}>Status</th>
              <th className={TH}>
                <SortHeader label="Timeline" field="startDate" sortBy={sortBy} direction={direction} onSort={onSort} />
              </th>
              <th className={`${TH} text-right`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/6">
            {rows.map((p) => (
              <tr
                key={p.id}
                tabIndex={0}
                aria-label={`Open ${p.projectName}`}
                onClick={() => actions.onOpen(p)}
                onKeyDown={(ev) => ev.key === 'Enter' && ev.target === ev.currentTarget && actions.onOpen(p)}
                className="group cursor-pointer transition-colors outline-none hover:bg-slate-50 focus-visible:bg-brand-500/5 dark:hover:bg-white/3"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Tile p={p} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-900 dark:text-white">{p.projectName}</p>
                      <p className="truncate text-xs text-ink-500 dark:text-slate-400">{p.projectId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-900 dark:text-white">{p.clientName ?? '—'}</td>
                <td className="px-4 py-3">
                  <p className={managerInactive(p) ? 'text-rose-600 dark:text-rose-400' : 'text-ink-900 dark:text-white'}>
                    {p.managerName ?? '—'}
                  </p>
                  {p.managerEmployeeId && (
                    <p className="text-xs text-ink-500 dark:text-slate-400">
                      {p.managerEmployeeId}
                      {managerInactive(p) && ' · inactive'}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone={statusTone(p.status)} dot>
                      {humanize(p.status)}
                    </Badge>
                    <Badge tone={claimBadge(p).tone}>{claimBadge(p).label}</Badge>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs whitespace-nowrap text-ink-500 dark:text-slate-400">{timeline(p, formatDay)}</td>
                <td className="px-4 py-3">
                  <Actions p={p} actions={actions} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-slate-100 md:hidden dark:divide-white/6">
        {rows.map((p) => (
          <li
            key={p.id}
            tabIndex={0}
            onClick={() => actions.onOpen(p)}
            onKeyDown={(ev) => ev.key === 'Enter' && ev.target === ev.currentTarget && actions.onOpen(p)}
            className="cursor-pointer space-y-3 px-4 py-4 outline-none focus-visible:bg-brand-500/5"
          >
            <div className="flex items-start gap-3">
              <Tile p={p} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink-900 dark:text-white">{p.projectName}</p>
                <p className="truncate text-xs text-ink-500 dark:text-slate-400">
                  {p.projectId}
                  {p.clientName ? ` · ${p.clientName}` : ''}
                </p>
                <p className="truncate text-xs text-ink-500 dark:text-slate-400">
                  {[p.managerName && `Manager ${p.managerName}${p.managerEmployeeId ? ` (${p.managerEmployeeId})` : ''}`, timeline(p, formatDay) !== '—' && timeline(p, formatDay)]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                <Badge tone={statusTone(p.status)} dot>
                  {humanize(p.status)}
                </Badge>
                <Badge tone={claimBadge(p).tone}>{claimBadge(p).label}</Badge>
              </div>
              <Actions p={p} actions={actions} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
