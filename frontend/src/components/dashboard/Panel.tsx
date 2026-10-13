import { AlertTriangle, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import type { AsyncResult } from '../../hooks/useAsyncData'

/** The bento tile surface shared by every dashboard card (light: white on slate canvas, dark: frosted glass). */
export const TILE_SURFACE =
  'relative rounded-3xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)] dark:border-white/7 dark:bg-white/3 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'

/** @deprecated kept for older imports — same as TILE_SURFACE with padding. */
export const PANEL_SURFACE = `${TILE_SURFACE} p-5`

export function Panel({
  title,
  subtitle,
  icon,
  action,
  children,
  className = '',
  centered = false,
}: {
  title?: string
  subtitle?: string
  icon?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  /** Vertically centre the body in the space below the title (for tiles stretched by a taller neighbour). */
  centered?: boolean
}) {
  return (
    <section className={`${TILE_SURFACE} flex flex-col p-5 sm:p-6 ${className}`}>
      {title && (
        <header className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {icon && (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-ink-700 dark:bg-white/6 dark:text-slate-300">
                {icon}
              </span>
            )}
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-ink-900 dark:text-white">{title}</h2>
              {subtitle && <p className="text-xs text-ink-500 dark:text-slate-400">{subtitle}</p>}
            </div>
          </div>
          {action}
        </header>
      )}
      <div className={centered ? 'flex flex-1 flex-col justify-center' : 'flex-1'}>{children}</div>
    </section>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/80 dark:bg-white/7 ${className}`} />
}

export function EmptyState({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-ink-500 dark:bg-white/6 dark:text-slate-400">
        {icon}
      </span>
      <p className="max-w-56 text-sm text-ink-500 dark:text-slate-400">{children}</p>
    </div>
  )
}

export function PanelError({
  message,
  status,
  onRetry,
}: {
  message: string
  status: number | null
  onRetry: () => void
}) {
  const forbidden = status === 403
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <p className="max-w-xs text-sm text-ink-500 dark:text-slate-400">
        {forbidden ? "You don't have permission to view this section." : message}
      </p>
      {!forbidden && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </button>
      )}
    </div>
  )
}

/** Skeleton on first load, inline error with retry on failure, otherwise the data (kept visible during a refresh). */
export function AsyncBody<T>({
  state,
  skeleton,
  children,
}: {
  state: AsyncResult<T>
  skeleton: ReactNode
  children: (data: T) => ReactNode
}) {
  if (state.error) return <PanelError message={state.error} status={state.status} onRetry={state.reload} />
  if (state.data === null) return <>{skeleton}</>
  return <>{children(state.data)}</>
}
