import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage } from '../services/httpClient'

interface AsyncState<T> {
  data: T | null
  error: string | null
  status: number | null
  loading: boolean
}

/** The shape every panel receives; `useAsyncData` and the Redux-backed `useResource` both return it. */
export interface AsyncResult<T> extends AsyncState<T> {
  reload: () => void
}

/**
 * Loads data on mount (and again on `reload`) without keeping it anywhere — for small live widgets such as
 * the notification bell. Page data that should survive navigation belongs in the Redux store (`useResource`).
 * `fetcher` must be a stable reference.
 */
export function useAsyncData<T>(fetcher: () => Promise<T>): AsyncResult<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, status: null, loading: true })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, error: null, status: null, loading: false })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const status =
          typeof err === 'object' && err !== null && 'response' in err
            ? ((err as { response?: { status?: number } }).response?.status ?? null)
            : null
        setState({ data: null, error: getApiErrorMessage(err, "Couldn't load this section."), status, loading: false })
      })
    return () => {
      cancelled = true
    }
  }, [fetcher, attempt])

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null, status: null }))
    setAttempt((a) => a + 1)
  }, [])

  return { ...state, reload }
}
