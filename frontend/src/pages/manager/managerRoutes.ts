/**
 * Manager pages that exist today. A dashboard card links to a page only once it is listed here (and `ready` in
 * roleNav.ts), so nothing opens a blank screen. Add each page's path when it ships.
 */
const READY_PATHS = ['/manager/dashboard', '/manager/projects', '/manager/people', '/manager/employees', '/manager/requirements', '/manager/interviews', '/manager/allocation-requests', '/manager/candidates', '/manager/reports']

export function isManagerPageReady(to: string): boolean {
  const path = to.split(/[?#]/)[0]
  return READY_PATHS.some((p) => path === p || path.startsWith(`${p}/`))
}
