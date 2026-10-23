import { isManagerPageReady } from '../pages/manager/managerRoutes'

/**
 * The page a notification is about, or null when there isn't one. Managers and associates each get targets: a
 * notification opens the screen where that thing lives. Pages that aren't built are left alone rather than opening
 * an empty screen.
 */
export function notificationTarget(n: { entityType?: string; entityRef?: string }, roles: string[] = []): string | null {
  if (!n.entityType || !n.entityRef) return null
  if (roles.includes('ADMIN')) return null
  if (roles.includes('MANAGER')) return managerTarget(n.entityType, n.entityRef)
  if (roles.includes('ASSOCIATE')) return associateTarget(n.entityType)
  return null
}

function managerTarget(entityType: string, entityRef: string): string | null {
  const paths: Record<string, string> = {
    PROJECT: `/manager/projects/${entityRef}`,
    REQUIREMENT: `/manager/requirements/${entityRef}`,
    CANDIDATE: `/manager/candidates/${entityRef}`,
    INTERVIEW: `/manager/interviews/${entityRef}`,
    ALLOCATION_REQUEST: `/manager/allocation-requests/${entityRef}`,
    // Someone was moved or added: the people page shows where everyone works now.
    ALLOCATION: '/manager/people',
  }
  const target = paths[entityType]
  return target && isManagerPageReady(target) ? target : null
}

/**
 * Associates have no per-item pages for most things, so each kind of notification opens the list where it can be
 * answered: invitations and selections, interviews, the project they are on, or training.
 */
function associateTarget(entityType: string): string | null {
  const paths: Record<string, string> = {
    CANDIDATE: '/associate/invitations',
    INTERVIEW: '/associate/interviews',
    ALLOCATION: '/associate/team',
    ALLOCATION_REQUEST: '/associate/team',
    PROJECT: '/associate/team',
    REQUIREMENT: '/associate/projects',
    TRAINING_ASSIGNMENT: '/associate/training',
  }
  return paths[entityType] ?? null
}
