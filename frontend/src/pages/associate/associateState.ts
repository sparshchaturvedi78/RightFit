import { useQuery } from '../../hooks/useQuery'

/**
 * Where the associate stands: on a project (allocated) or in the pool, and which hiring responsibilities they hold.
 * The sidebar and every page read this, so they always agree.
 */
export function useAssociateState() {
  const dashboard = useQuery('associateDashboard', {})
  const duties = useQuery('associateDuties', {})
  const d = dashboard.data
  const allocated = Boolean(d && ((d.currentAllocations?.length ?? 0) > 0 || d.allocationStatus === 'ALLOCATED'))
  const roles = [...new Set((duties.data ?? []).map((x) => x.responsibility))]
  return { dashboard, duties, allocated, roles, ready: Boolean(d) }
}
