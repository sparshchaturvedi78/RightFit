import { ChevronDown, Loader2 } from 'lucide-react'
import { VARIANTS, type ButtonVariant } from './buttonVariants'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const CONTROL =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-sm transition-all outline-none placeholder:text-ink-500/50 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-ink-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-400 dark:disabled:bg-white/3 dark:disabled:text-slate-500 dark:[color-scheme:dark]'

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  className = '',
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  hint?: string
  error?: string | null
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-ink-700 dark:text-slate-300">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-ink-500 dark:text-slate-500">{hint}</p>
      )}
    </div>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${CONTROL} ${props.className ?? ''}`} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${CONTROL} min-h-24 resize-y ${props.className ?? ''}`} />
}

export function Select({ children, className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={`${CONTROL} cursor-pointer appearance-none pr-9 ${className}`}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-ink-500 dark:text-slate-400" />
    </div>
  )
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <h3 className="text-[11px] font-semibold tracking-[0.14em] whitespace-nowrap text-ink-500 uppercase dark:text-slate-500">
          {title}
        </h3>
        <span className="h-px flex-1 bg-slate-200/80 dark:bg-white/8" />
      </div>
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">{children}</div>
    </section>
  )
}

type Variant = ButtonVariant

export function Button({
  variant = 'secondary',
  loading,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean; icon?: ReactNode }) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p
      role="alert"
      className="rounded-xl border border-rose-500/20 bg-rose-500/8 px-3.5 py-2.5 text-sm text-rose-700 dark:text-rose-300"
    >
      {message}
    </p>
  )
}
