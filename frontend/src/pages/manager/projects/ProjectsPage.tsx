import { motion } from 'motion/react'
import { ChevronRight, Search, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PanelError, Skeleton, TILE_SURFACE } from '../../../components/dashboard/Panel'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/form'
import RefreshButton from '../../../components/ui/RefreshButton'
import { useQuery } from '../../../hooks/useQuery'
import { useResource } from '../../../hooks/useResource'
import type { ProjectDTO } from '../../../services/admin/project.service'
import type { InterviewDTO } from '../../../services/interview.service'
import type { ProjectStaffingDTO } from '../../../services/manager/dashboard.service'
import { humanize, parseServerDate } from '../../../utils/format'
import { formatDay } from '../../admin/employees/employeeUi'
import { projectGradient, projectInitials, statusTone } from '../../admin/projects/projectUi'
import LinkButton from '../LinkButton'
import ManagerLink from '../ManagerLink'
import { timeOf } from '../managerUi'
import ClaimDialog from './ClaimDialog'

const STATUS_CHIPS = [
  { value: '', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'CLOSED', label: 'Closed' },
]

const MY_COLS = 'lg:grid-cols-[minmax(0,1.7fr)_100px_70px_110px_100px_minmax(0,1.3fr)_20px]'

/** The soonest interview still ahead on a project, for the "Next interview" column. */
function nextInterview(interviews: InterviewDTO[], projectId: string, now: Date): { when: string; who: string } | null {
  const next = interviews
    .filter((i) => i.projectId === projectId && (i.status === 'SCHEDULED' || i.status === 'ACCEPTED') && parseServerDate(i.scheduledAt) >= now)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0]
  if (!next) return null
  const day = parseServerDate(next.scheduledAt).toLocaleDateString(undefined, { weekday: 'short' })
  return {
    when: `${day} ${timeOf(next.scheduledAt)}`,
    who: [next.employeeName ?? next.employeeId, next.roundNumber ? `Round ${next.roundNumber}` : null].filter(Boolean).join(' · '),
  }
}

function Tile({ p }: { p: ProjectDTO }) {
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-[13px] font-bold text-white ${projectGradient(p.id)}`}>
      {projectInitials(p.projectName)}
    </span>
  )
}

function Name({ p }: { p: ProjectDTO }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Tile p={p} />
      <span className="min-w-0">
        <b className="block truncate text-sm font-semibold text-ink-900 dark:text-white">{p.projectName}</b>
        <small className="block truncate text-xs text-ink-500 dark:text-slate-400">{[p.clientName, p.projectId].filter(Boolean).join(' · ')}</small>
      </span>
    </span>
  )
}

/** A project waiting to be claimed. Deliberately not a table row: it is a decision, so it gets its own card. */
function ClaimCard({ p, staffing, now, onClaim }: { p: ProjectDTO; staffing?: ProjectStaffingDTO; now: Date; onClaim: () => void }) {
  const added = p.createdAt ? parseServerDate(p.createdAt) : null
  const fresh = added !== null && now.getTime() - added.getTime() < 7 * 864e5
  return (
    <article className="relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-amber-500/30 bg-white p-5 shadow-sm dark:bg-white/3 dark:shadow-none">
      <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-400 to-orange-500" />
      <header className="flex items-start gap-3 pt-1">
        <Tile p={p} />
        <div className="min-w-0 flex-1">
          <b className="block truncate text-[15px] font-semibold text-ink-900 dark:text-white">{p.projectName}</b>
          <small className="block truncate text-xs text-ink-500 dark:text-slate-400">{[p.clientName, p.projectId].filter(Boolean).join(' · ')}</small>
        </div>
        {fresh && <Badge tone="amber">New</Badge>}
      </header>
      {p.description ? (
        <p className="line-clamp-2 text-sm text-ink-700 dark:text-slate-300">{p.description}</p>
      ) : (
        <p className="text-sm text-ink-500 dark:text-slate-400">No description yet.</p>
      )}
      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          { k: 'On the team', v: staffing ? String(staffing.activeMembers) : '–' },
          { k: 'Open requirements', v: staffing ? String(staffing.openRequirements) : '–' },
          { k: 'Ends', v: formatDay(p.endDate) ?? '–' },
        ].map((x) => (
          <div key={x.k} className="rounded-xl bg-slate-100/70 px-2 py-2 dark:bg-white/5">
            <dd className="text-sm font-bold text-ink-900 tabular-nums dark:text-white">{x.v}</dd>
            <dt className="text-[11px] text-ink-500 dark:text-slate-400">{x.k}</dt>
          </div>
        ))}
      </dl>
      <p className="text-xs text-ink-500 dark:text-slate-400">
        Assigned to you{p.createdBy ? ` by ${p.createdBy}` : ''}
        {p.createdAt ? ` on ${formatDay(p.createdAt.slice(0, 10))}` : ''}
      </p>
      <footer className="mt-auto flex gap-2">
        <LinkButton to={`/manager/projects/${p.projectId}`}>View details</LinkButton>
        <Button variant="primary" className="flex-1 whitespace-nowrap" onClick={onClaim}>
          Claim project
        </Button>
      </footer>
    </article>
  )
}

/** The manager's projects: the ones they run, and the ones assigned to them that they haven't claimed yet. */
export default function ProjectsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const projects = useResource('manager/projects')
  const dashboard = useResource('manager/dashboard')
  // The same stored list the Interviews page uses, so a newly booked interview shows up here straight away.
  const interviews = useQuery('managerInterviews', {})
  const [now] = useState(() => new Date())
  const [claiming, setClaiming] = useState<ProjectDTO | null>(null)

  const tab = params.get('tab') === 'claim' ? 'claim' : 'mine'
  const status = params.get('status') ?? ''
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

  const staffing = useMemo(() => new Map<string, ProjectStaffingDTO>((dashboard.data?.projectStaffing ?? []).map((s) => [s.projectId, s])), [dashboard.data])
  const claimed = projects.data?.claimed ?? []
  const pending = projects.data?.pendingClaim ?? []
  const text = q.trim().toLowerCase()
  const matches = (p: ProjectDTO) =>
    !text || [p.projectName, p.clientName, p.projectId].some((v) => v?.toLowerCase().includes(text))
  const mine = claimed.filter((p) => matches(p) && (!status || p.status === status))
  const toClaim = pending.filter(matches)

  function refreshAll() {
    projects.reload()
    dashboard.reload()
    interviews.refresh()
  }

  function afterClaim(p: ProjectDTO) {
    setClaiming(null)
    projects.reload()
    dashboard.reload()
    navigate(`/manager/projects/${p.projectId}`)
  }

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-ink-500 uppercase dark:text-slate-400">Projects &amp; people</p>
          <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">Projects</h1>
          <p className="mt-1 max-w-[62ch] text-sm text-ink-500 dark:text-slate-400">The projects you run. Open one to see its requirements and team.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <label className="flex w-80 max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
          <Search className="h-4 w-4 shrink-0 text-ink-500 dark:text-slate-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Search by project, client or ID"
            aria-label="Search projects"
            className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-ink-500/60 dark:placeholder:text-slate-500"
          />
        </label>
        <RefreshButton onClick={refreshAll} loading={projects.loading || dashboard.loading || interviews.loading} />
        </div>
      </motion.header>

      {projects.error && !projects.data && (
        <div className={`${TILE_SURFACE} p-5`}>
          <PanelError message={projects.error} status={projects.status} onRetry={projects.reload} />
        </div>
      )}

      {tab === 'mine' && pending.length > 0 && (
        <button
          type="button"
          onClick={() => set({ tab: 'claim' })}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-linear-to-br from-amber-500/14 to-orange-500/5 px-4 py-3.5 text-left"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white">
              <TriangleAlert className="h-[18px] w-[18px]" />
            </span>
            <span>
              <b className="block text-sm font-semibold text-ink-900 dark:text-white">
                {pending.length} project{pending.length === 1 ? ' is' : 's are'} waiting for you to claim {pending.length === 1 ? 'it' : 'them'}
              </b>
              <small className="text-xs text-ink-500 dark:text-slate-400">Claim a project to create requirements and build its team.</small>
            </span>
          </span>
          <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold dark:border-white/10 dark:bg-white/5">Review</span>
        </button>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/8">
        <nav className="flex gap-1" aria-label="Projects">
          {[
            { key: 'mine', label: 'My projects', count: claimed.length, warn: false },
            { key: 'claim', label: 'To claim', count: pending.length, warn: pending.length > 0 },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              aria-current={tab === t.key || undefined}
              onClick={() => set({ tab: t.key === 'mine' ? undefined : t.key })}
              className={`-mb-px flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                tab === t.key ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-ink-500 hover:text-ink-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {t.label}
              {projects.data && (
                <span className={`flex h-5.5 min-w-5.5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums ${t.warn ? 'bg-amber-500 text-white' : 'bg-slate-100 text-ink-700 dark:bg-white/8 dark:text-slate-300'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </nav>
        {tab === 'mine' && (
          <div role="group" aria-label="Status" className="flex gap-1.5 pb-2">
            {STATUS_CHIPS.map((c) => (
              <button
                key={c.label}
                type="button"
                aria-pressed={status === c.value}
                onClick={() => set({ status: c.value || undefined })}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  status === c.value ? 'border-brand-500/30 bg-brand-500/12 text-brand-600 dark:text-brand-400' : 'border-slate-200 text-ink-500 hover:text-ink-900 dark:border-white/10 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === 'claim' ? (
        <section aria-label="Projects to claim" className="grid gap-4">
          <p className="rounded-2xl border border-amber-500/25 bg-amber-500/6 px-4 py-3 text-sm text-ink-700 dark:text-slate-300">
            These were assigned to you and are not yours yet. Claim a project to take it on. Until then you can look at it, but not change anything.
          </p>
          {!projects.data && !projects.error ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-64 rounded-3xl" />
              ))}
            </div>
          ) : toClaim.length === 0 ? (
            <div className={`${TILE_SURFACE} px-6 py-12 text-center text-sm text-ink-500 dark:text-slate-400`}>Nothing is waiting to be claimed.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {toClaim.map((p) => (
                <ClaimCard key={p.projectId} p={p} staffing={staffing.get(p.projectId)} now={now} onClaim={() => setClaiming(p)} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className={`${TILE_SURFACE} overflow-hidden`} aria-label="My projects">
          {!projects.data && !projects.error ? (
            <div className="space-y-2 p-5">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <div className={`hidden h-11 items-center gap-4 border-b border-slate-100 px-5 text-[11px] font-bold tracking-[0.08em] text-ink-500 uppercase lg:grid dark:border-white/6 dark:text-slate-500 ${MY_COLS}`}>
                <span>Project</span><span>Status</span><span>Team</span><span>Open reqs</span><span>Candidates</span><span>Next interview</span><span />
              </div>
              {mine.length === 0 && (
                <div className="px-6 py-12 text-center text-sm text-ink-500 dark:text-slate-400">
                  {claimed.length === 0
                    ? pending.length > 0
                      ? 'You haven’t claimed a project yet. Open “To claim” to take one on.'
                      : 'No project is assigned to you yet.'
                    : 'No project matches these filters.'}
                </div>
              )}
              {mine.map((p) => {
                const s = staffing.get(p.projectId)
                const next = nextInterview(interviews.data ?? [], p.projectId, now)
                return (
                  <ManagerLink
                    key={p.projectId}
                    to={`/manager/projects/${p.projectId}`}
                    className={`group grid items-center gap-x-4 gap-y-2 border-t border-slate-100 px-5 py-3.5 first:border-t-0 lg:min-h-[72px] dark:border-white/6 ${MY_COLS}`}
                    hoverClassName="hover:bg-slate-50/70 dark:hover:bg-white/3"
                  >
                    <Name p={p} />
                    <span><Badge tone={statusTone(p.status)} dot>{humanize(p.status)}</Badge></span>
                    <span className="text-sm font-semibold tabular-nums">{s ? s.activeMembers : '–'}</span>
                    <span className="text-sm font-semibold tabular-nums">{s ? s.openRequirements : '–'}</span>
                    <span className="text-sm font-semibold tabular-nums">{s ? s.candidates : '–'}</span>
                    <span className="min-w-0 text-sm">
                      {next ? (
                        <>
                          <b className="block font-semibold text-ink-900 dark:text-white">{next.when}</b>
                          <small className="block truncate text-xs text-ink-500 dark:text-slate-400">{next.who}</small>
                        </>
                      ) : (
                        <span className="text-ink-500 dark:text-slate-400">None booked</span>
                      )}
                    </span>
                    <ChevronRight className="hidden h-4 w-4 text-ink-500 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600 lg:block dark:text-slate-400" />
                  </ManagerLink>
                )
              })}
              <div className="flex justify-between border-t border-slate-100 px-5 py-3 text-xs text-ink-500 dark:border-white/6 dark:text-slate-400">
                <span>Showing {mine.length} of {claimed.length} project{claimed.length === 1 ? '' : 's'}</span>
              </div>
            </>
          )}
        </section>
      )}

      <ClaimDialog project={claiming} staffing={claiming ? staffing.get(claiming.projectId) : undefined} onClose={() => setClaiming(null)} onClaimed={afterClaim} />
    </div>
  )
}
