import { useCallback } from 'react'
import { authService, type LoginResponse } from '../services/auth.service'
import { useAppDispatch, useAppSelector } from '../store'
import { signedIn, type AuthStatus, type AuthUser } from '../store/authSlice'

export type { AuthStatus, AuthUser }

/** The signed-in user, backed by the Redux store. */
export function useAuth() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const status = useAppSelector((s) => s.auth.status)

  const setUserFromLogin = useCallback(
    (response: LoginResponse) => {
      dispatch(
        signedIn({
          userId: response.userId,
          employeeId: response.employeeId,
          email: response.email,
          firstName: response.firstName,
          lastName: response.lastName,
          roles: response.roles,
        }),
      )
    },
    [dispatch],
  )

  // authService.logout() clears the tokens, which ends the session in the store.
  const logout = useCallback(() => authService.logout(), [])

  return { user, status, setUserFromLogin, logout }
}

const ROLE_DASHBOARD_PRIORITY = ['ADMIN', 'MANAGER', 'RMG', 'ASSOCIATE']

export function dashboardPathForRoles(roles: string[]): string {
  const primary = ROLE_DASHBOARD_PRIORITY.find((role) => roles.includes(role))
  switch (primary) {
    case 'ADMIN':
      return '/admin/dashboard'
    case 'MANAGER':
      return '/manager/dashboard'
    case 'RMG':
      return '/rmg/dashboard'
    case 'ASSOCIATE':
      return '/associate/dashboard'
    default:
      return '/login'
  }
}
