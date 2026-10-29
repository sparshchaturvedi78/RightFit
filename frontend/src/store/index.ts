import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import { tokenStorage } from '../services/tokenStorage'
import authReducer, { restoreSession, sessionEnded } from './authSlice'
import notificationsReducer from './notificationsSlice'
import queriesReducer from './queriesSlice'
import resourcesReducer from './resourcesSlice'
import toastsReducer from './toastSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationsReducer,
    resources: resourcesReducer,
    queries: queriesReducer,
    toasts: toastsReducer,
  },
})

// Logout, or a refresh token that no longer works: the session is over, so every slice resets.
tokenStorage.onClear(() => store.dispatch(sessionEnded()))

// A stored token may still be valid: confirm it once and load the user.
if (tokenStorage.get()) void store.dispatch(restoreSession())

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
