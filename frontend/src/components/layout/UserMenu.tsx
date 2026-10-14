import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, LogOut } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/auth'
import { useDismiss } from '../../hooks/useDismiss'
import { initialsOf } from '../../utils/format'

export default function UserMenu({ roleLabel }: { roleLabel: string }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(ref, open, close)

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
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/60 py-1 pr-3 pl-1 backdrop-blur-md transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-brand-400 to-emerald-700 text-[11px] font-bold text-white">
          {initialsOf(user.firstName, user.lastName)}
        </span>
        <span className="hidden text-sm font-medium text-ink-900 sm:block dark:text-white">{user.firstName}</span>
        <ChevronDown className={`h-4 w-4 text-ink-500 transition-transform dark:text-slate-400 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-3 w-64 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:bg-ink-925 dark:shadow-black/50"
          >
            <div className="border-b border-slate-100 px-4 py-4 dark:border-white/5">
              <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-ink-500 dark:text-slate-400">{user.email}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                  {roleLabel}
                </span>
                <span className="text-[11px] text-ink-500 dark:text-slate-400">{user.employeeId}</span>
              </div>
            </div>
            <div className="p-2">
              <button
                type="button"
                onClick={handleLogout}
                disabled={signingOut}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:text-rose-400"
              >
                <LogOut className="h-4 w-4" />
                {signingOut ? 'Signing out…' : 'Log out'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
