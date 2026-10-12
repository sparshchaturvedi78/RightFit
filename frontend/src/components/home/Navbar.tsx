import { AnimatePresence, motion } from 'motion/react'
import { LogIn, Menu, Moon, Sprout, Sun, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../contexts/theme'

const NAV_LINKS = [
  { label: 'Home', id: 'top' },
  { label: 'Features', id: 'features' },
  { label: 'Roles', id: 'roles' },
  { label: 'About', id: 'why' },
  { label: 'Contact', id: 'contact' },
]

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('top')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    NAV_LINKS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4">
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`flex w-full items-center justify-between transition-all duration-500 ${
          scrolled
            ? 'mt-3 max-w-5xl rounded-full border border-slate-200/80 bg-white/75 px-4 py-2 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-ink-950/70 dark:shadow-black/40'
            : 'mt-0 max-w-7xl border border-transparent px-6 py-4'
        }`}
      >
        <a href="#top" className="flex items-center gap-2">
          <motion.span
            whileHover={{ rotate: 15, scale: 1.08 }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-brand-500 to-emerald-600 text-white shadow-md shadow-brand-500/30"
          >
            <Sprout className="h-5 w-5" />
          </motion.span>
          <span className="text-lg font-bold text-ink-900 dark:text-white">RightFit</span>
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.id} className="relative">
              <a
                href={`#${link.id}`}
                className={`relative z-10 block rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active === link.id
                    ? 'text-brand-700 dark:text-brand-300'
                    : 'text-ink-700 hover:text-ink-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {link.label}
              </a>
              {active === link.id && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-full bg-brand-500/10 ring-1 ring-brand-500/20"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 text-ink-700 transition-colors hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
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

          <Link
            to="/login"
            className="shimmer hidden items-center gap-2 rounded-full bg-linear-to-r from-brand-600 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-transform hover:scale-105 sm:flex"
          >
            <LogIn className="h-4 w-4" />
            Login
          </Link>

          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-ink-700 lg:hidden dark:border-white/10 dark:text-slate-300"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-4 top-20 rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur-xl lg:hidden dark:border-white/10 dark:bg-ink-900/95"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-4 py-3 text-sm font-medium text-ink-700 hover:bg-brand-500/10 dark:text-slate-200"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white"
            >
              <LogIn className="h-4 w-4" />
              Login to RightFit
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
