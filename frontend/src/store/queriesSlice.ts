import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { getApiErrorMessage } from '../services/httpClient'
import { sessionEnded, signedIn } from './authSlice'
import { QUERY_FETCHERS, type QueryNamespace } from './queryRegistry'

export interface QueryEntry {
  namespace: QueryNamespace
  data: unknown
  loaded: boolean
  loading: boolean
  /** Set by `invalidateQueries`: the data is shown as-is but refetched the next time it's on screen. */
  stale: boolean
  error: string | null
  status: number | null
  /** Last time this entry was loaded or viewed — used to drop the least recently used ones. */
  usedAt: number
}

interface QueriesState {
  entries: Record<string, QueryEntry>
}

const initialState: QueriesState = { entries: {} }

/** Distinct filter/page combinations kept per page; older ones are dropped first. */
const MAX_ENTRIES_PER_NAMESPACE = 30

interface FetchArgs {
  key: string
  namespace: QueryNamespace
  params: unknown
  /** Refetch even when fresh data is already in the store. */
  force?: boolean
}

interface Failure {
  message: string
  status: number | null
}

export const fetchQuery = createAsyncThunk<
  { data: unknown; at: number },
  FetchArgs,
  { state: { queries: QueriesState }; rejectValue: Failure }
>(
  'queries/fetch',
  async ({ namespace, params }, { rejectWithValue }) => {
    try {
      const fetcher = QUERY_FETCHERS[namespace] as (p: unknown) => Promise<unknown>
      return { data: await fetcher(params), at: Date.now() }
    } catch (err) {
      const status =
        typeof err === 'object' && err !== null && 'response' in err
          ? ((err as { response?: { status?: number } }).response?.status ?? null)
          : null
      return rejectWithValue({ message: getApiErrorMessage(err, "Couldn't load this list."), status })
    }
  },
  {
    // Stored and not invalidated -> no request at all; a request already on its way is reused.
    condition: ({ key, force }, { getState }) => {
      const entry = getState().queries.entries[key]
      if (entry?.loading) return false
      if (entry?.loaded && !entry.stale && !force) return false
      return true
    },
  },
)

function prune(state: QueriesState, namespace: QueryNamespace) {
  const keys = Object.keys(state.entries).filter((k) => state.entries[k].namespace === namespace)
  if (keys.length <= MAX_ENTRIES_PER_NAMESPACE) return
  keys
    .sort((a, b) => state.entries[a].usedAt - state.entries[b].usedAt)
    .slice(0, keys.length - MAX_ENTRIES_PER_NAMESPACE)
    .forEach((k) => delete state.entries[k])
}

const queriesSlice = createSlice({
  name: 'queries',
  initialState,
  reducers: {
    /** After a change (create / edit / Refresh): every stored list of this page reloads when next shown. */
    invalidateQueries: (state, action: PayloadAction<QueryNamespace>) => {
      for (const entry of Object.values(state.entries)) {
        if (entry.namespace === action.payload) entry.stale = true
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuery.pending, (state, { meta }) => {
        const prev = state.entries[meta.arg.key]
        state.entries[meta.arg.key] = {
          namespace: meta.arg.namespace,
          data: prev?.data ?? null,
          loaded: prev?.loaded ?? false,
          loading: true,
          stale: prev?.stale ?? false,
          error: null,
          status: null,
          usedAt: prev?.usedAt ?? 0,
        }
      })
      .addCase(fetchQuery.fulfilled, (state, { meta, payload }) => {
        if (!state.entries[meta.arg.key]) return // cleared (logout) while in flight
        state.entries[meta.arg.key] = {
          namespace: meta.arg.namespace,
          data: payload.data,
          loaded: true,
          loading: false,
          stale: false,
          error: null,
          status: null,
          usedAt: payload.at,
        }
        prune(state, meta.arg.namespace)
      })
      .addCase(fetchQuery.rejected, (state, { meta, payload }) => {
        const entry = state.entries[meta.arg.key]
        if (!entry) return
        entry.loading = false
        // A failed refresh keeps showing the stored list.
        entry.error = entry.loaded ? null : (payload?.message ?? "Couldn't load this list.")
        entry.status = entry.loaded ? null : (payload?.status ?? null)
      })
      // Stored lists belong to one user's session.
      .addCase(sessionEnded, () => initialState)
      .addCase(signedIn, () => initialState)
  },
})

export const { invalidateQueries } = queriesSlice.actions
export default queriesSlice.reducer
