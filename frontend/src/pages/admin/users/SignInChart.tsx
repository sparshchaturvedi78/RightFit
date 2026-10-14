import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import type { UserAccountSummary } from '../../../services/admin/userAccount.service'
import { dayLabel } from './usersUi'

/**
 * Successful sign-ins per day for the last 14 days. Hover (or focus with the keyboard) a bar to see that day's count.
 */
export default function SignInChart({ series }: { series: UserAccountSummary['signIns'] }) {
  const [active, setActive] = useState<number | null>(null)
  const max = Math.max(1, ...series.map((d) => d.count))
  const today = series.length ? series[series.length - 1] : null
  const focused = active !== null ? series[active] : null

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs text-ink-500 dark:text-slate-400">
          {focused ? dayLabel(focused.date) : 'Hover a day'}
        </p>
        <p className="text-xs text-ink-500 dark:text-slate-400">
          <span className="text-base font-extrabold tabular-nums text-ink-900 dark:text-white">
            {(focused ?? today)?.count.toLocaleString() ?? 0}
          </span>{' '}
          sign-in{(focused ?? today)?.count === 1 ? '' : 's'}
        </p>
      </div>

      <div className="relative flex h-28 items-end gap-1.5" role="list" aria-label="Sign-ins per day">
        <AnimatePresence>
          {series.map((d, i) => {
            const isOn = active === i
            const pct = d.count === 0 ? 0 : Math.max(6, (d.count / max) * 100)
            return (
              <motion.button
                key={d.date}
                type="button"
                role="listitem"
                aria-label={`${dayLabel(d.date)}: ${d.count} sign-in${d.count === 1 ? '' : 's'}`}
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.03, ease: [0.2, 0.8, 0.2, 1] }}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className={`relative min-w-0 flex-1 rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-500/50 ${
                  isOn
                    ? 'bg-linear-to-t from-brand-600 to-brand-400'
                    : 'bg-linear-to-t from-brand-500/60 to-brand-400/25 dark:from-brand-500/50 dark:to-brand-400/15'
                } ${d.count === 0 ? 'min-h-[3px]' : 'min-h-[6px]'}`}
              >
                <AnimatePresence>
                  {isOn && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-center text-[11px] whitespace-nowrap shadow-lg dark:border-white/10 dark:bg-ink-900"
                    >
                      <span className="block font-semibold text-ink-900 dark:text-white">{dayLabel(d.date)}</span>
                      <span className="tabular-nums text-ink-500 dark:text-slate-400">
                        {d.count} sign-in{d.count === 1 ? '' : 's'}
                      </span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      <div className="flex justify-between text-[10px] text-ink-500 dark:text-slate-500">
        <span>{series[0] ? dayLabel(series[0].date) : ''}</span>
        <span>Today</span>
      </div>
    </div>
  )
}
