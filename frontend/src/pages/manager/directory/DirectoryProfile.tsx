import { UserPlus } from 'lucide-react'
import type { ReactNode } from 'react'
import { PanelError, Skeleton } from '../../../components/dashboard/Panel'
import RefreshButton from '../../../components/ui/RefreshButton'
import { Button } from '../../../components/ui/form'
import { Drawer } from '../../../components/ui/Overlay'
import { useQuery } from '../../../hooks/useQuery'
import type { EmployeeCandidateDTO } from '../../../services/manager/employee.service'
import { humanize } from '../../../utils/format'

function Fact({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold tracking-widest text-ink-500 uppercase dark:text-slate-500">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-ink-900 dark:text-white">{value || value === 0 ? value : '—'}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <h3 className="text-[11px] font-bold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-400">{title}</h3>
      {children}
    </section>
  )
}

/** A person found in the directory: what they can do, what they would like, and an add-to-requirement action. */
export default function DirectoryProfile({
  employeeId,
  onClose,
  onAdd,
}: {
  employeeId: string
  onClose: () => void
  onAdd: (person: EmployeeCandidateDTO) => void
}) {
  const profile = useQuery('managerEmployee', { employeeId })
  const p = profile.data

  return (
    <Drawer
      open
      onClose={onClose}
      title={p?.name ?? employeeId}
      subtitle={[employeeId, p?.designation].filter(Boolean).join(' · ')}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <RefreshButton onClick={profile.refresh} loading={profile.loading} />
          {p && (
            <Button variant="primary" onClick={() => onAdd(p)} icon={<UserPlus className="h-4 w-4" />}>
              Add to requirement
            </Button>
          )}
        </div>
      }
    >
      {profile.error && !p ? (
        <PanelError message={profile.error} status={profile.status} onRetry={profile.refresh} />
      ) : !p ? (
        <div className="grid gap-3">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : (
        <div className="grid gap-7">
          <div className="flex flex-wrap gap-2">
            {p.availabilityStatus && <span className="rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{humanize(p.availabilityStatus)}</span>}
            {p.workingHoursPerDay != null && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-ink-700 dark:bg-white/8 dark:text-slate-300">
                Free {Math.max(0, p.workingHoursPerDay - (p.allocatedHoursPerDay ?? 0))} h a day
              </span>
            )}
          </div>

          <Section title="Details">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Fact label="Grade" value={p.grade} />
              <Fact label="Domain" value={p.domain} />
              <Fact label="Experience" value={p.yearsOfExperience != null ? `${p.yearsOfExperience} years` : null} />
              <Fact label="Location" value={p.location} />
              <Fact label="Email" value={p.email} />
              <Fact label="Available from" value={p.availableFromDate} />
            </dl>
          </Section>

          {p.pipeline && p.pipeline.length > 0 && (
            <Section title="In your pipelines">
              <ul className="grid gap-2">
                {p.pipeline.map((x) => (
                  <li key={x.applicationId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 dark:border-white/10">
                    <span className="min-w-0">
                      <b className="block truncate text-sm font-semibold text-ink-900 dark:text-white">
                        {x.requirementId} · {x.positionTitle ?? ''}
                      </b>
                      <small className="block truncate text-xs text-ink-500 dark:text-slate-400">{x.projectName}</small>
                    </span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-ink-700 dark:bg-white/8 dark:text-slate-300">
                      {humanize(x.status)}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Skills">
            {p.skills && p.skills.length > 0 ? (
              <ul className="grid gap-2.5">
                {p.skills.map((s) => (
                  <li key={s.skill} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
                    <span className="truncate text-ink-900 dark:text-white">{s.skill}</span>
                    <span className="text-xs text-ink-500 tabular-nums dark:text-slate-400">
                      {s.proficiency != null ? `${s.proficiency}/10` : '—'}
                      {s.yearsOfExperience != null && ` · ${s.yearsOfExperience} yrs`}
                    </span>
                    {s.proficiency != null && (
                      <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/8">
                        <i className="block h-full rounded-full bg-brand-500" style={{ width: `${Math.min(100, s.proficiency * 10)}%` }} />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-500 dark:text-slate-400">No skills recorded yet.</p>
            )}
          </Section>

          <Section title="Certifications">
            {p.certifications && p.certifications.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {p.certifications.map((c) => (
                  <li key={c} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-ink-700 dark:bg-white/8 dark:text-slate-300">
                    {c}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-500 dark:text-slate-400">None recorded.</p>
            )}
          </Section>

          <Section title="Would like">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Fact label="Technology" value={p.preferences?.preferredTechnology} />
              <Fact label="Domain" value={p.preferences?.preferredDomain} />
              <Fact label="Work mode" value={p.preferences?.preferredWorkMode} />
              <Fact label="Location" value={p.preferences?.preferredLocation} />
            </dl>
          </Section>

          <Section title="Current projects">
            {p.currentProjects && p.currentProjects.length > 0 ? (
              <p className="text-sm text-ink-900 dark:text-white">{p.currentProjects.join(', ')}</p>
            ) : (
              <p className="text-sm text-ink-500 dark:text-slate-400">Not on a project right now.</p>
            )}
          </Section>
        </div>
      )}
    </Drawer>
  )
}
