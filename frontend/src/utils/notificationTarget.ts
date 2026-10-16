import { isManagerPageReady } from '../pages/manager/managerRoutes'

/**
 * The page a notification is about, or null when there isn't one (yet). Only Managers get a target for now; a
 * notification for a page that isn't built is left alone instead of opening an empty screen.
 */
export function notificationTarget(n: { entityType?: string; entityRef?: string }, roles: string[] = []): string | null {
  if (!n.entityType || !n.entityRef || !roles.includes('MANAGER') || roles.includes('ADMIN')) return null
  const paths: Record<string, string> = {
    PROJECT: `/manager/projects/${n.entityRef}`,
    REQUIREMENT: `/manager/requirements/${n.entityRef}`,
    CANDIDATE: `/manager/candidates/${n.entityRef}`,
    INTERVIEW: `/manager/interviews/${n.entityRef}`,
    ALLOCATION_REQUEST: `/manager/allocation-requests/${n.entityRef}`,
    // Someone was moved or added: the people page shows where everyone works now.
    ALLOCATION: '/manager/people',
  }
  const target = paths[n.entityType]
  return target && isManagerPageReady(target) ? target : null
}
