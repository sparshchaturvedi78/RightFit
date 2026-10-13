import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, UserCircle2, UserCog, Users, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboardLink } from '../../hooks/useDashboardLink'
import Reveal from '../ui/Reveal'
import SectionHeading from '../ui/SectionHeading'

const ROLES = [
  {
    icon: UserCog,
    title: 'Administrators',
    short: 'Govern the whole organization',
    headline: 'Complete control, complete visibility.',
    capabilities: [
      'Manage employees, projects and RMG assignments',
      'Configure roles, permissions and user access',
      'Set bench thresholds, skill and certification catalogs',
      'Audit every action and run 11 org-wide reports',
    ],
    gradient: 'from-brand-500 to-emerald-600',
    soft: 'bg-brand-500/10 text-brand-700 dark:text-brand-300',
    bar: 'bg-brand-500',
  },
  {
    icon: Users,
    title: 'Managers',
    short: 'Staff projects with the right people',
    headline: 'Find, interview and staff — faster.',
    capabilities: [
      'Create, publish and track project requirements',
      'Shortlist, invite and interview candidates',
      'Record decisions and request allocations from RMG',
      'Monitor team capacity and allocation history',
    ],
    gradient: 'from-sky-500 to-blue-600',
    soft: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
    bar: 'bg-sky-500',
  },
  {
    icon: UsersRound,
    title: 'RMG',
    short: 'Own the resource pool and bench',
    headline: 'Keep the bench short and the pool ready.',
    capabilities: [
      'Track the resource pool and bench aging zones',
      'Approve or reject allocation requests with capacity checks',
      'Verify availability and recommend candidates',
      'Analyse rejections, assign training, read demand vs supply',
    ],
    gradient: 'from-violet-500 to-purple-600',
    soft: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
    bar: 'bg-violet-500',
  },
  {
    icon: UserCircle2,
    title: 'Associates',
    short: 'Shape your own career journey',
    headline: 'Your profile, your opportunities.',
    capabilities: [
      'Maintain skills, certifications and preferences',
      'Update availability or request time away',
      'Respond to invitations and interview slots',
      'Track assigned training programs',
    ],
    gradient: 'from-amber-500 to-orange-600',
    soft: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    bar: 'bg-amber-500',
  },
]

const AUTOPLAY_MS = 6000

export default function RolesSection() {
  const { loggedIn, to: ctaTo } = useDashboardLink()
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const timer = setTimeout(() => setActive((a) => (a + 1) % ROLES.length), AUTOPLAY_MS)
    return () => clearTimeout(timer)
  }, [active, paused])

  const role = ROLES[active]

  return (
    <section id="roles" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Built for every role"
          title="One platform for your"
          highlight="entire organization"
          subtitle="Four roles, four tailored workspaces — everyone stays connected, informed and productive."
        />

        <Reveal className="mt-16 grid gap-6 lg:grid-cols-5">
          <div className="flex flex-col gap-3 lg:col-span-2">
            {ROLES.map((r, i) => {
              const isActive = i === active
              return (
                <button
                  key={r.title}
                  type="button"
                  onClick={() => {
                    setActive(i)
                    setPaused(true)
                  }}
                  className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${
                    isActive
                      ? 'border-transparent bg-white shadow-xl shadow-slate-900/5 dark:bg-white/6 dark:shadow-black/30'
                      : 'border-slate-200/80 bg-white/40 hover:bg-white/80 dark:border-white/5 dark:bg-white/2 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                        isActive ? `bg-linear-to-br ${r.gradient} text-white shadow-lg` : r.soft
                      }`}
                    >
                      <r.icon className="h-6 w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-ink-900 dark:text-white">{r.title}</p>
                      <p className="truncate text-sm text-ink-500 dark:text-slate-400">{r.short}</p>
                    </div>
                    <ArrowRight
                      className={`h-4 w-4 shrink-0 transition-all ${
                        isActive ? 'translate-x-0 text-ink-900 opacity-100 dark:text-white' : '-translate-x-2 opacity-0'
                      }`}
                    />
                  </div>
                  {isActive && (
                    <motion.span
                      key={`${active}-${paused}`}
                      className={`absolute bottom-0 left-0 h-0.5 ${r.bar}`}
                      initial={{ width: paused ? '100%' : '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: paused ? 0 : AUTOPLAY_MS / 1000, ease: 'linear' }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          <div className="relative min-h-104 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 p-8 backdrop-blur-md lg:col-span-3 dark:border-white/10 dark:bg-white/3">
            <div className={`absolute -top-24 -right-24 h-72 w-72 rounded-full bg-linear-to-br ${role.gradient} opacity-20 blur-3xl transition-all duration-700`} />
            <AnimatePresence mode="wait">
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="relative"
              >
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${role.soft}`}>
                  <role.icon className="h-3.5 w-3.5" />
                  {role.title}
                </span>
                <h3 className="mt-5 text-2xl font-extrabold text-ink-900 sm:text-3xl dark:text-white">{role.headline}</h3>
                <ul className="mt-8 space-y-4">
                  {role.capabilities.map((cap, i) => (
                    <motion.li
                      key={cap}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${role.gradient} text-white`}>
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-ink-700 dark:text-slate-300">{cap}</span>
                    </motion.li>
                  ))}
                </ul>
                <Link
                  to={ctaTo}
                  className={`mt-10 inline-flex items-center gap-2 rounded-full bg-linear-to-r ${role.gradient} px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105`}
                >
                  {loggedIn ? 'Open your dashboard' : `Sign in as ${role.title.replace(/s$/, '')}`}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
