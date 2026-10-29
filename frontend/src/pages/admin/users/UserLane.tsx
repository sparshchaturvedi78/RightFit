import { motion } from 'motion/react'
import { useState } from 'react'
import { useQuery } from '../../../hooks/useQuery'
import type { AccountState, UserAccountDTO } from '../../../services/admin/userAccount.service'
import { avatarGradient } from '../employees/employeeUi'
import { accountInitials, accountName, ROLE_LANES, stateDot, stateText, type LaneKey } from './usersUi'

/** People shown per "Show more" press. A lane never grows taller; it scrolls inside itself. */
const PAGE = 25

export default function UserLane({
  lane,
  q,
  state,
  selectedId,
  onOpen,
}: {
  lane: LaneKey
  q: string
  state: AccountState
  selectedId: number | null
  onOpen: (u: UserAccountDTO) => void
}) {
  const meta = ROLE_LANES.find((r) => r.key === lane)!
  const [size, setSize] = useState(PAGE)
  const { data, loading, error } = useQuery('userAccounts', { role: lane, q: q || undefined, state, page: 0, size })

  const total = data?.totalElements ?? 0
  const rows = data?.content ?? null
  const remaining = Math.max(0, total - (rows?.length ?? 0))

  return (
    <section
      aria-label={`${meta.label} accounts`}
      className="flex h-[600px] min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-white/8 dark:bg-white/3 dark:shadow-none"
    >
      <header className="shrink-0 border-b border-slate-100 px-4 pt-4 pb-3 dark:border-white/6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900 dark:text-white">
            <span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: meta.color }} />
            {meta.label}
          </h2>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums"
            style={{ color: meta.color, background: `color-mix(in srgb, ${meta.color} 12%, transparent)` }}
          >
            {data ? total.toLocaleString() : '–'}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-ink-500 dark:text-slate-400">{meta.note}</p>
      </header>

      {/* Only this list scrolls. The page and the lane keep their size however many accounts there are. */}
      <div className={`flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2.5 transition-opacity ${loading && rows ? 'opacity-60' : ''}`}>
        {error && !rows ? (
          <p className="m-auto text-center text-xs text-rose-600 dark:text-rose-400">Couldn’t load this role.</p>
        ) : rows === null ? (
          [0, 1, 2, 3, 4].map((i) => <div key={i} className="h-[60px] shrink-0 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/6" />)
        ) : rows.length === 0 ? (
          <p className="m-auto rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-ink-500 dark:border-white/10 dark:text-slate-400">
            {state === 'ALL' && !q ? 'No one has this role.' : 'No one here matches this view.'}
          </p>
        ) : (
          rows.map((u, i) => {
            const blocked = u.signInState === 'BLOCKED'
            return (
              <motion.button
                key={u.userId}
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 10) * 0.02, duration: 0.25 }}
                onClick={() => onOpen(u)}
                aria-label={`${accountName(u)}, ${stateText(u)}`}
                aria-pressed={selectedId === u.userId}
                className={`group flex w-full shrink-0 items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all outline-none hover:-translate-y-px hover:border-brand-500/30 hover:shadow-md focus-visible:ring-4 focus-visible:ring-brand-500/20 ${
                  selectedId === u.userId
                    ? 'border-brand-500/40 bg-brand-500/6'
                    : 'border-slate-200/80 bg-slate-50/70 dark:border-white/8 dark:bg-white/3'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${avatarGradient(u.userId)} text-[11px] font-bold text-white`}
                >
                  {accountInitials(u)}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm font-semibold ${blocked ? 'text-ink-500 line-through dark:text-slate-500' : 'text-ink-900 dark:text-white'}`}
                  >
                    {accountName(u)}
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-ink-500 dark:text-slate-400">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${stateDot(u.signInState)}`} />
                    <span className="truncate">{stateText(u)}</span>
                    {u.self && (
                      <span className="shrink-0 rounded-full bg-brand-500/15 px-1.5 text-[10px] font-semibold text-brand-700 dark:text-brand-400">
                        You
                      </span>
                    )}
                    {u.roles.length > 1 && (
                      <span className="shrink-0 rounded-full border border-slate-200 px-1.5 text-[10px] font-semibold dark:border-white/10">
                        +{u.roles.length - 1}
                      </span>
                    )}
                  </span>
                </span>
              </motion.button>
            )
          })
        )}
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-100 px-3 py-2.5 text-[11px] text-ink-500 dark:border-white/6 dark:text-slate-400">
        <span className="tabular-nums">
          {rows ? `${rows.length.toLocaleString()} of ${total.toLocaleString()}` : ''}
        </span>
        <button
          type="button"
          disabled={remaining === 0}
          onClick={() => setSize((s) => s + PAGE)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-900 transition-all hover:-translate-y-px hover:border-brand-500/30 disabled:translate-y-0 disabled:cursor-default disabled:opacity-45 dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          {remaining > 0 ? `Show ${Math.min(PAGE, remaining)} more` : 'All shown'}
        </button>
      </footer>
    </section>
  )
}
