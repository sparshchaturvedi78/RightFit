import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '../../../components/ui/Badge'
import { Skeleton } from '../../../components/dashboard/Panel'
import type { RmgDetailDTO } from '../../../services/admin/rmg.service'
import { humanize, initialsOf } from '../../../utils/format'
import { avatarGradient, employmentTone } from '../employees/employeeUi'
import WorkforceBar from './WorkforceBar'
import { needsReplacement, rmgNameParts, utilisation, type SortKey } from './rmgUi'

function Avatar({ r, size = 'h-10 w-10' }: { r: RmgDetailDTO; size?: string }) {
  const [first, last] = rmgNameParts(r.rmgName)
  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${avatarGradient(r.rmgId)} text-xs font-bold text-white shadow-sm`}
    >
      {initialsOf(first, last)}
    </span>
  )
}

export function StatusBadges({ r }: { r: RmgDetailDTO }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge tone={employmentTone(r.status)} dot>
        {humanize(r.status)}
      </Badge>
      {needsReplacement(r) && <Badge tone="rose">Needs new RMG</Badge>}
    </div>
  )
}

/** "12 associates" over the stacked bar, with the share in a project. */
function TeamCell({ r, index }: { r: RmgDetailDTO; index: number }) {
  const util = utilisation(r.workforce, r.associateCount)
  return (
    <div className="w-full md:w-44">
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
        <span className="text-ink-500 dark:text-slate-400">
          <span className="text-sm font-bold text-ink-900 tabular-nums dark:text-white">{r.associateCount}</span>{' '}
          associate{r.associateCount === 1 ? '' : 's'}
        </span>
        {util !== null && <span className="text-ink-500 tabular-nums dark:text-slate-400">{util}% in project</span>}
      </div>
      <WorkforceBar split={r.workforce} total={r.associateCount} delay={0.05 + index * 0.03} />
    </div>
  )
}

function OpenInEmployees({ r }: { r: RmgDetailDTO }) {
  return (
    <Link
      to={`/admin/employees?q=${encodeURIComponent(r.employeeId)}`}
      aria-label={`Open ${r.rmgName} in Employees`}
      title="Open in Employees"
      onClick={(ev) => ev.stopPropagation()}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-slate-100 hover:text-ink-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
    >
      <ExternalLink className="h-4 w-4" />
    </Link>
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

export default function RmgTable({
  rows,
  loading,
  sortBy,
  direction,
  onSort,
  onOpen,
}: {
  rows: RmgDetailDTO[] | null
  loading: boolean
  sortBy: string
  direction: 'ASC' | 'DESC'
  onSort: (field: SortKey) => void
  onOpen: (r: RmgDetailDTO) => void
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
        <table className="w-full min-w-225 text-sm">
          <thead className="border-y border-slate-100 bg-slate-50/70 dark:border-white/6 dark:bg-white/2">
            <tr>
              <th className={TH}>
                <SortHeader label="RMG" field="name" sortBy={sortBy} direction={direction} onSort={onSort} />
              </th>
              <th className={TH}>Department</th>
              <th className={TH}>
                <SortHeader label="Team" field="associateCount" sortBy={sortBy} direction={direction} onSort={onSort} />
              </th>
              <th className={TH}>Status</th>
              <th className={TH}>Reports to</th>
              <th className={`${TH} text-right`}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/6">
            {rows.map((r, i) => (
              <tr
                key={r.rmgId}
                tabIndex={0}
                aria-label={`Open ${r.rmgName}`}
                onClick={() => onOpen(r)}
                onKeyDown={(ev) => ev.key === 'Enter' && ev.target === ev.currentTarget && onOpen(r)}
                className="group cursor-pointer transition-colors outline-none hover:bg-slate-50 focus-visible:bg-brand-500/5 dark:hover:bg-white/3"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar r={r} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-900 dark:text-white">{r.rmgName}</p>
                      <p className="truncate text-xs text-ink-500 dark:text-slate-400">
                        {r.employeeId}
                        {r.designation ? ` · ${r.designation}` : ''}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-ink-900 dark:text-white">{r.department ?? '—'}</p>
                  {r.location && <p className="text-xs text-ink-500 dark:text-slate-400">{r.location}</p>}
                </td>
                <td className="px-4 py-3">
                  <TeamCell r={r} index={i} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadges r={r} />
                </td>
                <td className="px-4 py-3">
                  <p className="text-ink-900 dark:text-white">{r.reportsToName ?? '—'}</p>
                  {r.reportsToEmployeeId && <p className="text-xs text-ink-500 dark:text-slate-400">{r.reportsToEmployeeId}</p>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <OpenInEmployees r={r} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-slate-100 md:hidden dark:divide-white/6">
        {rows.map((r, i) => (
          <li
            key={r.rmgId}
            tabIndex={0}
            onClick={() => onOpen(r)}
            onKeyDown={(ev) => ev.key === 'Enter' && ev.target === ev.currentTarget && onOpen(r)}
            className="cursor-pointer space-y-3 px-4 py-4 outline-none focus-visible:bg-brand-500/5"
          >
            <div className="flex items-start gap-3">
              <Avatar r={r} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink-900 dark:text-white">{r.rmgName}</p>
                <p className="truncate text-xs text-ink-500 dark:text-slate-400">
                  {[r.employeeId, r.department, r.location].filter(Boolean).join(' · ')}
                </p>
              </div>
              <OpenInEmployees r={r} />
            </div>
            <TeamCell r={r} index={i} />
            <StatusBadges r={r} />
          </li>
        ))}
      </ul>
    </div>
  )
}
