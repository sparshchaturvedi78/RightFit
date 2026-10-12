import { AnimatePresence, motion } from 'motion/react'
import {
  Check,
  KeyRound,
  LayoutDashboard,
  Mail,
  MailCheck,
  ScrollText,
  ShieldCheck,
  Sprout,
  Timer,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export type AuthJourney = 'login' | 'forgot'

type StepState = 'done' | 'active' | 'upcoming'

interface JourneyStep {
  icon: LucideIcon
  title: string
  description: string
}

const JOURNEYS: Record<AuthJourney, { eyebrow: string; title: string; subtitle: string; steps: JourneyStep[] }> = {
  login: {
    eyebrow: 'Secure sign-in',
    title: 'Sign in to your workspace',
    subtitle: "Two quick steps and you're straight into the dashboard built for your role.",
    steps: [
      { icon: UserRound, title: 'Enter your credentials', description: 'Your Employee ID and password.' },
      { icon: ShieldCheck, title: "Verify it's you", description: 'A 6-digit one-time code goes to your registered email.' },
      {
        icon: LayoutDashboard,
        title: 'Land on your dashboard',
        description: 'Admin, Manager, RMG or Associate — routed automatically.',
      },
    ],
  },
  forgot: {
    eyebrow: 'Account recovery',
    title: 'Get back into your account',
    subtitle: 'Reset your password in three short steps — no admin ticket needed.',
    steps: [
      { icon: Mail, title: 'Confirm your email', description: 'The email registered with your RightFit account.' },
      { icon: MailCheck, title: 'Enter the reset code', description: 'We send a 6-digit code to that inbox.' },
      {
        icon: KeyRound,
        title: 'Set a new password',
        description: "At least 8 characters, and not one you've used recently.",
      },
    ],
  },
}

const ASSURANCES = [
  { icon: Timer, label: 'One-time codes' },
  { icon: UsersRound, label: 'Role-based access' },
  { icon: ScrollText, label: 'Activity audited' },
]

function stateFor(index: number, activeStep: number): StepState {
  if (index < activeStep) return 'done'
  if (index === activeStep) return 'active'
  return 'upcoming'
}

function TimelineStep({ step, index, state, isLast }: { step: JourneyStep; index: number; state: StepState; isLast: boolean }) {
  const lit = state !== 'upcoming'

  return (
    <li className="relative pb-8 last:pb-0">
      {!isLast && (
        <span className="absolute top-14 left-6 h-[calc(100%-3.5rem)] w-0.5 -translate-x-1/2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <motion.span
            className="absolute inset-x-0 top-0 bg-linear-to-b from-brand-500 to-emerald-400"
            initial={false}
            animate={{ height: state === 'done' ? '100%' : '0%' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </span>
      )}

      <div className="relative isolate flex gap-5">
        {state === 'active' && (
          <motion.div
            layoutId="active-journey-step"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute -inset-3 -z-10 rounded-3xl border border-brand-500/20 bg-white/70 shadow-xl shadow-brand-500/5 backdrop-blur-md dark:bg-white/3"
          />
        )}

        <div className="relative h-12 w-12 shrink-0">
          {state === 'active' && <span className="animate-pulse-ring absolute inset-0 rounded-2xl bg-brand-500/30" />}
          <span
            className={`relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-500 ${
              lit
                ? 'bg-linear-to-br from-brand-500 to-emerald-600 text-white shadow-lg shadow-brand-500/30'
                : 'border border-slate-200 bg-white/60 text-ink-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-500'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={state === 'done' ? 'done' : 'icon'}
                initial={{ scale: 0.4, rotate: -45, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.4, rotate: 45, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {state === 'done' ? <Check className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>

        <div className="pt-0.5">
          <p
            className={`text-[11px] font-semibold tracking-wider uppercase transition-colors ${
              lit ? 'text-brand-600 dark:text-brand-400' : 'text-ink-500/60 dark:text-slate-500'
            }`}
          >
            Step {index + 1}
            {state === 'done' && ' · Done'}
          </p>
          <p
            className={`mt-1 text-lg font-bold transition-colors ${
              lit ? 'text-ink-900 dark:text-white' : 'text-ink-500 dark:text-slate-500'
            }`}
          >
            {step.title}
          </p>
          <p
            className={`mt-0.5 text-sm transition-colors ${
              state === 'active' ? 'text-ink-500 dark:text-slate-400' : 'text-ink-500/70 dark:text-slate-500'
            }`}
          >
            {step.description}
          </p>
        </div>
      </div>
    </li>
  )
}

export default function AuthShowcase({ journey, activeStep }: { journey: AuthJourney; activeStep: number }) {
  const content = JOURNEYS[journey]

  return (
    <aside className="relative hidden min-h-screen flex-col justify-between gap-10 border-r border-slate-200/60 px-12 py-6 lg:flex xl:px-16 dark:border-white/5">
      <div className="flex h-10 items-center">
        <Link to="/" className="flex items-center gap-2">
          <motion.span
            whileHover={{ rotate: 15, scale: 1.08 }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-brand-500 to-emerald-600 text-white shadow-md shadow-brand-500/30"
          >
            <Sprout className="h-5 w-5" />
          </motion.span>
          <span className="text-lg font-bold text-ink-900 dark:text-white">RightFit</span>
        </Link>
      </div>

      <div className="mx-auto w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={journey}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
          >
            <p className="text-xs font-semibold tracking-[0.2em] text-brand-600 uppercase dark:text-brand-400">
              {content.eyebrow}
            </p>
            <h2 className="mt-3 text-4xl leading-tight font-extrabold tracking-tight text-ink-900 dark:text-white">
              {content.title}
            </h2>
            <p className="mt-3 text-ink-500 dark:text-slate-400">{content.subtitle}</p>

            <ol className="mt-12">
              {content.steps.map((step, i) => (
                <TimelineStep
                  key={step.title}
                  step={step}
                  index={i}
                  state={stateFor(i, activeStep)}
                  isLast={i === content.steps.length - 1}
                />
              ))}
            </ol>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-2">
        {ASSURANCES.map((item) => (
          <span
            key={item.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/60 px-3 py-1.5 text-xs font-medium text-ink-700 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
          >
            <item.icon className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            {item.label}
          </span>
        ))}
      </div>
    </aside>
  )
}
