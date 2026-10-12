import { Loader2, Sprout } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/auth'

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode
  allowedRoles?: string[]
}) {
  const { user, status } = useAuth()

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-ink-950">
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Sprout className="h-6 w-6" />
          </span>
          <Loader2 className="h-5 w-5 animate-spin text-brand-600 dark:text-brand-400" />
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.some((role) => user.roles.includes(role))) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
