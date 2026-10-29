import { motion } from 'motion/react'

/** Hour-by-hour bars for the last 24 hours. `buckets[0]` is the oldest hour, the last one is the current hour. */
export function ActivityBars({ buckets, className = '' }: { buckets: number[]; className?: string }) {
  const max = Math.max(...buckets, 1)
  return (
    <div className={`flex h-20 items-end gap-0.75 ${className}`} role="img" aria-label="Activity over the last 24 hours">
      {buckets.map((count, i) => {
        const height = count === 0 ? 6 : 14 + (count / max) * 86
        const isNow = i === buckets.length - 1
        return (
          <motion.span
            key={i}
            title={`${count} event${count === 1 ? '' : 's'} · ${buckets.length - 1 - i === 0 ? 'this hour' : `${buckets.length - 1 - i}h ago`}`}
            className={`flex-1 rounded-t-[5px] rounded-b-sm ${
              count === 0 ? 'bg-white/15' : isNow ? 'bg-white' : 'bg-white/60'
            }`}
            initial={{ height: '6%' }}
            animate={{ height: `${height}%` }}
            transition={{ duration: 0.7, delay: 0.2 + i * 0.02, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}
