import type { RequirementCardDTO } from '../../services/manager/dashboard.service'
import { humanize, timeAgo } from '../../utils/format'
import ManagerLink from './ManagerLink'
import { PRIORITY_TAG, STAGES, STATUS_PILL } from './managerUi'

const ROLES: { key: 'sourcers' | 'interviewers' | 'coordinators'; letter: string; label: string; badge: string }[] = [
  { key: 'sourcers', letter: 'S', label: 'Sourcer', badge: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
  { key: 'interviewers', letter: 'I', label: 'Interviewer', badge: 'bg-violet-500/15 text-violet-700 dark:text-violet-300' },
  { key: 'coordinators', letter: 'C', label: 'Coordinator', badge: 'bg-brand-500/15 text-brand-700 dark:text-brand-400' },
]

/**
 * Who sources, interviews and coordinates, one line each: a coloured letter for the role, then the person
 * ("Anita Shah +1" when there are more). An empty role is a quiet dashed badge saying so.
 */
function Holders({ r }: { r: RequirementCardDTO }) {
  return (
    <ul className="grid gap-1.5" aria-label="Who handles it">
      {ROLES.map((role) => {
        const names = r[role.key]
        return (
          <li key={role.key} className="flex min-w-0 items-center gap-2 text-xs">
            <span
              title={role.label}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-extrabold ${
                names.length ? role.badge : 'border border-dashed border-slate-300 text-ink-500/60 dark:border-white/20 dark:text-slate-500'
              }`}
            >
              {role.letter}
            </span>
            <span className="sr-only">{role.label}: </span>
            {names.length === 0 ? (
              <span className="text-ink-500/70 dark:text-slate-500">Unassigned</span>
            ) : (
              <span className="min-w-0 truncate font-semibold text-ink-900 dark:text-white">
                {names[0]}
                {names.length > 1 && <span className="font-medium text-ink-500 dark:text-slate-400"> +{names.length - 1}</span>}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** One requirement: its pipeline at a glance, who owns sourcing, interviewing and coordinating, and its status. */
export default function RequirementRow({ r, showProject = true }: { r: RequirementCardDTO; showProject?: boolean }) {
  const total = STAGES.reduce((n, s) => n + (r.stages[s.key] ?? 0), 0)
  const furthest = [...STAGES].reverse().find((s) => (r.stages[s.key] ?? 0) > 0)
  const started = r.status !== 'DRAFT'
  return (
    <ManagerLink
      to={`/manager/requirements/${r.requirementId}`}
      className="grid gap-x-6 gap-y-3 rounded-2xl border border-transparent px-3 py-3.5 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_96px] md:items-center"
    >
      <div className="min-w-0">
        <span className="block truncate text-[11px] font-bold tracking-wide text-ink-500 uppercase dark:text-slate-500">
          {r.requirementId}
          {showProject ? ` · ${r.projectName}` : ''}
        </span>
        <b className="block truncate text-sm font-semibold text-ink-900 dark:text-white">
          {r.positionTitle}
          {r.priority && (
            <span className={`ml-2 rounded-md px-1.5 py-px align-[1px] text-[10px] font-extrabold tracking-wide uppercase ${PRIORITY_TAG[r.priority] ?? PRIORITY_TAG.LOW}`}>
              {humanize(r.priority)}
            </span>
          )}
        </b>
        <small className="text-xs text-ink-500 dark:text-slate-400">
          {r.createdAt ? `Created ${timeAgo(r.createdAt)}` : 'Open'}
          {started ? ` · ${total} candidate${total === 1 ? '' : 's'}` : ' · Not published yet'}
        </small>
      </div>
      <div>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/6" role="img" aria-label={STAGES.map((s) => `${s.label} ${r.stages[s.key] ?? 0}`).join(', ')}>
          {total > 0 && STAGES.map((s) => (r.stages[s.key] ? <i key={s.key} className={s.bar} style={{ width: `${(r.stages[s.key] / total) * 100}%` }} /> : null))}
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-ink-500 tabular-nums dark:text-slate-400">
          <span>{!started ? 'Publish to start' : total > 0 ? `${total} in process` : 'No candidates yet'}</span>
          {furthest && <span>{furthest.label} {r.stages[furthest.key]}</span>}
        </div>
      </div>
      <Holders r={r} />
      <span className={`justify-self-start rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap md:justify-self-end ${STATUS_PILL[r.status] ?? STATUS_PILL.CLOSED}`}>
        {humanize(r.status)}
      </span>
    </ManagerLink>
  )
}
