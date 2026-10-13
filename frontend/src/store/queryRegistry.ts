import { adminEmployeeService, type EmployeeListFilters } from '../services/admin/employee.service'

/**
 * Parameterised page data (lists with search / filters / paging) kept in the Redux store, one entry per distinct
 * set of parameters. Add new list pages here (e.g. projects) and read them with `useQuery`.
 */
export const QUERY_FETCHERS = {
  employees: (params: EmployeeListFilters) => adminEmployeeService.list(params),
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
