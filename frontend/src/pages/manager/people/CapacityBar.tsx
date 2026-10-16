/** How much of someone's working day is booked, with an optional extra slice for what is about to be added. */
export default function CapacityBar({ working, booked, adding = 0 }: { working?: number; booked?: number; adding?: number }) {
  const total = working && working > 0 ? working : 0
  const b = booked ?? 0
  const pct = (h: number) => (total > 0 ? Math.min(100, (h / total) * 100) : 0)
  const over = total > 0 && b + adding > total
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/8" role="img" aria-label={`${b} of ${total} hours a day booked`}>
        <i className="block h-full bg-brand-500" style={{ width: `${pct(b)}%` }} />
        {adding > 0 && <i className={`block h-full ${over ? 'bg-rose-500' : 'bg-sky-400'}`} style={{ width: `${pct(Math.min(adding, Math.max(total - b, 0)) || adding)}%` }} />}
      </div>
      <p className="mt-1.5 text-xs text-ink-500 tabular-nums dark:text-slate-400">
        {total > 0 ? (
          <>
            <b className="font-semibold text-ink-900 dark:text-white">{b}</b> of {total} hours a day booked
            {adding > 0 && <> · adding <b className={`font-semibold ${over ? 'text-rose-600 dark:text-rose-400' : 'text-sky-600 dark:text-sky-400'}`}>{adding}</b></>}
            {' · '}
            {Math.max(total - b, 0)} free
          </>
        ) : (
          'Working hours not set'
        )}
      </p>
    </div>
  )
}
