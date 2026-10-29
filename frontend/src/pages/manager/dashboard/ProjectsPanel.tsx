import { FolderKanban } from 'lucide-react'
import { AsyncBody, EmptyState, Panel, Skeleton } from '../../../components/dashboard/Panel'
import type { AsyncResult } from '../../../hooks/useAsyncData'
import type { ManagerDashboardDTO } from '../../../services/manager/dashboard.service'
import { humanize } from '../../../utils/format'
import ManagerLink from '../ManagerLink'

/** One card per project the manager runs: team size, open requirements, and whether it still needs claiming. */
export default function ProjectsPanel({ state }: { state: AsyncResult<ManagerDashboardDTO> }) {
  return (
    <Panel
      title="My projects"
      subtitle="Team size and open requirements"
      icon={<FolderKanban className="h-4 w-4" />}
      action={
        <ManagerLink to="/manager/projects" className="text-xs font-semibold text-brand-600 dark:text-brand-400" hoverClassName="hover:underline">
          See all
        </ManagerLink>
      }
    >
      <AsyncBody
        state={state}
        skeleton={
          <div className="grid gap-3 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        }
      >
        {(d) =>
          d.projectStaffing.length === 0 ? (
            <EmptyState icon={<FolderKanban className="h-5 w-5" />}>No project is assigned to you yet.</EmptyState>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {d.projectStaffing.map((p) => {
                const active = p.status === 'ACTIVE'
                return (
                  <ManagerLink
                    key={p.projectId}
                    to={`/manager/projects/${p.projectId}`}
                    className="grid gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-white/6 dark:bg-white/2"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <b className="truncate text-sm font-bold text-ink-900 dark:text-white">{p.projectName}</b>
                      <small className="flex shrink-0 items-center gap-1.5 text-xs text-ink-500 dark:text-slate-400">
                        <i className={`h-2 w-2 rounded-full ${active ? 'bg-brand-500' : 'bg-amber-500'}`} />
                        {humanize(p.status)}
                      </small>
                    </span>
                    <span className="text-2xl font-extrabold tracking-tight text-ink-900 tabular-nums dark:text-white">
                      {p.activeMembers} <span className="text-[13px] font-medium text-ink-500 dark:text-slate-400">on the team</span>
                    </span>
                    <small className="text-xs text-ink-500 dark:text-slate-400">
                      {p.openRequirements} open requirement{p.openRequirements === 1 ? '' : 's'}
                      {!p.claimed && <b className="ml-1.5 font-semibold text-amber-600 dark:text-amber-400">· Not claimed yet</b>}
                    </small>
                  </ManagerLink>
                )
              })}
            </div>
          )
        }
      </AsyncBody>
    </Panel>
  )
}
