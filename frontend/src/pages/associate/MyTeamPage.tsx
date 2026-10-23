import { UsersRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../components/dashboard/Panel'
import { Dropdown } from '../../components/ui/Dropdown'
import RefreshButton from '../../components/ui/RefreshButton'
import { useQuery } from '../../hooks/useQuery'
import type { MyProjectDTO } from '../../services/associate/work.service'
import { humanize, initialsOf, parseServerDate } from '../../utils/format'
import { formatDay } from '../admin/employees/employeeUi'
import PageHeader from './PageHeader'
import { Card, Tag } from './ui'

/** Latest assignment first, so the default project is the one they were most recently given. */
function newestFirst(a: MyProjectDTO, b: MyProjectDTO): number {
  const at = a.myStartDate ? parseServerDate(a.myStartDate).getTime() : 0
  const bt = b.myStartDate ? parseServerDate(b.myStartDate).getTime() : 0
  return bt - at
}

/** The projects the associate is on. A dropdown picks one; the newest assignment is shown by default. */
export default function MyTeamPage() {
  const projects = useQuery('associateProjects', {})
  const sorted = useMemo(() => [...(projects.data ?? [])].sort(newestFirst), [projects.data])
  const [picked, setPicked] = useState<string | null>(null)
  const current = sorted.find((p) => p.projectId === picked) ?? sorted[0]

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <PageHeader
        eyebrow="My work"
        title="My team"
        sub="Your project and the people on it."
        actions={
          <>
            {sorted.length > 1 && (
              <div className="w-72 max-w-full">
                <Dropdown
                  ariaLabel="Project"
                  value={current?.projectId ?? ''}
                  onChange={(v) => setPicked(v)}
                  options={sorted.map((p) => ({ value: p.projectId, label: p.projectName, hint: p.projectId }))}
                />
              </div>
            )}
            <RefreshButton onClick={projects.refresh} loading={projects.loading} />
          </>
        }
      />

      {projects.error && !projects.data ? (
        <div className={`${TILE_SURFACE} p-5`}>
          <PanelError message={projects.error} status={projects.status} onRetry={projects.refresh} />
        </div>
      ) : !projects.data ? (
        <Skeleton className="h-64 rounded-3xl" />
      ) : !current ? (
        <div className={`${TILE_SURFACE} px-6 py-12`}>
          <EmptyState icon={<UsersRound className="h-5 w-5" />}>You are not on a project right now.</EmptyState>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-5">
          <Card title={`Team · ${current.projectName}`} note={`${current.team.length} people`}>
            <ul className="grid">
              {current.team.map((m) => {
                const [first = '', ...rest] = m.name.split(' ')
                return (
                  <li key={m.employeeId} className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 py-2.5 last:border-b-0 dark:border-white/6">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-brand-400 to-emerald-700 text-xs font-bold text-white">{initialsOf(first, rest.join(' '))}</span>
                    <span className="min-w-0">
                      <b className="block truncate text-sm font-semibold text-ink-900 dark:text-white">
                        {m.name}
                        {m.me && <span className="ml-2 text-xs font-medium text-ink-500 dark:text-slate-400">(you)</span>}
                      </b>
                      <small className="block truncate text-xs text-ink-500 dark:text-slate-400">
                        {[m.employeeId, m.designation, m.hoursPerDay != null ? `${m.hoursPerDay} h a day` : null].filter(Boolean).join(' · ')}
                      </small>
                    </span>
                    <Tag tone={m.role === 'MANAGER' ? 'ok' : 'muted'}>{m.role === 'MANAGER' ? 'Manager' : m.role ? humanize(m.role) : 'Member'}</Tag>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card title="Project details">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Fact label="Project">{current.projectName}</Fact>
              <Fact label="Client">{current.clientName}</Fact>
              <Fact label="Manager">{current.managerName}{current.managerEmail ? ` · ${current.managerEmail}` : ''}</Fact>
              <Fact label="Project status">{current.status ? humanize(current.status) : undefined}</Fact>
              <Fact label="Your hours">{current.myHoursPerDay != null ? `${current.myHoursPerDay} h a day` : undefined}</Fact>
              <Fact label="Your role">{current.myRole ? humanize(current.myRole) : undefined}</Fact>
              <Fact label="On it since">{current.myStartDate ? formatDay(current.myStartDate) : undefined}</Fact>
              <Fact label="Project runs">{[current.projectStartDate ? formatDay(current.projectStartDate) : null, current.projectEndDate ? formatDay(current.projectEndDate) : null].filter(Boolean).join(' to ') || undefined}</Fact>
            </dl>
            {current.description && <p className="text-sm text-ink-700 dark:text-slate-300">{current.description}</p>}
          </Card>
        </div>
      )}
    </div>
  )
}

function Fact({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold tracking-widest text-ink-500 uppercase dark:text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink-900 dark:text-white">{children || '—'}</dd>
    </div>
  )
}
