import { ArrowLeftRight, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PanelError, Skeleton } from '../../../components/dashboard/Panel'
import { Button } from '../../../components/ui/form'
import { Drawer } from '../../../components/ui/Overlay'
import { useQuery } from '../../../hooks/useQuery'
import type { ProjectDTO } from '../../../services/admin/project.service'
import { humanize } from '../../../utils/format'
import { formatDay } from '../../admin/employees/employeeUi'
import ManagerLink from '../ManagerLink'
import CapacityBar from './CapacityBar'
import LinkToProjectDialog from './LinkToProjectDialog'
import MoveDialog from './MoveDialog'
import RemoveFromTeamDialog from '../projects/RemoveFromTeamDialog'
import RefreshButton from '../../../components/ui/RefreshButton'

function Fact({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold tracking-[0.1em] text-ink-500 uppercase dark:text-slate-500">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-ink-900 dark:text-white">{value || value === 0 ? value : '—'}</dd>
    </div>
  )
}

function Loaded({ employeeId, onClose, projects, onChanged }: { employeeId: string; onClose: () => void; projects: ProjectDTO[]; onChanged: () => void }) {
  const profile = useQuery('managerEmployee', { employeeId })
  const people = useQuery('managerPeople', {})

  // The people list is kept in the store, so it can be from before this person joined a project. Refresh it on open.
  const refreshPeople = people.refresh
  useEffect(() => {
    refreshPeople()
  }, [refreshPeople])
  const [linking, setLinking] = useState(false)
  const [movingFrom, setMovingFrom] = useState<string | null>(null)
  const [removing, setRemoving] = useState<{ projectId: string; projectName: string } | null>(null)

  const p = profile.data
  const person = people.data?.find((x) => x.employeeId === employeeId) ?? null
  const mine = new Set(person?.projects.map((x) => x.projectId))
  const canLink = Boolean(person) && projects.some((x) => x.status === 'ACTIVE' && !mine.has(x.projectId))

  function changed() {
    people.refresh()
    onChanged()
  }

  function refreshAll() {
    profile.refresh()
    people.refresh()
  }

  return (
    <>
      <Drawer open onClose={onClose} title={p?.name ?? employeeId} subtitle={[employeeId, p?.designation].filter(Boolean).join(' · ')}
        footer={<div className="flex justify-end"><RefreshButton onClick={refreshAll} loading={profile.loading || people.loading} /></div>}
      >
        {profile.error && !p ? (
          <PanelError message={profile.error} status={profile.status} onRetry={profile.refresh} />
        ) : !p ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6">
            <section className="grid gap-3">
              <h3 className="text-[11px] font-bold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-500">Their day</h3>
              <CapacityBar working={person?.workingHoursPerDay ?? p.workingHoursPerDay} booked={person?.allocatedHoursPerDay ?? p.allocatedHoursPerDay} />
            </section>

            <section className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[11px] font-bold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-500">On your projects</h3>
                {person && (
                  <Button variant="primary" className="px-3 py-1.5" icon={<Plus className="h-4 w-4" />} onClick={() => setLinking(true)} disabled={!canLink} title={canLink ? undefined : 'They are on all your projects already'}>
                    Add to a project
                  </Button>
                )}
              </div>
              {!person ? (
                <p className="rounded-xl bg-slate-100/70 px-3.5 py-3 text-sm text-ink-500 dark:bg-white/5 dark:text-slate-400">Not on any of your projects.</p>
              ) : (
                <ul className="grid gap-2">
                  {person.projects.map((x) => (
                    <li key={x.projectId} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 px-3.5 py-3 dark:border-white/8">
                      <span className="min-w-0">
                        <ManagerLink to={`/manager/projects/${x.projectId}`} className="block truncate text-sm font-semibold text-ink-900 dark:text-white" hoverClassName="hover:text-brand-600 dark:hover:text-brand-400">
                          {x.projectName}
                        </ManagerLink>
                        <small className="text-xs text-ink-500 dark:text-slate-400">
                          {[x.role ? humanize(x.role) : null, x.hoursPerDay != null ? `${x.hoursPerDay} hours a day` : 'No hours booked', x.since ? `since ${formatDay(x.since.slice(0, 10))}` : null].filter(Boolean).join(' · ')}
                        </small>
                      </span>
                      {person.projects.length < projects.length && (
                        <Button variant="secondary" className="px-3 py-1.5" icon={<ArrowLeftRight className="h-4 w-4" />} onClick={() => setMovingFrom(x.projectId)}>
                          Move
                        </Button>
                      )}
                      {x.role !== 'PROJECT_MANAGER' && (
                        <button
                          type="button"
                          onClick={() => setRemoving({ projectId: x.projectId, projectName: x.projectName })}
                          className="rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="grid gap-3">
              <h3 className="text-[11px] font-bold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-500">About</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Fact label="Grade" value={p.grade} />
                <Fact label="Domain" value={p.domain} />
                <Fact label="Experience" value={p.yearsOfExperience != null ? `${p.yearsOfExperience} years` : null} />
                <Fact label="Location" value={p.location} />
                <Fact label="Availability" value={p.availabilityStatus ? humanize(p.availabilityStatus) : null} />
                <Fact label="On the bench" value={p.benchDays ? `${p.benchDays} days` : null} />
                <Fact label="Email" value={p.email} />
                <Fact label="Phone" value={p.phone} />
              </dl>
            </section>

            <section className="grid gap-2.5">
              <h3 className="text-[11px] font-bold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-500">Skills</h3>
              {p.skills && p.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {p.skills.map((s) => (
                    <span key={s.skill} className="rounded-full bg-brand-500/12 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:text-brand-400">
                      {s.skill}
                      {s.proficiency != null && <span className="ml-1.5 font-medium opacity-70">{s.proficiency}/10</span>}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-500 dark:text-slate-400">No skills recorded.</p>
              )}
            </section>

            {p.certifications && p.certifications.length > 0 && (
              <section className="grid gap-2.5">
                <h3 className="text-[11px] font-bold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-500">Certifications</h3>
                <div className="flex flex-wrap gap-1.5">
                  {p.certifications.map((c) => (
                    <span key={c} className="rounded-full bg-sky-500/12 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300">{c}</span>
                  ))}
                </div>
              </section>
            )}

            {p.preferences && (p.preferences.preferredTechnology || p.preferences.preferredDomain || p.preferences.preferredWorkMode || p.preferences.preferredLocation) && (
              <section className="grid gap-3">
                <h3 className="text-[11px] font-bold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-500">They would like</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Fact label="Technology" value={p.preferences.preferredTechnology} />
                  <Fact label="Domain" value={p.preferences.preferredDomain} />
                  <Fact label="Work mode" value={p.preferences.preferredWorkMode} />
                  <Fact label="Location" value={p.preferences.preferredLocation} />
                </dl>
              </section>
            )}
          </div>
        )}
      </Drawer>
      <LinkToProjectDialog open={linking} onClose={() => setLinking(false)} people={people.data ?? []} projects={projects} employeeId={employeeId} onDone={changed} />
      <RemoveFromTeamDialog projectId={removing?.projectId ?? ''} projectName={removing?.projectName ?? ''} member={removing && person ? { employeeId, name: person.name } : null} onClose={() => setRemoving(null)} onDone={() => { setRemoving(null); changed() }} />
      <MoveDialog open={movingFrom !== null} onClose={() => setMovingFrom(null)} person={person} fromProjectId={movingFrom ?? ''} projects={projects} onDone={changed} />
    </>
  )
}

/** One person's details, and where they work on the manager's projects. Opens from the Team tab and from My people. */
export default function EmployeeDrawer({
  employeeId,
  onClose,
  projects,
  onChanged,
}: {
  employeeId: string | null
  onClose: () => void
  /** The manager's claimed projects. */
  projects: ProjectDTO[]
  /** Called after someone is added to a project or moved, so the page behind can refresh. */
  onChanged: () => void
}) {
  return employeeId ? <Loaded key={employeeId} employeeId={employeeId} onClose={onClose} projects={projects} onChanged={onChanged} /> : null
}
