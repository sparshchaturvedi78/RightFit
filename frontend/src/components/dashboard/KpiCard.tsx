import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import AnimatedCounter from '../ui/AnimatedCounter'
import { Skeleton, TILE_SURFACE } from './Panel'

export type KpiAccent = 'brand' | 'sky' | 'violet' | 'amber'

const ACCENTS: Record<KpiAccent, { icon: string; glow: string; bar: string }> = {
  brand: {
    icon: 'bg-brand-500/10 text-brand-600 ring-brand-500/20 dark:text-brand-400',
    glow: 'bg-brand-400/25 dark:bg-brand-500/15',
    bar: 'from-brand-500 to-emerald-400',
  },
  sky: {
    icon: 'bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-400',
    glow: 'bg-sky-400/25 dark:bg-sky-500/15',
    bar: 'from-sky-500 to-cyan-400',
  },
  violet: {
    icon: 'bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:text-violet-400',
    glow: 'bg-violet-400/25 dark:bg-violet-500/15',
    bar: 'from-violet-500 to-fuchsia-400',
  },
  amber: {
    icon: 'bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400',
    glow: 'bg-amber-400/25 dark:bg-amber-500/15',
    bar: 'from-amber-500 to-orange-400',
  },
}

interface KpiCardProps {
  label: string
  value?: number
  /** Small line under the number. */
  caption?: ReactNode
  /** 0–100: draws a thin progress bar at the bottom. */
  progress?: number
  accent?: KpiAccent
  icon: ReactNode
  loading?: boolean
  delay?: number
}

export function KpiCard({ label, value, caption, progress, accent = 'brand', icon, loading, delay = 0 }: KpiCardProps) {
  const a = ACCENTS[accent]
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`${TILE_SURFACE} group h-full overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-white/15`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl transition-opacity duration-500 group-hover:opacity-100 ${a.glow} opacity-60`}
      />
      <div className="relative flex items-center justify-between">
        <p className="text-[13px] font-medium text-ink-500 dark:text-slate-400">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${a.icon}`}>{icon}</span>
      </div>

      <div className="relative mt-4">
        {loading || value === undefined ? (
          <Skeleton className="h-10 w-20" />
        ) : (
          <p className="text-4xl font-bold tracking-tight text-ink-900 tabular-nums dark:text-white">
            <AnimatedCounter to={value} duration={1.4} />
          </p>
        )}
        <div className="mt-1.5 min-h-5 text-xs text-ink-500 dark:text-slate-400">{!loading && caption}</div>
      </div>

      {progress !== undefined && !loading && (
        <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/6">
          <motion.div
            className={`h-full rounded-full bg-linear-to-r ${a.bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            transition={{ duration: 1, delay: delay + 0.3, ease: 'easeOut' }}
          />
        </div>
      )}
    </motion.div>
  )
}
