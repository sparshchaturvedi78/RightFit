import { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../store'
import type { ResourceData, ResourceKey } from '../store/resourceRegistry'
import { loadResource } from '../store/resourcesSlice'

/**
 * Page data held in the Redux store. The first screen to ask for a key loads it; every later visit reads the
 * store with no request. `reload` forces a refetch while the current data stays on screen.
 * `revalidateOnMount`: still show the stored copy instantly, but quietly refetch it each time the page opens
 * (for reference data such as locations that can change on the server between visits).
 */
export function useResource<K extends ResourceKey>(key: K, { revalidateOnMount = false } = {}) {
  const dispatch = useAppDispatch()
  const entry = useAppSelector((s) => s.resources.entries[key])

  useEffect(() => {
    void dispatch(loadResource({ key, force: revalidateOnMount }))
  }, [dispatch, key, revalidateOnMount])

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
