import { motion } from 'motion/react'
import { ClipboardList, Eye, ShieldCheck, Sparkles, TrendingUp, Zap } from 'lucide-react'
import Reveal from '../ui/Reveal'

const BENEFITS = [
  { icon: Eye, title: 'Complete Visibility', description: 'Real-time view of your workforce, bench and project demand.' },
  { icon: TrendingUp, title: 'Improved Utilization', description: 'Reduce bench time and make better use of available talent.' },
  { icon: Zap, title: 'Faster Decisions', description: 'Find, approve and allocate the right resources in days, not weeks.' },
  { icon: ShieldCheck, title: 'Workforce Readiness', description: 'Track skills, certifications and training to stay prepared.' },
]

const CANDIDATES = [
  { name: 'Ananya Singh', skills: 'Java · Spring · AWS', score: 94, initials: 'AS', grad: 'from-brand-400 to-emerald-600', top: '14%', best: true },
  { name: 'Amit Patel', skills: 'Java · Spring Boot', score: 81, initials: 'AP', grad: 'from-sky-400 to-indigo-500', top: '50%', best: false },
  { name: 'Vikram Desai', skills: 'Python · AWS', score: 67, initials: 'VD', grad: 'from-amber-400 to-pink-500', top: '86%', best: false },
]

const PATHS = [
  'M 38 50 C 52 50, 50 14, 62 14',
  'M 38 50 C 52 50, 50 50, 62 50',
  'M 38 50 C 52 50, 50 86, 62 86',
]

function MatchingVisual() {
  return (
    <div className="relative h-104 rounded-3xl border border-slate-200/80 bg-white/60 p-4 backdrop-blur-md dark:border-white/10 dark:bg-white/3">
      <div className="bg-grid absolute inset-0 rounded-3xl opacity-60" />

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {PATHS.map((d, i) => (
          <motion.path
            key={d}
            d={d}
            fill="none"
            stroke={i === 0 ? '#22c55e' : '#94a3b8'}
            strokeOpacity={i === 0 ? 1 : 0.5}
            strokeWidth={i === 0 ? 2.5 : 1.5}
            strokeDasharray="6 6"
            vectorEffect="non-scaling-stroke"
            className="animate-dash"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4 + i * 0.2 }}
          />
        ))}
      </svg>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="absolute top-1/2 left-4 w-[36%] -translate-y-1/2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-ink-900"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
          <ClipboardList className="h-5 w-5" />
        </span>
        <p className="mt-3 text-[11px] font-semibold text-brand-600 dark:text-brand-400">REQ-1042</p>
        <p className="text-sm font-bold text-ink-900 dark:text-white">Senior Java Developer</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {['Java', 'Spring', 'AWS'].map((s) => (
            <span key={s} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-ink-700 dark:bg-white/10 dark:text-slate-300">
              {s}
            </span>
          ))}
        </div>
      </motion.div>

      {CANDIDATES.map((c, i) => (
        <motion.div
          key={c.name}
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.8 + i * 0.2 }}
          style={{ top: c.top }}
          className={`absolute right-4 w-[36%] -translate-y-1/2 rounded-2xl border bg-white p-3 shadow-lg dark:bg-ink-900 ${
            c.best ? 'border-brand-500/50 shadow-brand-500/20' : 'border-slate-200/80 shadow-slate-900/5 dark:border-white/10'
          }`}
        >
          {c.best && (
            <span className="absolute -inset-px animate-pulse rounded-2xl ring-2 ring-brand-500/40" />
          )}
          <div className="flex items-center gap-2">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${c.grad} text-[10px] font-bold text-white`}>
              {c.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-ink-900 dark:text-white">{c.name}</p>
              <p className="truncate text-[10px] text-ink-500 dark:text-slate-400">{c.skills}</p>
            </div>
            <span className={`text-sm font-extrabold ${c.best ? 'text-brand-600 dark:text-brand-400' : 'text-ink-500 dark:text-slate-400'}`}>
              {c.score}%
            </span>
          </div>
          {c.best && (
            <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
              <Sparkles className="h-3 w-3" /> Best match
            </p>
          )}
        </motion.div>
      ))}
    </div>
  )
}

export default function WhyRightFit() {
  return (
    <section id="why" className="relative py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
        <Reveal>
          <MatchingVisual />
        </Reveal>

        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-brand-700 uppercase dark:text-brand-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              About RightFit
            </span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-5xl dark:text-white">
              More than allocation.
              <br />
              <span className="text-gradient-animated">A future-ready workforce.</span>
            </h2>
            <p className="mt-4 text-ink-500 sm:text-lg dark:text-slate-400">
              RightFit connects every requirement to the people best suited for it — so projects start on time and
              talent never sits idle.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.title} delay={0.1 + i * 0.1}>
                <div className="group h-full rounded-2xl border border-slate-200/80 bg-white/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/30 hover:shadow-xl hover:shadow-brand-500/10 dark:border-white/10 dark:bg-white/3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 transition-transform group-hover:scale-110 dark:text-brand-400">
                    <b.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 font-semibold text-ink-900 dark:text-white">{b.title}</p>
                  <p className="mt-1 text-sm text-ink-500 dark:text-slate-400">{b.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
