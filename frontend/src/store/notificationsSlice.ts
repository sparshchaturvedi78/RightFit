import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getApiErrorMessage } from '../services/httpClient'
import { notificationService, type NotificationDTO } from '../services/notification.service'
import { sessionEnded, signedIn } from './authSlice'

/** How many notifications the bell shows. */
const LATEST_COUNT = 6

interface NotificationsState {
  unread: number
  items: NotificationDTO[] | null
  /** When the last successful check finished (ms since epoch); 0 = never. */
  syncedAt: number
  /** A foreground request is running (first load or the refresh button). */
  syncing: boolean
  error: string | null
  status: number | null
}

const initialState: NotificationsState = { unread: 0, items: null, syncedAt: 0, syncing: false, error: null, status: null }

interface SyncArgs {
  /** The refresh button: always reload the list, and show progress. */
  manual?: boolean
}

interface SyncResult {
  unread: number
  items: NotificationDTO[] | null
  at: number
}

interface Failure {
  message: string
  status: number | null
}

export const syncNotifications = createAsyncThunk<
  SyncResult,
  SyncArgs | void,
  { state: { notifications: NotificationsState }; rejectValue: Failure }
>(
  'notifications/sync',
  async (args, { getState, rejectWithValue }) => {
    try {
      const current = getState().notifications
      const unread = await notificationService.unreadCount()
      // The cheap unread-count check runs on every poll; the list is only refetched when something changed.
      const needList = args?.manual === true || current.items === null || unread !== current.unread
      const items = needList ? (await notificationService.list(false, 0, LATEST_COUNT)).content : null
      return { unread, items, at: Date.now() }
    } catch (err) {
      const status =
        typeof err === 'object' && err !== null && 'response' in err
          ? ((err as { response?: { status?: number } }).response?.status ?? null)
          : null
      return rejectWithValue({ message: getApiErrorMessage(err, "Couldn't load notifications."), status })
    }
  },
  {
    // One sync at a time (also swallows React StrictMode's double mount); a manual refresh may always go.
    condition: (args, { getState }) => args?.manual === true || !getState().notifications.syncing,
  },
)

export const markNotificationRead = createAsyncThunk('notifications/markRead', async (id: number) => {
  await notificationService.markRead(id)
  return id
})

export const markAllNotificationsRead = createAsyncThunk('notifications/markAllRead', async () => {
  await notificationService.markAllRead()
})

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(syncNotifications.pending, (state, { meta }) => {
        // Background polls stay invisible; only the first load and manual refreshes show progress.
        if (meta.arg?.manual || state.items === null) state.syncing = true
      })
      .addCase(syncNotifications.fulfilled, (state, { payload }) => {
        state.syncing = false
        state.error = null
        state.status = null
        state.unread = payload.unread
        state.syncedAt = payload.at
        if (payload.items) state.items = payload.items
      })
      .addCase(syncNotifications.rejected, (state, { payload }) => {
        state.syncing = false
        // Keep what is already on screen if a refresh fails.
        if (state.items === null) {
          state.error = payload?.message ?? "Couldn't load notifications."
          state.status = payload?.status ?? null
        }
      })
      .addCase(markNotificationRead.fulfilled, (state, { payload: id }) => {
        const item = state.items?.find((n) => n.id === id)
        if (item && !item.isRead) {
          item.isRead = true
          state.unread = Math.max(0, state.unread - 1)
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items?.forEach((n) => {
          n.isRead = true
        })
        state.unread = 0
      })
      // Notifications belong to one user's session.
      .addCase(sessionEnded, () => initialState)
      .addCase(signedIn, () => initialState)
  },
})

export default notificationsSlice.reducer
