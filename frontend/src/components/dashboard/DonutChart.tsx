import { motion } from 'motion/react'
import type { ReactNode } from 'react'

export interface DonutSegment {
  label: string
  value: number
  color: string
}

const RADIUS = 15.915

/** Animated donut; segment lengths are proportional to `value`. */
export function DonutChart({
  segments,
  center,
  size = 'h-36 w-36',
}: {
  segments: DonutSegment[]
  center: ReactNode
  size?: string
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const lengths = segments.map((s) => (total > 0 ? (s.value / total) * 100 : 0))
  const starts = lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0))

  return (
    <div className={`relative shrink-0 ${size}`}>
      <svg viewBox="0 0 36 36" className="h-full w-full">
        <circle cx="18" cy="18" r={RADIUS} fill="none" strokeWidth="4" className="stroke-slate-200 dark:stroke-white/10" />
        {segments.map((segment, i) => (
          <motion.circle
            key={segment.label}
            cx="18"
            cy="18"
            r={RADIUS}
            fill="none"
            stroke={segment.color}
            strokeWidth="4"
            strokeDashoffset={25 - starts[i]}
            initial={{ strokeDasharray: '0 100' }}
            animate={{ strokeDasharray: `${lengths[i]} ${100 - lengths[i]}` }}
            transition={{ duration: 1.1, delay: 0.3 + i * 0.25, ease: 'easeOut' }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{center}</div>
    </div>
  )
}
