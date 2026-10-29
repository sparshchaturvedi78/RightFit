import { motion } from 'motion/react'
import { ChevronLeft, ClipboardList, Plus, Search, Users } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { StatStrip } from '../../../components/dashboard/StatStrip'
import { AsyncBody, EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../../components/dashboard/Panel'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/form'
import RefreshButton from '../../../components/ui/RefreshButton'
import { useQuery } from '../../../hooks/useQuery'
import { useResource } from '../../../hooks/useResource'
import type { ProjectDTO } from '../../../services/admin/project.service'
import type { ProjectStaffingDTO } from '../../../services/manager/dashboard.service'
import type { TeamMemberDTO } from '../../../services/manager/team.service'
import { useAppDispatch } from '../../../store'
import { invalidateQueries } from '../../../store/queriesSlice'
import { humanize, initialsOf } from '../../../utils/format'
import { formatDay } from '../../admin/employees/employeeUi'
import { projectGradient, projectInitials, statusTone, timeline } from '../../admin/projects/projectUi'
import RequirementRow from '../RequirementRow'
import { matchesReqFilter, REQ_FILTERS, type ReqFilter } from '../managerUi'
import EmployeeDrawer from '../people/EmployeeDrawer'
import RemoveFromTeamDialog from './RemoveFromTeamDialog'
import LinkToProjectDialog from '../people/LinkToProjectDialog'
import ClaimDialog from './ClaimDialog'
import NewRequirementPanel from './NewRequirementPanel'

/** Does a team member match what was typed in the team search? */
function matchesTeam(m: TeamMemberDTO, q: string, status: 'all' | 'active' | 'inactive' = 'all'): boolean {
  const left = m.employmentStatus === 'INACTIVE'
  if (status === 'active' && left) return false
  if (status === 'inactive' && !left) return false
  const t = q.trim().toLowerCase()
  return !t || [m.name, m.employeeId, m.designation, m.role].some((v) => v?.toLowerCase().includes(t))
}

/** One project: its requirements and team when it is yours; a short summary and a way to claim it when it isn't yet. */
export default function ProjectPage() {
  const { projectId = '' } = useParams()
  const projects = useResource('manager/projects')
  const dashboard = useResource('manager/dashboard')
  const claimed = projects.data?.claimed.find((p) => p.projectId === projectId)
  const pending = projects.data?.pendingClaim.find((p) => p.projectId === projectId)
  const project = claimed ?? pending
  const staffing = dashboard.data?.projectStaffing.find((s) => s.projectId === projectId)

  const back = (
    <Link to="/manager/projects" className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400">
      <ChevronLeft className="h-3.5 w-3.5" /> Projects
    </Link>
  )

  if (projects.error && !projects.data) {
    return (
      <div className="mx-auto max-w-350">
        {back}
        <div className={`${TILE_SURFACE} p-5`}>
          <PanelError message={projects.error} status={projects.status} onRetry={projects.reload} />
        </div>
      </div>
    )
  }
  if (!projects.data) {
    return (
      <div className="mx-auto max-w-350 space-y-4">
        {back}
        <Skeleton className="h-16 w-96 rounded-2xl" />
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    )
  }
  if (!project) {
    return (
      <div className="mx-auto max-w-350">
        {back}
        <div className={`${TILE_SURFACE} p-5`}>
          <EmptyState icon={<ClipboardList className="h-5 w-5" />}>This project isn’t one of yours, or it doesn’t exist.</EmptyState>
        </div>
      </div>
    )
  }
  return claimed ? (
    <ClaimedProject back={back} project={claimed} staffing={staffing} claimedProjects={projects.data.claimed} />
  ) : (
    <UnclaimedProject back={back} project={project} staffing={staffing} />
  )
}

function Header({ project, actions }: { project: ProjectDTO; actions: ReactNode }) {
  return (
    <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-linear-to-br text-lg font-bold text-white ${projectGradient(project.id)}`}>
          {projectInitials(project.projectName)}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">{project.projectName}</h1>
            <Badge tone={statusTone(project.status)} dot>{humanize(project.status)}</Badge>
            <Badge tone={project.managerClaimed ? 'slate' : 'amber'}>{project.managerClaimed ? 'Claimed by you' : 'Not claimed yet'}</Badge>
          </div>
          <p className="mt-1 flex flex-wrap gap-x-4 text-[13px] text-ink-500 dark:text-slate-400">
            {project.clientName && <b className="font-semibold text-ink-900 dark:text-white">{project.clientName}</b>}
            <span>{project.projectId}</span>
            <span>{timeline(project, formatDay)}</span>
          </p>
          {project.description && <p className="mt-2 max-w-[70ch] text-sm text-ink-700 dark:text-slate-300">{project.description}</p>}
        </div>
      </div>
      {actions}
    </motion.header>
  )
}

/** A project the manager has been given but hasn't claimed: the basics, and the one thing to do. */
function UnclaimedProject({ back, project, staffing }: { back: ReactNode; project: ProjectDTO; staffing?: ProjectStaffingDTO }) {
  const navigate = useNavigate()
  const projects = useResource('manager/projects')
  const dashboard = useResource('manager/dashboard')
  const [claiming, setClaiming] = useState(false)
  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <div>{back}</div>
      <Header
        project={project}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <RefreshButton onClick={() => { projects.reload(); dashboard.reload() }} loading={projects.loading || dashboard.loading} />
            <Button variant="primary" onClick={() => setClaiming(true)}>Claim project</Button>
          </div>
        }
      />
      <section className={`${TILE_SURFACE} grid gap-3 p-6`}>
        <h2 className="text-[15px] font-semibold text-ink-900 dark:text-white">Claim this project to start</h2>
        <p className="max-w-[62ch] text-sm text-ink-500 dark:text-slate-400">
          It was assigned to you{project.createdBy ? ` by ${project.createdBy}` : ''}. Until you claim it you can see these details, but not its requirements or team, and you can’t create requirements for it.
        </p>
        {staffing && (
          <p className="text-sm text-ink-500 dark:text-slate-400">
            {staffing.activeMembers} {staffing.activeMembers === 1 ? 'person' : 'people'} on the team · {staffing.openRequirements} open requirement{staffing.openRequirements === 1 ? '' : 's'}
          </p>
        )}
      </section>
      <ClaimDialog
        project={claiming ? project : null}
        staffing={staffing}
        onClose={() => setClaiming(false)}
        onClaimed={() => {
          setClaiming(false)
          projects.reload()
          dashboard.reload()
          navigate(`/manager/projects/${project.projectId}`, { replace: true })
        }}
      />
    </div>
  )
}

function ClaimedProject({
  back,
  project,
  staffing,
  claimedProjects,
}: {
  back: ReactNode
  project: ProjectDTO
  staffing?: ProjectStaffingDTO
  claimedProjects: ProjectDTO[]
}) {
  const dispatch = useAppDispatch()
  const dashboard = useResource('manager/dashboard')
  const projectsRes = useResource('manager/projects')
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'team' ? 'team' : 'requirements'
  const filter = (params.get('show') as ReqFilter | null) ?? 'open'
  const [creating, setCreating] = useState(false)
  const [removing, setRemoving] = useState<{ employeeId: string; name: string } | null>(null)
  const [teamQ, setTeamQ] = useState('')
  const [teamStatus, setTeamStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [openEmp, setOpenEmp] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)
  const people = useQuery('managerPeople', {})
  const requirements = useQuery('managerProjectRequirements', { projectId: project.projectId })
  const team = useQuery('managerProjectTeam', { projectId: project.projectId })
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

  function refreshAll() {
    projectsRes.reload()
    dashboard.reload()
    requirements.refresh()
    team.refresh()
    people.refresh()
  }

  /** Someone was added to a project or moved: the team and the project figures change. */
  function afterPeopleChange() {
    team.refresh()
    people.refresh()
    dashboard.reload()
  }

  const cards = requirements.data ?? []
  const shown = cards.filter((r) => matchesReqFilter(r.status, filter))
  const counts = (f: ReqFilter) => cards.filter((r) => matchesReqFilter(r.status, f)).length

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <div>{back}</div>
      <Header
        project={project}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <RefreshButton onClick={refreshAll} loading={requirements.loading || team.loading || dashboard.loading} />
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
              New requirement
            </Button>
          </div>
        }
      />

      <StatStrip
        loading={!staffing}
        items={[
          { label: 'Team', value: staffing?.activeMembers, caption: staffing ? `${staffing.allocatedHoursPerDay ?? 0} hours a day allocated` : undefined },
          { label: 'Open requirements', value: staffing?.openRequirements, caption: 'Draft, published or on hold' },
          { label: 'Candidates in process', value: staffing?.candidates, caption: 'Across all its requirements' },
          { label: 'Allocated hours a day', value: staffing?.allocatedHoursPerDay ?? 0, text: String(Number((staffing?.allocatedHoursPerDay ?? 0).toFixed(1))), caption: staffing ? `across ${staffing.activeMembers} ${staffing.activeMembers === 1 ? 'person' : 'people'}` : undefined },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/8">
        <nav className="flex gap-1" aria-label="Project">
          {[
            { key: 'requirements', label: 'Requirements', count: requirements.data ? counts('open') : undefined },
            { key: 'team', label: 'Team', count: staffing?.activeMembers },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              aria-current={tab === t.key || undefined}
              onClick={() => set({ tab: t.key === 'requirements' ? undefined : t.key })}
              className={`-mb-px flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                tab === t.key ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-ink-500 hover:text-ink-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className="flex h-5.5 min-w-5.5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[11px] font-bold text-ink-700 tabular-nums dark:bg-white/8 dark:text-slate-300">{t.count}</span>
              )}
            </button>
          ))}
        </nav>
        {tab === 'requirements' && (
          <div role="group" aria-label="Status" className="flex flex-wrap gap-1.5 pb-2">
            {REQ_FILTERS.map((c) => (
              <button
                key={c.value}
                type="button"
                aria-pressed={filter === c.value}
                onClick={() => set({ show: c.value === 'open' ? undefined : c.value })}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  filter === c.value ? 'border-brand-500/30 bg-brand-500/12 text-brand-600 dark:text-brand-400' : 'border-slate-200 text-ink-500 hover:text-ink-900 dark:border-white/10 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === 'requirements' ? (
        <section className={`${TILE_SURFACE} p-2 sm:p-3`} aria-label="Requirements of this project">
          {requirements.error && !requirements.data ? (
            <PanelError message={requirements.error} status={requirements.status} onRetry={requirements.refresh} />
          ) : !requirements.data ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <EmptyState icon={<ClipboardList className="h-5 w-5" />}>
                {cards.length === 0 ? 'No requirements yet. Create the first one for this project.' : 'No requirement matches this filter.'}
              </EmptyState>
              {cards.length === 0 && (
                <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
                  New requirement
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-[minmax(0,1fr)] divide-y divide-slate-100 dark:divide-white/6">
              {shown.map((r) => (
                <RequirementRow key={r.requirementId} r={r} showProject={false} />
              ))}
            </div>
          )}
          {requirements.data && shown.length > 0 && (
            <p className="px-3 pt-2 pb-1 text-xs text-ink-500 dark:text-slate-400">
              Showing {shown.length} of {cards.length} requirement{cards.length === 1 ? '' : 's'}
            </p>
          )}
        </section>
      ) : (
        <section className={`${TILE_SURFACE} p-2 sm:p-3`} aria-label="Team">
          <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-1 pb-3">
            <label className="flex w-72 max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
              <Search className="h-4 w-4 shrink-0 text-ink-500 dark:text-slate-400" />
              <input
                type="search"
                value={teamQ}
                onChange={(e) => setTeamQ(e.target.value)}
                placeholder="Search the team"
                aria-label="Search the team"
                className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-ink-500/60 dark:placeholder:text-slate-500"
              />
            </label>
            <div role="group" aria-label="Team status" className="flex gap-1.5">
              {(['all', 'active', 'inactive'] as const).map((k) => {
                const n = (team.data?.members ?? []).filter((m) => matchesTeam(m, '', k)).length
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={teamStatus === k}
                    onClick={() => setTeamStatus(k)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      teamStatus === k ? 'border-brand-500/30 bg-brand-500/12 text-brand-600 dark:text-brand-400' : 'border-slate-200 text-ink-500 hover:text-ink-900 dark:border-white/10 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {k === 'all' ? 'All' : k === 'active' ? 'Active' : 'Inactive'}
                    {team.data ? ` ${n}` : ''}
                  </button>
                )
              })}
            </div>
            <Button variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => setLinking(true)}>
              Add person
            </Button>
          </div>
          <AsyncBody
            state={{ data: team.data, error: team.error, status: team.status, loading: team.loading, reload: team.refresh }}
            skeleton={
              <div className="space-y-2 p-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-14 rounded-2xl" />
                ))}
              </div>
            }
          >
            {(t) =>
              t.members.length === 0 ? (
                <EmptyState icon={<Users className="h-5 w-5" />}>Nobody is on this project yet.</EmptyState>
              ) : (
                <>
                  <ul className="grid grid-cols-[minmax(0,1fr)] divide-y divide-slate-100 dark:divide-white/6">
                    {t.members.filter((m) => matchesTeam(m, teamQ, teamStatus)).map((m: TeamMemberDTO) => (
                      <li key={m.employeeId} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOpenEmp(m.employeeId)}
                        aria-label={`Open ${m.name ?? m.employeeId}`}
                        className={`grid w-full grid-cols-1 items-center gap-x-4 gap-y-1 rounded-xl px-3 py-3 text-left sm:grid-cols-[minmax(0,1fr)_130px_110px_150px_110px] transition-colors hover:bg-slate-50 dark:hover:bg-white/3 ${m.employmentStatus === 'INACTIVE' ? 'opacity-60' : ''}`}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand-400 to-emerald-700 text-xs font-bold text-white">
                            {initialsOf(m.name?.split(' ')[0], m.name?.split(' ')[1])}
                          </span>
                          <span className="min-w-0">
                            <b className="flex items-center gap-2 truncate text-sm font-semibold text-ink-900 dark:text-white">
                              {m.name ?? m.employeeId}
                              {m.employmentStatus === 'INACTIVE' && <Badge tone="rose" dot>Inactive</Badge>}
                            </b>
                            <small className="block truncate text-xs text-ink-500 dark:text-slate-400">{[m.employeeId, m.designation].filter(Boolean).join(' · ')}</small>
                          </span>
                        </span>
                        <span className="text-[13px] text-ink-700 dark:text-slate-300">{m.role ? humanize(m.role) : '—'}</span>
                        <span className="text-[13px] font-semibold tabular-nums text-ink-900 dark:text-white">{m.hoursPerDay != null ? `${m.hoursPerDay} h a day` : '—'}</span>
                        <span className="text-xs text-ink-500 dark:text-slate-400">{m.joinedAt ? `Since ${formatDay(m.joinedAt.slice(0, 10))}` : ''}</span>
                        <span className="text-xs font-semibold text-ink-500 dark:text-slate-400">{m.requirementId ?? ''}</span>
                      </button>
                      {m.role !== 'PROJECT_MANAGER' && (
                        <button
                          type="button"
                          onClick={() => setRemoving({ employeeId: m.employeeId, name: m.name ?? m.employeeId })}
                          className="mr-2 shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                        >
                          Remove
                        </button>
                      )}
                      </li>
                    ))}
                  </ul>
                  {(teamQ.trim() || teamStatus !== 'all') && t.members.every((m) => !matchesTeam(m, teamQ, teamStatus)) && <p className="px-3 py-6 text-center text-sm text-ink-500 dark:text-slate-400">No one on the team matches these filters.</p>}
                  <p className="px-3 pt-2 pb-1 text-xs text-ink-500 dark:text-slate-400">
                    {t.memberCount} {t.memberCount === 1 ? 'person' : 'people'}
                    {t.totalHoursPerDay != null ? ` · ${t.totalHoursPerDay} hours a day in total` : ''}
                  </p>
                </>
              )
            }
          </AsyncBody>
        </section>
      )}

      <RemoveFromTeamDialog projectId={project.projectId} projectName={project.projectName} member={removing} onClose={() => setRemoving(null)} onDone={() => { setRemoving(null); afterPeopleChange() }} />
      <EmployeeDrawer employeeId={openEmp} onClose={() => setOpenEmp(null)} projects={claimedProjects} onChanged={afterPeopleChange} />
      <LinkToProjectDialog open={linking} onClose={() => setLinking(false)} people={people.data ?? []} projects={claimedProjects} projectId={project.projectId} onDone={afterPeopleChange} />
      <NewRequirementPanel
        open={creating}
        onClose={() => setCreating(false)}
        projects={claimedProjects}
        initialProjectId={project.projectId}
        onCreated={() => {
          dispatch(invalidateQueries('managerProjectRequirements'))
          dashboard.reload()
          set({ tab: undefined, show: undefined })
        }}
      />
    </div>
  )
}
