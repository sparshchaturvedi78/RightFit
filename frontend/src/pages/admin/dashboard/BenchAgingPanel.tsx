import { motion } from 'motion/react'
import { Hourglass } from 'lucide-react'
import { AsyncBody, EmptyState, Panel, Skeleton } from '../../../components/dashboard/Panel'
import type { AsyncResult } from '../../../hooks/useAsyncData'
import type { AdminDashboardDTO } from '../../../services/admin/dashboard.service'
import { percent } from '../../../utils/format'

const ZONES = [
  { key: 'benchGreen', label: 'Green zone', hint: 'Recently benched', bar: 'from-brand-500 to-emerald-400', dot: 'bg-brand-500' },
  { key: 'benchAmber', label: 'Amber zone', hint: 'Needs a plan soon', bar: 'from-amber-400 to-orange-400', dot: 'bg-amber-500' },
  { key: 'benchRed', label: 'Red zone', hint: 'Bench too long — act now', bar: 'from-rose-500 to-pink-500', dot: 'bg-rose-500' },
] as const

export default function BenchAgingPanel({ state }: { state: AsyncResult<AdminDashboardDTO> }) {
  return (
    <Panel
      title="Bench aging"
      subtitle="By the active bench policy"
      icon={<Hourglass className="h-4 w-4" />}
      className="h-full"
    >
      <AsyncBody
        state={state}
        skeleton={
          <div className="space-y-5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        }
      >
        {(d) => {
          const counts = ZONES.map((z) => d[z.key] ?? 0)
          const total = counts.reduce((a, b) => a + b, 0)
          if (total === 0) {
            return <EmptyState icon={<Hourglass className="h-5 w-5" />}>Nobody is on the bench right now.</EmptyState>
          }
          return (
            <div className="space-y-5">
              <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/6">
                {ZONES.map((z, i) => (
                  <motion.div
                    key={z.key}
                    className={`h-full bg-linear-to-r ${z.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(counts[i] / total) * 100}%` }}
                    transition={{ duration: 0.9, delay: 0.2 + i * 0.15, ease: 'easeOut' }}
                  />
                ))}
              </div>
              <ul className="space-y-4">
                {ZONES.map((z, i) => (
                  <li key={z.key}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm font-medium text-ink-900 dark:text-white">
                        <span className={`h-2 w-2 rounded-full ${z.dot}`} />
                        {z.label}
                      </span>
                      <span className="text-sm text-ink-500 dark:text-slate-400">
                        <span className="font-semibold text-ink-900 tabular-nums dark:text-white">{counts[i]}</span> ·{' '}
                        {percent(counts[i], total)}%
                      </span>
                    </div>
                    <p className="mt-0.5 pl-4 text-xs text-ink-500 dark:text-slate-400">{z.hint}</p>
                  </li>
                ))}
              </ul>
            </div>
          )
        }}
      </AsyncBody>
    </Panel>
  )
}
