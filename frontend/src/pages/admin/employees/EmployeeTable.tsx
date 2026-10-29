import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Power, PowerOff, UserCog } from 'lucide-react'
import { Badge, type BadgeTone } from '../../../components/ui/Badge'
import { Skeleton } from '../../../components/dashboard/Panel'
import type { EmployeeDTO } from '../../../services/admin/employee.service'
import { humanize, initialsOf } from '../../../utils/format'
import { allocationBadge, avatarGradient, employmentTone, formatDay, fullName, type SortKey } from './employeeUi'

export interface RowActions {
  onOpen: (e: EmployeeDTO) => void
  onEdit: (e: EmployeeDTO) => void
  onAssignRmg: (e: EmployeeDTO) => void
  onToggleStatus: (e: EmployeeDTO) => void
}

function Avatar({ e, size = 'h-10 w-10' }: { e: EmployeeDTO; size?: string }) {
  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${avatarGradient(e.id)} text-xs font-bold text-white shadow-sm`}
    >
      {initialsOf(e.firstName, e.lastName)}
    </span>
  )
}

const ROLE_TONES: Record<string, BadgeTone> = { admin: 'rose', manager: 'sky', rmg: 'violet', associate: 'green' }

function Roles({ roles }: { roles?: string[] }) {
  if (!roles || roles.length === 0) return <span className="text-ink-500 dark:text-slate-500">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {[...roles].sort().map((role) => (
        <Badge key={role} tone={ROLE_TONES[role.toLowerCase()] ?? 'slate'}>
          {role}
        </Badge>
      ))}
    </div>
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

function Actions({ e, actions }: { e: EmployeeDTO; actions: RowActions }) {
  const active = e.employmentStatus === 'ACTIVE'
  return (
    <div className="flex items-center justify-end gap-0.5">
      <IconAction label="Edit" onClick={() => actions.onEdit(e)}>
        <Pencil className="h-4 w-4" />
      </IconAction>
      <IconAction label="Assign RMG" onClick={() => actions.onAssignRmg(e)}>
        <UserCog className="h-4 w-4" />
      </IconAction>
      <IconAction
        label={active ? 'Deactivate' : 'Reactivate'}
        tone={active ? 'danger' : 'success'}
        onClick={() => actions.onToggleStatus(e)}
      >
        {active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
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

export default function EmployeeTable({
  rows,
  loading,
  sortBy,
  direction,
  onSort,
  actions,
}: {
  rows: EmployeeDTO[] | null
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
                <SortHeader label="Employee" field="firstName" sortBy={sortBy} direction={direction} onSort={onSort} />
              </th>
              <th className={TH}>
                <SortHeader label="Designation" field="designation" sortBy={sortBy} direction={direction} onSort={onSort} />
              </th>
              <th className={TH}>Department</th>
              <th className={TH}>Role</th>
              <th className={TH}>Status</th>
              <th className={TH}>
                <SortHeader label="Joined" field="dateOfJoining" sortBy={sortBy} direction={direction} onSort={onSort} />
              </th>
              <th className={`${TH} text-right`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/6">
            {rows.map((e) => (
              <tr
                key={e.id}
                tabIndex={0}
                aria-label={`Open ${fullName(e)}`}
                onClick={() => actions.onOpen(e)}
                onKeyDown={(ev) => ev.key === 'Enter' && ev.target === ev.currentTarget && actions.onOpen(e)}
                className="group cursor-pointer transition-colors outline-none hover:bg-slate-50 focus-visible:bg-brand-500/5 dark:hover:bg-white/3"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar e={e} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-900 dark:text-white">{fullName(e)}</p>
                      <p className="truncate text-xs text-ink-500 dark:text-slate-400">
                        {e.employeeId} · {e.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-ink-900 dark:text-white">{e.designation}</p>
                  {e.grade && <p className="text-xs text-ink-500 dark:text-slate-400">Grade {e.grade}</p>}
                </td>
                <td className="px-4 py-3">
                  <p className="text-ink-900 dark:text-white">{e.departmentName ?? '—'}</p>
                  {e.locationName && <p className="text-xs text-ink-500 dark:text-slate-400">{e.locationName}</p>}
                </td>
                <td className="px-4 py-3">
                  <Roles roles={e.roles} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone={employmentTone(e.employmentStatus)} dot>
                      {humanize(e.employmentStatus)}
                    </Badge>
                    {allocationBadge(e) && <Badge tone={allocationBadge(e)!.tone}>{allocationBadge(e)!.label}</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs whitespace-nowrap text-ink-500 dark:text-slate-400">
                  {formatDay(e.dateOfJoining) ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <Actions e={e} actions={actions} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-slate-100 md:hidden dark:divide-white/6">
        {rows.map((e) => (
          <li
            key={e.id}
            tabIndex={0}
            onClick={() => actions.onOpen(e)}
            onKeyDown={(ev) => ev.key === 'Enter' && ev.target === ev.currentTarget && actions.onOpen(e)}
            className="cursor-pointer space-y-3 px-4 py-4 outline-none focus-visible:bg-brand-500/5"
          >
            <div className="flex items-start gap-3">
              <Avatar e={e} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink-900 dark:text-white">{fullName(e)}</p>
                <p className="truncate text-xs text-ink-500 dark:text-slate-400">
                  {e.employeeId} · {e.designation}
                </p>
                <p className="truncate text-xs text-ink-500 dark:text-slate-400">
                  {[e.departmentName, e.locationName].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                <Badge tone={employmentTone(e.employmentStatus)} dot>
                  {humanize(e.employmentStatus)}
                </Badge>
                <Roles roles={e.roles} />
              </div>
              <Actions e={e} actions={actions} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
