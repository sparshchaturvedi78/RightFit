import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { authService } from '../services/auth.service'
import { tokenStorage } from '../services/tokenStorage'

export interface AuthUser {
  userId: number
  employeeId: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  user: AuthUser | null
  status: AuthStatus
}

const initialState: AuthState = {
  user: null,
  // A stored token means a session may exist; it is verified once at startup (see `restoreSession`).
  status: tokenStorage.get() ? 'loading' : 'unauthenticated',
}

/** Verifies the stored token and loads the signed-in user. Called once when the app starts. */
export const restoreSession = createAsyncThunk<AuthUser>('auth/restoreSession', async () => {
  try {
    const profile = await authService.getCurrentUser()
    return {
      userId: profile.userId,
      employeeId: profile.employeeId,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      roles: profile.roles,
    }
  } catch (err) {
    tokenStorage.clear()
    throw err
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signedIn: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload
      state.status = 'authenticated'
    },
    /** The stored session is gone (logout, or the refresh token stopped working). */
    sessionEnded: (state) => {
      state.user = null
      state.status = 'unauthenticated'
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (state, { payload }) => {
        state.user = payload
        state.status = 'authenticated'
      })
      .addCase(restoreSession.rejected, (state) => {
        state.user = null
        state.status = 'unauthenticated'
      })
  },
})

export const { signedIn, sessionEnded } = authSlice.actions
export default authSlice.reducer
