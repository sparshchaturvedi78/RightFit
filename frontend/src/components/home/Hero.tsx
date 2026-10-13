import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react'
import { ArrowRight, CheckCircle2, LayoutDashboard, LogIn, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboardLink } from '../../hooks/useDashboardLink'
import AnimatedCounter from '../ui/AnimatedCounter'
import DashboardPreview from './DashboardPreview'
import HeroBackground from './HeroBackground'

const WORDS = ['Right Projects', 'Right Skills', 'Right Time']

const TOASTS = [
  { title: 'Priya Mehta allocated', detail: 'Payment Module · 9h/day' },
  { title: 'Requirement published', detail: 'REQ-1042 · Senior React Dev' },
  { title: 'Interview scheduled', detail: 'Rahul Sharma · Today 10:00 AM' },
  { title: 'Allocation approved by RMG', detail: 'Ananya Singh → FinTech Platform' },
]

const STATS = [
  { value: 50, suffix: '%', label: 'Higher resource utilization' },
  { value: 70, suffix: '%', label: 'Less time to allocate' },
  { value: 100, suffix: '%', label: 'Workforce visibility' },
  { value: 4, suffix: '', label: 'Roles, one platform' },
]

const AVATARS = [
  { initials: 'RK', grad: 'from-rose-400 to-orange-400' },
  { initials: 'PS', grad: 'from-violet-400 to-fuchsia-500' },
  { initials: 'AP', grad: 'from-sky-400 to-indigo-500' },
  { initials: 'AS', grad: 'from-brand-400 to-emerald-600' },
  { initials: 'VD', grad: 'from-amber-400 to-pink-500' },
]

function RotatingWord() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % WORDS.length), 2600)
    return () => clearInterval(timer)
  }, [])

  return (
    <span className="relative inline-flex justify-center">
      <AnimatePresence mode="wait">
        <motion.span
          key={WORDS[index]}
          className="text-gradient-animated inline-block pb-2"
          initial={{ y: 40, opacity: 0, filter: 'blur(10px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -40, opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          {WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function LiveToast() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % TOASTS.length), 3200)
    return () => clearInterval(timer)
  }, [])

  const toast = TOASTS[index]

  return (
    <div className="animate-float-y absolute top-[48%] -left-16 z-20 hidden w-72 xl:block">
      <AnimatePresence mode="wait">
        <motion.div
          key={toast.title}
          initial={{ opacity: 0, x: -24, scale: 0.94 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 24, scale: 0.94 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-3 text-left shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-ink-900/90 dark:shadow-black/50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{toast.title}</p>
            <p className="truncate text-xs text-ink-500 dark:text-slate-400">{toast.detail}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function MatchCard() {
  return (
    <div className="animate-float-y-slow absolute -right-14 -bottom-10 z-20 hidden w-60 xl:block">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 text-left shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-ink-900/90 dark:shadow-black/50">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
            <circle cx="18" cy="18" r="15.915" fill="none" strokeWidth="3" className="stroke-slate-200 dark:stroke-white/10" />
            <motion.circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ strokeDasharray: '0 100' }}
              whileInView={{ strokeDasharray: '94 100' }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, delay: 0.8, ease: 'easeOut' }}
            />
          </svg>
          <div>
            <p className="flex items-center gap-1 text-[11px] font-medium text-brand-600 dark:text-brand-400">
              <Sparkles className="h-3 w-3" /> Best match
            </p>
            <p className="text-2xl font-extrabold text-ink-900 dark:text-white">
              <AnimatedCounter to={94} suffix="%" duration={1.6} />
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-ink-500 dark:text-slate-400">Ananya Singh · Java / Spring Boot</p>
      </div>
    </div>
  )
}

export default function Hero() {
  const { checking, loggedIn, to: ctaTo } = useDashboardLink()
  const previewRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: previewRef, offset: ['start end', 'start 25%'] })
  const rotateX = useTransform(scrollYProgress, [0, 1], [22, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1])

  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-16 sm:pt-40">
      <HeroBackground />

      <div className="mx-auto max-w-7xl px-6 text-center">
        <motion.a
          href="#features"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="group inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-white/70 py-1.5 pr-3 pl-1.5 text-xs font-semibold text-ink-700 shadow-sm backdrop-blur-md dark:bg-white/5 dark:text-slate-200"
        >
          <span className="flex items-center gap-1.5 rounded-full bg-brand-500/15 px-2.5 py-0.5 text-brand-700 dark:text-brand-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
            </span>
            Live
          </span>
          Resource Allocation & Employee Pool Management
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </motion.a>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mx-auto mt-8 max-w-5xl text-5xl leading-[1.05] font-extrabold tracking-tight text-ink-900 sm:text-6xl lg:text-7xl dark:text-white"
        >
          The Right People
          <br />
          for the <RotatingWord />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-base text-ink-500 sm:text-lg dark:text-slate-400"
        >
          One platform to manage your employee pool, match talent to requirements, and move people
          from bench to billable — with full visibility for every role.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            to={ctaTo}
            aria-busy={checking}
            className={`shimmer group flex items-center gap-2 rounded-full bg-linear-to-r from-brand-600 to-emerald-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-brand-600/30 transition-all hover:scale-105 ${
              checking ? 'pointer-events-none opacity-60' : ''
            }`}
          >
            {loggedIn ? <LayoutDashboard className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            {loggedIn ? 'Go to your dashboard' : 'Login to RightFit'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#features"
            className="flex items-center gap-2 rounded-full border border-slate-300 bg-white/60 px-7 py-3.5 text-sm font-semibold text-ink-900 backdrop-blur-md transition-all hover:border-brand-500/40 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            Explore Features
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-8 flex items-center justify-center gap-3"
        >
          <div className="flex -space-x-2">
            {AVATARS.map((a, i) => (
              <motion.span
                key={a.initials}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.08, type: 'spring', stiffness: 300 }}
                className={`flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br ${a.grad} text-[10px] font-bold text-white ring-2 ring-white dark:ring-ink-950`}
              >
                {a.initials}
              </motion.span>
            ))}
          </div>
          <p className="text-left text-xs text-ink-500 sm:text-sm dark:text-slate-400">
            Built for <span className="font-semibold text-ink-900 dark:text-white">Admins, Managers, RMG</span>
            <br className="sm:hidden" /> &amp; <span className="font-semibold text-ink-900 dark:text-white">Associates</span>
          </p>
        </motion.div>

        <motion.div
          ref={previewRef}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.45, ease: 'easeOut' }}
          className="relative mx-auto mt-16 max-w-5xl"
          style={{ perspective: 1400 }}
        >
          <div className="absolute inset-x-10 -bottom-10 top-1/3 -z-10 rounded-full bg-brand-500/25 blur-3xl dark:bg-brand-500/20" />
          <motion.div style={{ rotateX, scale, transformOrigin: 'center top' }}>
            <DashboardPreview />
          </motion.div>
          <LiveToast />
          <MatchCard />
        </motion.div>

        <div className="mx-auto mt-20 grid max-w-5xl grid-cols-2 gap-6 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-slate-200/80 bg-white/60 p-5 backdrop-blur-md dark:border-white/10 dark:bg-white/3"
            >
              <p className="text-gradient-animated text-4xl font-extrabold">
                <AnimatedCounter to={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-1 text-sm text-ink-500 dark:text-slate-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
