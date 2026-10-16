import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import AnimatedCounter from '../ui/AnimatedCounter'
import { Skeleton, TILE_SURFACE } from './Panel'

export interface StatSegment {
  value: number
  /** Tailwind background class for this part of the bar. */
  className: string
}

export interface StatItem {
  label: string
  value?: number
  /** Exact text to show instead of the animated whole number (e.g. 4.5 hours). */
  text?: string
  caption?: ReactNode
  /** A thin bar split by these values, to show what the figure is made of. */
  segments?: StatSegment[]
  /** Where the figure leads, when it is a link. */
  to?: string
  /** Accessible name of the link. */
  linkLabel?: string
}

type LinkLike = (props: { to: string; className?: string; children: ReactNode; 'aria-label'?: string }) => ReactNode

const CELL = 'relative flex flex-col gap-1 p-5 before:absolute before:top-4 before:bottom-4 before:left-0 before:w-px before:bg-slate-200 odd:before:hidden lg:odd:before:block lg:first:before:hidden dark:before:bg-white/8'

/**
 * One panel with several headline figures side by side, each with a thin bar showing what it is made of.
 * Figures that have a `to` are links; pass `link` to control how (defaults to a router link).
 */
export function StatStrip({ items, loading, link: LinkComponent = Link }: { items: StatItem[]; loading?: boolean; link?: LinkLike }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={`${TILE_SURFACE} grid grid-cols-2 overflow-hidden lg:grid-cols-4`}
      aria-label="Summary"
    >
      {items.map((item) => {
        const total = (item.segments ?? []).reduce((n, s) => n + s.value, 0)
        const body = (
          <>
            <span className="text-xs font-medium text-ink-500 dark:text-slate-400">{item.label}</span>
            {item.text !== undefined && !loading ? (
              <span className="text-3xl leading-none font-extrabold tracking-tight text-ink-900 tabular-nums dark:text-white">{item.text}</span>
            ) : loading || item.value === undefined ? (
              <Skeleton className="mt-1 h-8 w-16" />
            ) : (
              <span className="text-3xl leading-none font-extrabold tracking-tight text-ink-900 tabular-nums dark:text-white">
                <AnimatedCounter to={item.value} duration={1} />
              </span>
            )}
            <span className="min-h-4 text-xs text-ink-500 dark:text-slate-400">{!loading && item.caption}</span>
            {item.segments && !loading && (
              <span className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/6" aria-hidden>
                {total > 0 && item.segments.map((s, i) => <i key={i} className={s.className} style={{ width: `${(s.value / total) * 100}%` }} />)}
              </span>
            )}
          </>
        )
        return item.to ? (
          <LinkComponent key={item.label} to={item.to} className={`${CELL} hover:bg-slate-50/70 dark:hover:bg-white/3`} aria-label={item.linkLabel ?? item.label}>
            {body}
          </LinkComponent>
        ) : (
          <div key={item.label} className={CELL}>
            {body}
          </div>
        )
      })}
    </motion.section>
  )
}
