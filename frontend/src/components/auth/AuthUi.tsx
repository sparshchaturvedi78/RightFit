import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import type { InputHTMLAttributes, ReactNode } from 'react'

export const TEXT_LINK_CLASS =
  'flex items-center gap-1 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900 dark:text-slate-400 dark:hover:text-white'

export function StepProgress({ steps, current, className = '' }: { steps: string[]; current: number; className?: string }) {
  return (
    <div className={`mb-8 flex gap-2 ${className}`}>
      {steps.map((label, i) => (
        <div key={label} className="flex-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <motion.div
              className="h-full rounded-full bg-linear-to-r from-brand-500 to-emerald-400"
              initial={false}
              animate={{ width: i <= current ? '100%' : '0%' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <p
            className={`mt-2 text-[11px] font-semibold tracking-wider uppercase transition-colors ${
              i <= current ? 'text-brand-600 dark:text-brand-400' : 'text-ink-500/60 dark:text-slate-500'
            }`}
          >
            {String(i + 1).padStart(2, '0')} · {label}
          </p>
        </div>
      ))}
    </div>
  )
}

export function StepHeader({ icon, title, children }: { icon: ReactNode; title: ReactNode; children: ReactNode }) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.5, rotate: -25, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="relative mx-auto flex h-16 w-16 items-center justify-center"
      >
        <span className="animate-pulse-ring absolute inset-0 rounded-2xl bg-brand-500/30" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-brand-500 to-emerald-600 text-white shadow-lg shadow-brand-600/30">
          {icon}
        </span>
      </motion.div>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">{title}</h1>
      <p className="mt-2 text-sm text-ink-500 dark:text-slate-400">{children}</p>
    </div>
  )
}

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  icon: ReactNode
  labelAction?: ReactNode
  trailing?: ReactNode
}

export function AuthField({ id, label, icon, labelAction, trailing, ...inputProps }: AuthFieldProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold text-ink-700 dark:text-slate-300">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="group relative">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-500 transition-colors group-focus-within:text-brand-600 dark:text-slate-500 dark:group-focus-within:text-brand-400">
          {icon}
        </span>
        <input
          id={id}
          {...inputProps}
          className={`w-full rounded-2xl border border-slate-200 bg-white/70 py-3.5 pl-11 text-sm text-ink-900 shadow-sm transition-all outline-none placeholder:text-ink-500/50 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-400 dark:focus:bg-white/7 ${
            trailing ? 'pr-11' : 'pr-4'
          }`}
        />
        {trailing && <span className="absolute top-1/2 right-3 flex -translate-y-1/2">{trailing}</span>}
      </div>
    </div>
  )
}

export function PasswordToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? 'Hide password' : 'Show password'}
      className="rounded-lg p-1 text-ink-500 transition-colors hover:text-ink-900 dark:text-slate-400 dark:hover:text-white"
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  )
}

interface SubmitButtonProps {
  loading?: boolean
  disabled?: boolean
  loadingText?: string
  icon?: ReactNode
  showArrow?: boolean
  type?: 'submit' | 'button'
  onClick?: () => void
  children: ReactNode
}

export function SubmitButton({
  loading,
  disabled,
  loadingText,
  icon,
  showArrow = true,
  type = 'submit',
  onClick,
  children,
}: SubmitButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className="shimmer group flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-brand-600 via-emerald-500 to-brand-600 bg-size-[200%_100%] px-6 py-4 text-sm font-semibold text-white shadow-xl shadow-brand-600/30 transition-all duration-500 hover:bg-position-[100%_0] hover:shadow-brand-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {loading ? loadingText : children}
      {showArrow && !loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
    </button>
  )
}

export function ErrorBanner({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto', x: [0, -8, 8, -5, 5, 0] }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden"
        >
          <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function CountdownRing({ seconds, total, children }: { seconds: number; total: number; children: ReactNode }) {
  const remaining = total > 0 ? (seconds / total) * 100 : 0
  return (
    <div className="flex items-center justify-center gap-2.5 text-xs text-ink-500 dark:text-slate-400">
      <svg viewBox="0 0 36 36" className="h-7 w-7 -rotate-90">
        <circle cx="18" cy="18" r="15.915" fill="none" strokeWidth="3" className="stroke-slate-200 dark:stroke-white/10" />
        <circle
          cx="18"
          cy="18"
          r="15.915"
          fill="none"
          stroke="#22c55e"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${remaining} 100`}
          className="transition-[stroke-dasharray] duration-1000 ease-linear"
        />
      </svg>
      <span>{children}</span>
    </div>
  )
}

const BURST_COLORS = ['bg-brand-500', 'bg-cyan-400', 'bg-amber-400', 'bg-emerald-400']

export function SuccessCheck() {
  return (
    <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
      {Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2
        return (
          <motion.span
            key={i}
            className={`absolute h-2 w-2 rounded-full ${BURST_COLORS[i % BURST_COLORS.length]}`}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{ x: Math.cos(angle) * 60, y: Math.sin(angle) * 60, opacity: [0, 1, 0], scale: [0, 1, 0.6] }}
            transition={{ duration: 0.9, delay: 0.55, ease: 'easeOut' }}
          />
        )
      })}
      <svg viewBox="0 0 52 52" className="h-24 w-24">
        <motion.circle
          cx="26"
          cy="26"
          r="24"
          fill="none"
          stroke="#22c55e"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        <motion.path
          d="M15 27 l7 7 l15 -15"
          fill="none"
          stroke="#22c55e"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.5, ease: 'easeOut' }}
        />
      </svg>
    </div>
  )
}

export function SecureNote() {
  return (
    <div className="mt-8 flex items-center gap-3 text-[11px] text-ink-500 dark:text-slate-500">
      <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
      <span className="flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />
        Protected by 2-step verification
      </span>
      <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
    </div>
  )
}
