import { createContext, useContext } from 'react'
import type { LoginResponse } from '../services/auth.service'

export interface AuthUser {
  userId: number
  employeeId: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  setUserFromLogin: (response: LoginResponse) => void
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
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
