import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService, type LoginResponse } from '../services/auth.service'
import { tokenStorage } from '../services/tokenStorage'
import { AuthContext, type AuthStatus, type AuthUser } from './auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() => (tokenStorage.get() ? 'loading' : 'unauthenticated'))

  useEffect(() => {
    if (!tokenStorage.get()) return

    authService
      .getCurrentUser()
      .then((profile) => {
        setUser({
          userId: profile.userId,
          employeeId: profile.employeeId,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          roles: profile.roles,
        })
        setStatus('authenticated')
      })
      .catch(() => {
        tokenStorage.clear()
        setStatus('unauthenticated')
      })
  }, [])

  function setUserFromLogin(response: LoginResponse) {
    setUser({
      userId: response.userId,
      employeeId: response.employeeId,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      roles: response.roles,
    })
    setStatus('authenticated')
  }

  async function logout() {
    await authService.logout()
    setUser(null)
    setStatus('unauthenticated')
  }

  const value = useMemo(() => ({ user, status, setUserFromLogin, logout }), [user, status])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
