import { adminAssignmentService, type HandoverKind } from '../services/admin/assignment.service'
import { adminEmployeeService, type EmployeeListFilters } from '../services/admin/employee.service'
import { adminProjectService, type ProjectListFilters } from '../services/admin/project.service'
import { adminRmgService, type RmgListFilters } from '../services/admin/rmg.service'

/**
 * Parameterised page data (lists with search / filters / paging) kept in the Redux store, one entry per distinct
 * set of parameters. Add new list pages here (e.g. projects) and read them with `useQuery`.
 */
export const QUERY_FETCHERS = {
  employees: (params: EmployeeListFilters) => adminEmployeeService.list(params),
  projects: (params: ProjectListFilters) => adminProjectService.list(params),
  /** One page of a project's team, optionally filtered by grade — shown in the project's details. */
  projectTeam: (params: { projectId: string; grade?: string; page: number; size: number }) =>
    adminProjectService.team(params.projectId, params.grade, params.page, params.size),
  /** Where one employee works (projects managed / allocated) — shown in their profile. */
  employeeProjects: (params: { employeeId: string }) => adminEmployeeService.projects(params.employeeId),
  rmgs: (params: RmgListFilters) => adminRmgService.list(params),
  /** Assignments page: who has left but still holds projects / people. */
  // No parameters: the empty object only gives it a store key like every other entry.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  pendingHandovers: (_params: Record<string, never>) => adminAssignmentService.pending(),
  /** Assignments page: what one person would hand over (projects for a manager, people for an RMG). */
  handoverPreview: (params: { kind: HandoverKind; employeeId: string }) =>
    adminAssignmentService.preview(params.kind, params.employeeId),
  /** One page of the associates reporting to an RMG, optionally one workforce bucket — shown in the RMG's details. */
  rmgTeam: (params: { rmgId: string; workforce?: string; page: number; size: number }) =>
    adminRmgService.team(params.rmgId, params.workforce, params.page, params.size),
} as const

export type QueryNamespace = keyof typeof QUERY_FETCHERS
export type QueryParams<N extends QueryNamespace> = Parameters<(typeof QUERY_FETCHERS)[N]>[0]
export type QueryData<N extends QueryNamespace> = Awaited<ReturnType<(typeof QUERY_FETCHERS)[N]>>

/** Stable store key for a namespace + params (key order and empty values don't matter). */
export function queryKey(namespace: QueryNamespace, params: object): string {
  const clean = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
  return `${namespace}?${clean.map(([k, v]) => `${k}=${String(v)}`).join('&')}`
}
