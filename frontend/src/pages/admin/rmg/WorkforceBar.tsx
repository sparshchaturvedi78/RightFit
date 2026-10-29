import { motion } from 'motion/react'
import type { WorkforceSplit } from '../../../services/admin/rmg.service'
import { WORKFORCE_SEGMENTS } from './rmgUi'

/** Where an RMG's people are right now, as one stacked bar (in project / bench / training / unassigned). */
export default function WorkforceBar({
  split,
  total,
  height = 'h-1.5',
  delay = 0,
}: {
  split?: WorkforceSplit
  total: number
  height?: string
  delay?: number
}) {
  const title = WORKFORCE_SEGMENTS.map((s) => `${s.label}: ${split?.[s.key] ?? 0}`).join(' · ')
  return (
    <div title={total ? title : 'Nobody reports to this RMG'} className={`flex ${height} w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/6`}>
      {total > 0 &&
        WORKFORCE_SEGMENTS.map((s, i) => {
          const value = split?.[s.key] ?? 0
          if (!value) return null
          return (
            <motion.span
              key={s.key}
              className="h-full"
              style={{ backgroundColor: s.color }}
              initial={{ width: 0 }}
              animate={{ width: `${(value / total) * 100}%` }}
              transition={{ duration: 0.7, delay: delay + i * 0.05, ease: 'easeOut' }}
            />
          )
        })}
    </div>
  )
}
