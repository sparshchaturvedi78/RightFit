import { ClipboardList } from 'lucide-react'
import { AsyncBody, EmptyState, Panel, Skeleton } from '../../../components/dashboard/Panel'
import type { AsyncResult } from '../../../hooks/useAsyncData'
import type { ManagerDashboardDTO } from '../../../services/manager/dashboard.service'
import ManagerLink from '../ManagerLink'
import RequirementRow from '../RequirementRow'

/** The manager's open requirements: pipeline at a glance, and who owns sourcing, interviewing and coordinating. */
export default function RequirementsPanel({ state }: { state: AsyncResult<ManagerDashboardDTO> }) {
  return (
    <Panel
      title="Open requirements"
      subtitle="Where candidates are, and who owns each step"
      icon={<ClipboardList className="h-4 w-4" />}
      action={
        <ManagerLink to="/manager/requirements" className="text-xs font-semibold text-brand-600 dark:text-brand-400" hoverClassName="hover:underline">
          See all
        </ManagerLink>
      }
    >
      <AsyncBody
        state={state}
        skeleton={
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        }
      >
        {(d) =>
          d.openRequirements.length === 0 ? (
            <EmptyState icon={<ClipboardList className="h-5 w-5" />}>No open requirements. Create one from a project you manage.</EmptyState>
          ) : (
            <div className="-mx-3 grid divide-y divide-slate-100 dark:divide-white/6">
              {d.openRequirements.map((r) => (
                <RequirementRow key={r.requirementId} r={r} />
              ))}
            </div>
          )
        }
      </AsyncBody>
    </Panel>
  )
}
