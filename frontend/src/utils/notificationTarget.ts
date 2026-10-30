import { isManagerPageReady } from '../pages/manager/managerRoutes'

/**
 * The page a notification is about, or null when there isn't one. Managers and associates each get targets: a
 * notification opens the screen where that thing lives. Pages that aren't built are left alone rather than opening
 * an empty screen.
 */
export function notificationTarget(n: { entityType?: string; entityRef?: string }, roles: string[] = []): string | null {
  if (!n.entityType) return null
  if (roles.includes('ADMIN')) return adminTarget(n.entityType, n.entityRef)
  if (roles.includes('RMG') && !roles.includes('MANAGER')) return rmgTarget(n.entityType)
  if (roles.includes('MANAGER')) return managerTarget(n.entityType, n.entityRef)
  if (roles.includes('ASSOCIATE')) return associateTarget(n.entityType, n.entityRef)
  return null
}

function adminTarget(entityType: string, entityRef?: string): string | null {
  const q = entityRef ? `?q=${encodeURIComponent(entityRef)}` : ''
  const paths: Record<string, string> = {
    PROJECT: `/admin/projects${q}`,
    EMPLOYEE: `/admin/employees${q}`,
  }
  return paths[entityType] ?? null
}

/** An RMG's notifications open the page where they can act on them. */
function rmgTarget(entityType: string): string | null {
  const paths: Record<string, string> = {
    ALLOCATION_REQUEST: '/rmg/allocation-requests',
    ALLOCATION: '/rmg/allocation-requests',
    EMPLOYEE_AVAILABILITY: '/rmg/availability',
    TRAINING_ASSIGNMENT: '/rmg/training',
    CANDIDATE: '/rmg/recommendations',
    EMPLOYEE: '/rmg/pool',
    PROJECT: '/rmg/dashboard',
  }
  return paths[entityType] ?? null
}

function managerTarget(entityType: string, entityRef?: string): string | null {
  // Everything below needs a reference, except the list pages a notification falls back to.
  const ref = entityRef ?? ''
  const paths: Record<string, string> = {
    PROJECT: ref ? `/manager/projects/${ref}` : '/manager/projects',
    REQUIREMENT: ref ? `/manager/requirements/${ref}` : '/manager/requirements',
    CANDIDATE: ref ? `/manager/candidates/${ref}` : '/manager/requirements',
    INTERVIEW: ref ? `/manager/interviews/${ref}` : '/manager/interviews',
    ALLOCATION_REQUEST: ref ? `/manager/allocation-requests/${ref}` : '/manager/allocation-requests',
    // Someone was moved or added: the people page shows where everyone works now.
    ALLOCATION: '/manager/people',
    EMPLOYEE: '/manager/people',
    INVITATION: '/manager/requirements',
    RMG: '/manager/requirements',
  }
  const target = paths[entityType]
  return target && isManagerPageReady(target) ? target : null
}

/**
 * Associates have no per-item pages for most things, so each kind of notification opens the list where it can be
 * answered: invitations and selections, interviews, the project they are on, or training.
 */
function associateTarget(entityType: string, entityRef?: string): string | null {
  // A requirement a sourcer or coordinator works on opens its duty screen.
  if (entityType === 'DUTY') return entityRef ? `/associate/duties/${entityRef}` : '/associate/duties'
  const paths: Record<string, string> = {
    CANDIDATE: '/associate/invitations',
    INVITATION: '/associate/invitations',
    INTERVIEW: '/associate/interviews',
    ALLOCATION: '/associate/team',
    ALLOCATION_REQUEST: '/associate/team',
    PROJECT: '/associate/team',
    REQUIREMENT: '/associate/projects',
    TRAINING_ASSIGNMENT: '/associate/training',
    EMPLOYEE: '/associate/dashboard',
    RMG: '/associate/dashboard',
  }
  return paths[entityType] ?? null
}
