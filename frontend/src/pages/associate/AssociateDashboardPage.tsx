import { PanelError, Skeleton, TILE_SURFACE } from '../../components/dashboard/Panel'
import { useAssociateState } from './associateState'
import AllocatedDashboard from './dashboard/AllocatedDashboard'
import PoolDashboard from './dashboard/PoolDashboard'

/** One dashboard, two situations: on a project (allocated) or in the resource pool. */
export default function AssociateDashboardPage() {
  const { dashboard, allocated, ready } = useAssociateState()

  if (dashboard.error && !dashboard.data) {
    return (
      <div className="mx-auto max-w-350">
        <div className={`${TILE_SURFACE} p-5`}>
          <PanelError message={dashboard.error} status={dashboard.status} onRetry={dashboard.refresh} />
        </div>
      </div>
    )
  }
  if (!ready) {
    return (
      <div className="mx-auto grid max-w-350 gap-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Skeleton className="h-80 rounded-[26px]" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
        <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
      </div>
    )
  }
  return allocated ? <AllocatedDashboard /> : <PoolDashboard />
}
