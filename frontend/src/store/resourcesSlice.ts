import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getApiErrorMessage } from '../services/httpClient'
import { sessionEnded, signedIn } from './authSlice'
import { RESOURCE_FETCHERS, type ResourceKey } from './resourceRegistry'

export interface ResourceEntry {
  data: unknown
  loaded: boolean
  loading: boolean
  error: string | null
  status: number | null
}

interface ResourcesState {
  entries: Partial<Record<ResourceKey, ResourceEntry>>
}

const initialState: ResourcesState = { entries: {} }

interface LoadArgs {
  key: ResourceKey
  /** Refetch even if the data is already in the store (the Refresh button). */
  force?: boolean
}

interface LoadFailure {
  message: string
  status: number | null
}

export const loadResource = createAsyncThunk<
  unknown,
  LoadArgs,
  { state: { resources: ResourcesState }; rejectValue: LoadFailure }
>(
  'resources/load',
  async ({ key }, { rejectWithValue }) => {
    try {
      return await RESOURCE_FETCHERS[key]()
    } catch (err) {
      const status =
        typeof err === 'object' && err !== null && 'response' in err
          ? ((err as { response?: { status?: number } }).response?.status ?? null)
          : null
      return rejectWithValue({ message: getApiErrorMessage(err, "Couldn't load this section."), status })
    }
  },
  {
    // Already in the store (or on its way) -> no request. Data stays until logout / the session ends.
    condition: ({ key, force }, { getState }) => {
      const entry = getState().resources.entries[key]
      if (entry?.loading) return false
      if (entry?.loaded && !force) return false
      return true
    },
  },
)

const resourcesSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadResource.pending, (state, { meta }) => {
        const prev = state.entries[meta.arg.key]
        state.entries[meta.arg.key] = {
          data: prev?.data ?? null,
          loaded: prev?.loaded ?? false,
          loading: true,
          error: null,
          status: null,
        }
      })
      .addCase(loadResource.fulfilled, (state, { meta, payload }) => {
        if (!state.entries[meta.arg.key]) return // cleared (logout) while the request was in flight
        state.entries[meta.arg.key] = { data: payload, loaded: true, loading: false, error: null, status: null }
      })
      .addCase(loadResource.rejected, (state, { meta, payload }) => {
        const entry = state.entries[meta.arg.key]
        if (!entry) return
        // A failed refresh keeps the data already in the store.
        entry.loading = false
        entry.error = entry.loaded ? null : (payload?.message ?? "Couldn't load this section.")
        entry.status = entry.loaded ? null : (payload?.status ?? null)
      })
      // Stored data belongs to one user's session.
      .addCase(sessionEnded, () => initialState)
      .addCase(signedIn, () => initialState)
  },
})

export default resourcesSlice.reducer
