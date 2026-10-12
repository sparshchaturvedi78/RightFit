import { LogOut, Sprout } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AuroraBackground from '../components/ui/AuroraBackground'
import { useAuth } from '../contexts/auth'

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  RMG: 'Resource Management Group',
  ASSOCIATE: 'Associate',
}

export default function DashboardPlaceholderPage({ role }: { role: string }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <AuroraBackground />

      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/80 p-10 text-center shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/4 dark:shadow-black/40">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
          <Sprout className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold text-ink-900 dark:text-white">
          Welcome, {user?.firstName ?? 'there'} 👋
        </h1>
        <p className="mt-2 text-sm text-ink-500 dark:text-slate-400">
          You're signed in as <span className="font-semibold text-ink-900 dark:text-white">{ROLE_LABELS[role] ?? role}</span>.
        </p>
        <p className="mt-4 text-sm text-ink-500 dark:text-slate-400">
          This is a placeholder — the real {ROLE_LABELS[role] ?? role} dashboard is the next page we'll build.
        </p>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-ink-900 transition-colors hover:bg-slate-50 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  )
}
