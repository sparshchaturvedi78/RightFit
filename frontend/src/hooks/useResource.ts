import { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../store'
import type { ResourceData, ResourceKey } from '../store/resourceRegistry'
import { loadResource } from '../store/resourcesSlice'

/**
 * Page data held in the Redux store. The first screen to ask for a key loads it; every later visit reads the
 * store with no request. `reload` forces a refetch while the current data stays on screen.
 */
export function useResource<K extends ResourceKey>(key: K) {
  const dispatch = useAppDispatch()
  const entry = useAppSelector((s) => s.resources.entries[key])

  useEffect(() => {
    void dispatch(loadResource({ key }))
  }, [dispatch, key])

  const reload = useCallback(() => {
    void dispatch(loadResource({ key, force: true }))
  }, [dispatch, key])

  return {
    data: (entry?.data ?? null) as ResourceData<K> | null,
    error: entry?.error ?? null,
    status: entry?.status ?? null,
    loading: entry ? entry.loading : true,
    reload,
  }
}
