import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Moon, Sprout, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../contexts/theme'
import AuthShowcase, { type AuthJourney } from './AuthShowcase'

interface AuthShellProps {
  journey: AuthJourney
  activeStep: number
  children: ReactNode
}

export default function AuthShell({ journey, activeStep, children }: AuthShellProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-white lg:grid lg:grid-cols-2 dark:bg-ink-950">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-aurora absolute -top-56 left-1/4 h-120 w-120 -translate-x-1/2 rounded-full bg-brand-300/30 blur-[140px] dark:bg-brand-500/10" />
        <div className="animate-aurora-slow absolute top-1/3 right-0 h-96 w-96 translate-x-1/3 rounded-full bg-emerald-200/40 blur-[140px] dark:bg-emerald-500/5" />
      </div>
      <AuthShowcase journey={journey} activeStep={activeStep} />

      <div className="relative flex min-h-screen flex-col px-6 py-6 sm:px-10">
        <header className="flex h-10 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 lg:invisible">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-brand-500 to-emerald-600 text-white shadow-md shadow-brand-500/30">
              <Sprout className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold text-ink-900 dark:text-white">RightFit</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900 sm:flex dark:text-slate-400 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
            <button
              type="button"
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white/60 text-ink-700 backdrop-blur-md transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ y: 20, rotate: -90, opacity: 0 }}
                  animate={{ y: 0, rotate: 0, opacity: 1 }}
                  exit={{ y: -20, rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            <div className="glow-border glow-border-line rounded-4xl">
              <div className="relative rounded-4xl border border-white/60 bg-white/85 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:p-10 dark:border-white/10 dark:bg-ink-950/85 dark:shadow-black/50">
                {children}
              </div>
            </div>
          </motion.div>
        </main>

        <footer className="text-center text-xs text-ink-500 dark:text-slate-500">
          © 2026 RightFit · Resource Allocation &amp; Employee Pool Management
        </footer>
      </div>
    </div>
  )
}
