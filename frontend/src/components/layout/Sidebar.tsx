import { motion } from 'motion/react'
import { LogOut, Sprout } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/auth'
import { initialsOf } from '../../utils/format'
import type { NavGroup } from './adminNav'

function ProfileCard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  if (!user) return null

  async function handleLogout() {
    setSigningOut(true)
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-2.5 dark:border-white/6 dark:bg-white/3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand-400 to-emerald-700 text-xs font-bold text-white shadow-sm">
        {initialsOf(user.firstName, user.lastName)}
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
          {user.firstName} {user.lastName}
        </p>
        <p className="truncate text-[11px] text-ink-500 dark:text-slate-400">
          {user.employeeId}
        </p>
      </div>
      <button
        type="button"
        aria-label="Log out"
        title="Log out"
        onClick={handleLogout}
        disabled={signingOut}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-rose-500/10 hover:text-rose-600 disabled:cursor-wait disabled:opacity-60 dark:text-slate-400 dark:hover:text-rose-400"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function Sidebar({
  groups,
  roleLabel,
  onNavigate,
}: {
  groups: NavGroup[]
  roleLabel: string
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5">
          <motion.span
            whileHover={{ rotate: 15, scale: 1.08 }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-brand-500 to-emerald-600 text-white shadow-md shadow-brand-500/30"
          >
            <Sprout className="h-5 w-5" />
          </motion.span>
          <div className="leading-tight">
            <p className="text-base font-bold tracking-tight text-ink-900 dark:text-white">RightFit</p>
            <p className="text-[10px] font-semibold tracking-wider text-brand-600 uppercase dark:text-brand-400">
              {roleLabel}
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pt-2 pb-4">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-[0.16em] text-ink-500/70 uppercase dark:text-slate-500">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  {item.ready ? (
                    <NavLink to={item.to} onClick={onNavigate} className="relative block rounded-xl">
                      {({ isActive }) => (
                        <span
                          className={`relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? 'text-brand-700 dark:text-white'
                              : 'text-ink-700 hover:bg-slate-100 hover:text-ink-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white'
                          }`}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="sidebar-active"
                              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                              className="absolute inset-0 rounded-xl bg-brand-500/10 ring-1 ring-brand-500/20 dark:bg-brand-500/15 dark:ring-brand-400/20"
                            >
                              <span className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-500" />
                            </motion.span>
                          )}
                          <item.icon className={`relative h-4 w-4 shrink-0 ${isActive ? 'text-brand-600 dark:text-brand-400' : ''}`} />
                          <span className="relative">{item.label}</span>
                        </span>
                      )}
                    </NavLink>
                  ) : (
                    <span
                      title="Coming soon"
                      aria-disabled="true"
                      className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-ink-500/60 dark:text-slate-500"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-ink-500/80 uppercase dark:bg-white/6 dark:text-slate-500">
                        Soon
                      </span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-200/70 p-3 dark:border-white/6">
        <ProfileCard />
      </div>
    </div>
  )
}
