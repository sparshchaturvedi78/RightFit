import { dashboardPathForRoles, useAuth } from '../contexts/auth'

/**
 * Where the primary call-to-action should go: the user's own dashboard when signed in, else /login.
 * `checking` is true only while a stored session is being verified, so callers can avoid a Login → Dashboard flicker.
 */
export function useDashboardLink() {
  const { user, status } = useAuth()
  const destination = user ? dashboardPathForRoles(user.roles) : '/login'
  const loggedIn = status === 'authenticated' && destination !== '/login'

  return {
    checking: status === 'loading',
    loggedIn,
    to: loggedIn ? destination : '/login',
  }
}
