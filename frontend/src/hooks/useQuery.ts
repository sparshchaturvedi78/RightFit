import { useCallback, useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store'
import { fetchQuery, invalidateQueries } from '../store/queriesSlice'
import { queryKey, type QueryData, type QueryNamespace, type QueryParams } from '../store/queryRegistry'

/**
 * A list page's data from the Redux store. Each search / filter / page combination is fetched once and then
 * served from the store on every later visit — no request — until `refresh()` or `invalidateQueries` marks the
 * page's lists stale (then the stored copy stays on screen while the new one loads).
 */
export function useQuery<N extends QueryNamespace>(namespace: N, params: QueryParams<N>) {
  const dispatch = useAppDispatch()
  const key = queryKey(namespace, params)
  const entry = useAppSelector((s) => s.queries.entries[key])
  const stale = entry?.stale ?? false

  // `key` is derived from `params`, so it is the dependency that matters; params is read when the key changes.
  const [paramsForKey, setParamsForKey] = useState({ key, params })
  if (paramsForKey.key !== key) setParamsForKey({ key, params })

  useEffect(() => {
    void dispatch(fetchQuery({ key: paramsForKey.key, namespace, params: paramsForKey.params }))
  }, [dispatch, namespace, paramsForKey, stale])

  // While a new combination loads for the first time, keep the previous one on screen (dimmed by the caller).
  const [previous, setPrevious] = useState<QueryData<N> | null>(null)
  const data = (entry?.data ?? null) as QueryData<N> | null
  if (data !== null && data !== previous) setPrevious(data)

  const refresh = useCallback(() => {
    dispatch(invalidateQueries(namespace))
  }, [dispatch, namespace])

  return {
    data: data ?? previous,
    /** True while this exact combination has no stored data yet, or is being refetched. */
    loading: !entry?.loaded || entry.loading,
    error: entry?.error ?? null,
    status: entry?.status ?? null,
    refresh,
  }
}
