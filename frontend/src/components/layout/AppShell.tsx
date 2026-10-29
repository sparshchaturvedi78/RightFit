import { AnimatePresence, motion } from 'motion/react'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '../../contexts/theme'
import type { NavGroup } from './adminNav'
import NotificationBell from './NotificationBell'
import PageErrorBoundary from './PageErrorBoundary'
import ToastHost from './ToastHost'
import Sidebar from './Sidebar'
import UserMenu from './UserMenu'

interface AppShellProps {
  groups: NavGroup[]
  roleLabel: string
}

/** Sun / moon segmented switch. */
function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme()
  const options = [
    { value: 'light', icon: Sun, label: 'Light theme' },
    { value: 'dark', icon: Moon, label: 'Dark theme' },
  ] as const
  return (
    <>
      {/* Phones: one compact toggle */}
      <button
        type="button"
        aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        onClick={toggleTheme}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-ink-700 shadow-sm sm:hidden dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:shadow-none"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <div className="hidden items-center rounded-full border sm:flex border-slate-200/80 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
        {options.map(({ value, icon: Icon, label }) => {
          const active = theme === value
          return (
            <button
              key={value}
              type="button"
              aria-label={label}
              aria-pressed={active}
              onClick={() => !active && toggleTheme()}
              className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                active
                  ? 'text-white dark:text-ink-950'
                  : 'text-ink-500 hover:text-ink-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="theme-switch"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-ink-900 dark:bg-white"
                />
              )}
              <Icon className="relative h-4 w-4" />
            </button>
          )
        })}
      </div>
    </>
  )
}

export default function AppShell({ groups, roleLabel }: AppShellProps) {
  const { pathname } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const currentGroup = groups.find((g) => g.items.some((item) => pathname.startsWith(item.to)))
  const currentPage = currentGroup?.items.find((item) => pathname.startsWith(item.to))

  return (
    <div className="relative isolate min-h-screen bg-slate-50 dark:bg-ink-950">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-aurora absolute -top-64 left-1/3 h-120 w-120 rounded-full bg-brand-200/40 blur-[160px] dark:bg-brand-500/10" />
        <div className="animate-aurora-slow absolute top-1/2 right-0 h-96 w-96 translate-x-1/3 rounded-full bg-sky-200/40 blur-[160px] dark:bg-emerald-500/5" />
        <div className="bg-grid fade-mask absolute inset-x-0 top-0 h-96 opacity-40 dark:opacity-30" />
      </div>

      {/* Desktop: floating sidebar card */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 p-3 lg:block">
        <div className="h-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/7 dark:bg-ink-925 dark:shadow-black/40">
          <Sidebar groups={groups} roleLabel={roleLabel} />
        </div>
      </aside>

      {/* Mobile: drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white lg:hidden dark:border-white/10 dark:bg-ink-925"
            >
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
              <Sidebar groups={groups} roleLabel={roleLabel} onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 bg-linear-to-b from-slate-50 from-80% to-transparent px-4 pt-3 pb-5 sm:px-6 lg:px-5 dark:from-ink-950">
          <div className="flex h-16 items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-3 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:px-4 dark:border-white/7 dark:bg-ink-925 dark:shadow-black/40">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open menu"
                onClick={() => setDrawerOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-ink-700 lg:hidden dark:border-white/10 dark:text-slate-300"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[11px] font-medium tracking-wide text-ink-500 uppercase dark:text-slate-500">
                  {roleLabel}
                  {currentGroup && <span className="hidden sm:inline"> · {currentGroup.title}</span>}
                </p>
                <p className="truncate text-base font-semibold tracking-tight text-ink-900 dark:text-white">
                  {currentPage?.label ?? 'Overview'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeSwitch />
              <NotificationBell />
              <div className="lg:hidden">
                <UserMenu roleLabel={roleLabel} />
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 pt-5 pb-10 sm:px-6 lg:px-5">
          <PageErrorBoundary key={pathname}>
            <Outlet />
          </PageErrorBoundary>
        </main>
      </div>
      <ToastHost />
    </div>
  )
}
