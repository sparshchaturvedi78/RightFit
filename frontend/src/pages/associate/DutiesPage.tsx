import { ClipboardList } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../components/dashboard/Panel'
import { Dropdown } from '../../components/ui/Dropdown'
import RefreshButton from '../../components/ui/RefreshButton'
import type { DutyDTO } from '../../services/associate/work.service'
import { humanize } from '../../utils/format'
import { useAssociateState } from './associateState'
import PageHeader from './PageHeader'
import { Card, Due, Row, Tag } from './ui'

const ROLE: Record<string, { title: string; what: string }> = {
  SOURCER: { title: 'Sourcing', what: 'Find people for these requirements and shortlist the ones who fit.' },
  COORDINATOR: { title: 'Coordination', what: 'Invite shortlisted people and book interviews once they accept.' },
}

/** Requirement statuses an associate's duties can be in, as the filter offers them. */
const STATUS_OPTIONS = [
  { value: '', label: 'Any status' },
  { value: 'PUBLISHED', label: 'Active' },
  { value: 'ON_HOLD', label: 'On hold' },
]

function todo(d: DutyDTO): string | null {
  if (d.responsibility === 'SOURCER') return d.toShortlist ? `${d.toShortlist} to shortlist` : null
  const parts = [d.toInvite ? `${d.toInvite} to invite` : null, d.toBook ? `${d.toBook} to book` : null].filter(Boolean)
  return parts.length ? parts.join(' · ') : null
}

/**
 * Requirements where the associate is a SOURCER or COORDINATOR, filterable by project and status. Interviewer work
 * lives in Interviews on my duties.
 */
export default function DutiesPage() {
  const { duties } = useAssociateState()
  const [project, setProject] = useState('')
  const [status, setStatus] = useState('')
  const all = (duties.data ?? []).filter((d) => d.responsibility !== 'INTERVIEWER')
  const projects = useMemo(() => [...new Set(all.map((d) => d.projectName))].sort(), [all])
  const list = all.filter((d) => (!project || d.projectName === project) && (!status || d.requirementStatus === status))

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <PageHeader eyebrow="Hiring duties" title="My duties" sub="Managers gave you these responsibilities on their requirements." actions={<RefreshButton onClick={duties.refresh} loading={duties.loading} />} />

      {duties.data && all.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5 text-xs font-semibold text-ink-500 dark:text-slate-400">
            Project
            <Dropdown ariaLabel="Project" value={project} onChange={setProject} options={[{ value: '', label: 'All my projects' }, ...projects.map((p) => ({ value: p, label: p }))]} />
          </div>
          <div className="grid gap-1.5 text-xs font-semibold text-ink-500 dark:text-slate-400">
            Status
            <Dropdown ariaLabel="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
          </div>
        </div>
      )}

      {duties.error && !duties.data ? (
        <div className={`${TILE_SURFACE} p-5`}>
          <PanelError message={duties.error} status={duties.status} onRetry={duties.refresh} />
        </div>
      ) : !duties.data ? (
        <Skeleton className="h-48 rounded-3xl" />
      ) : all.length === 0 ? (
        <div className={`${TILE_SURFACE} px-6 py-12`}>
          <EmptyState icon={<ClipboardList className="h-5 w-5" />}>You have no sourcing or coordination duties right now.</EmptyState>
        </div>
      ) : list.length === 0 ? (
        <div className={`${TILE_SURFACE} px-6 py-12`}>
          <EmptyState icon={<ClipboardList className="h-5 w-5" />}>Nothing matches these filters.</EmptyState>
        </div>
      ) : (
        ['SOURCER', 'COORDINATOR'].map((role) => {
          const mine = list.filter((d) => d.responsibility === role)
          if (mine.length === 0) return null
          return (
            <Card key={role} title={ROLE[role].title} note={`${mine.length} requirement${mine.length === 1 ? '' : 's'}`}>
              <p className="text-xs text-ink-500 dark:text-slate-400">{ROLE[role].what}</p>
              {mine.map((d) => (
                <Row
                  key={d.requirementId}
                  title={
                    <Link to={`/associate/duties/${d.requirementId}`} className="hover:text-brand-600 dark:hover:text-brand-400">
                      {d.requirementId} · {d.positionTitle}
                    </Link>
                  }
                  detail={`${d.projectName} · ${humanize(d.requirementStatus)}`}
                  aside={todo(d) ? <Due>{todo(d)}</Due> : <Tag>Nothing waiting</Tag>}
                />
              ))}
            </Card>
          )
        })
      )}
    </div>
  )
}
