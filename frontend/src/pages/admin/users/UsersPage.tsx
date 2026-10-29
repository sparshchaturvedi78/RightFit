import { motion } from 'motion/react'
import { Lock, RefreshCw, ShieldBan, UserX } from 'lucide-react'
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TILE_SURFACE, PanelError, Skeleton } from '../../../components/dashboard/Panel'
import { SearchInput } from '../../../components/ui/SearchInput'
import { Button } from '../../../components/ui/form'
import { useResource } from '../../../hooks/useResource'
import type { AccountState, UserAccountDTO } from '../../../services/admin/userAccount.service'
import { useAppDispatch } from '../../../store'
import { invalidateQueries } from '../../../store/queriesSlice'
import { loadResource } from '../../../store/resourcesSlice'
import AccountDialog from './AccountDialog'
import SignInChart from './SignInChart'
import UserLane from './UserLane'
import UserSearchResults from './UserSearchResults'
import { ROLE_LANES, STATE_OPTIONS } from './usersUi'

const VALID_STATES: AccountState[] = ['ALL', 'BLOCKED', 'LOCKED', 'NEVER']

export default function UsersPage() {
  const dispatch = useAppDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selected, setSelected] = useState<UserAccountDTO | null>(null)
  // The attention cards sit below the board, so a jump from them scrolls back up to the filters and lanes.
  const filtersRef = useRef<HTMLDivElement>(null)
  function jumpTo(next: AccountState) {
    setParam({ state: next })
    filtersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // URL state: search and sign-in filter survive navigation and can be shared.
  const q = searchParams.get('q') ?? ''
  const rawState = (searchParams.get('state') ?? 'ALL').toUpperCase() as AccountState
  const state: AccountState = VALID_STATES.includes(rawState) ? rawState : 'ALL'

  const summary = useResource('admin/user-summary')
  const s = summary.data

  const setParam = useCallback(
    (patch: Record<string, string | undefined>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(patch)) {
            if (!value || value === 'ALL') next.delete(key)
            else next.set(key, value)
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  // Every lane's stored pages and the header counts are refreshed after a change.
  const afterChange = useCallback(() => {
    dispatch(invalidateQueries('userAccounts'))
    void dispatch(loadResource({ key: 'admin/user-summary', force: true }))
  }, [dispatch])

  // A saved change closes the popup and reloads the lanes and header counts.
  const onChanged = useCallback(() => {
    setSelected(null)
    afterChange()
  }, [afterChange])

  const roleTotals = useMemo(() => {
    const totals = s?.accountsByRole ?? {}
    return ROLE_LANES.map((r) => ({ key: r.key, label: r.label, color: r.color, count: totals[r.key] ?? 0 }))
  }, [s])
  const roleSum = roleTotals.reduce((n, r) => n + r.count, 0)

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl dark:text-white">Users</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500 dark:text-slate-400">
            Who can sign in and why. One column per role; a person with two roles appears in both. Open anyone to see
            their details, or block, unblock or unlock their account.
          </p>
        </div>
        <Button
          variant="secondary"
          aria-label="Refresh users"
          disabled={summary.loading}
          onClick={afterChange}
          icon={<RefreshCw className={`h-4 w-4 ${summary.loading ? 'animate-spin' : ''}`} />}
        >
          Refresh
        </Button>
      </motion.header>

      {/* Header: totals by role as one stacked bar, and the sign-in chart */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
      >
        <div className={`${TILE_SURFACE} p-5`}>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-500">Accounts by role</p>
            <p className="text-3xl font-extrabold tracking-tight text-ink-900 tabular-nums dark:text-white">
              {s ? s.totalAccounts.toLocaleString() : '–'}
            </p>
          </div>
          {s ? (
            <>
              <div className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full">
                {roleTotals.map((r, i) => (
                  <motion.span
                    key={r.key}
                    title={`${r.label}: ${r.count.toLocaleString()}`}
                    className="h-full rounded-full"
                    style={{ background: r.color }}
                    initial={{ flexGrow: 0 }}
                    animate={{ flexGrow: Math.max(r.count, roleSum ? 0.0001 : 0) }}
                    transition={{ duration: 0.7, delay: 0.1 + i * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
                  />
                ))}
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
                {roleTotals.map((r) => (
                  <li key={r.key} className="flex items-center gap-2 text-ink-500 dark:text-slate-400">
                    <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                    {r.label}
                    <span className="ml-auto font-semibold text-ink-900 tabular-nums dark:text-white">{r.count.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <Skeleton className="mt-4 h-24 rounded-2xl" />
          )}
        </div>

        <div className={`${TILE_SURFACE} p-5`}>
          <p className="mb-4 text-[11px] font-semibold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-500">
            Sign-ins, last 14 days
          </p>
          {s ? <SignInChart series={s.signIns} /> : <Skeleton className="h-36 rounded-2xl" />}
        </div>
      </motion.section>

      {/* Filters */}
      <motion.div
        ref={filtersRef}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="flex scroll-mt-4 flex-wrap items-center justify-between gap-3"
      >
        <div role="group" aria-label="Show" className="inline-flex flex-wrap rounded-2xl border border-slate-200/80 bg-white p-1 shadow-sm dark:border-white/8 dark:bg-white/4 dark:shadow-none">
          {STATE_OPTIONS.map((o) => {
            const on = state === o.value
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={on}
                onClick={() => setParam({ state: o.value })}
                className={`relative rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                  on ? 'text-white dark:text-ink-900' : 'text-ink-500 hover:text-ink-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {on && (
                  <motion.span
                    layoutId="users-state"
                    className="absolute inset-0 rounded-xl bg-ink-900 dark:bg-white"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
                <span className="relative">{o.label}</span>
              </button>
            )
          })}
        </div>
        <div className="w-full sm:w-80">
          <SearchInput value={q} onSearch={(value) => setParam({ q: value || undefined })} placeholder="Find by name or employee ID" />
        </div>
      </motion.div>

      {/* Board: four fixed-size lanes, filling the width; each one scrolls inside itself. A search shows one list instead. */}
      {q ? (
        <UserSearchResults q={q} state={state} selectedId={selected?.userId ?? null} onOpen={setSelected} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          {ROLE_LANES.map((r) => (
            <UserLane key={r.key} lane={r.key} q="" state={state} selectedId={selected?.userId ?? null} onOpen={setSelected} />
          ))}
        </motion.div>
      )}

      {/* Attention */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={`${TILE_SURFACE} p-5`}
      >
        <h2 className="mb-4 text-sm font-bold text-ink-900 dark:text-white">Needs attention</h2>
        {summary.error && !s ? (
          <PanelError message={summary.error} status={null} onRetry={afterChange} />
        ) : (
          <div className="grid items-stretch gap-3 md:grid-cols-3">
            <AttentionCard
              tone="rose"
              icon={<ShieldBan className="h-4 w-4" />}
              count={s?.blocked}
              title="Blocked from signing in"
              hint="Their sign-in is switched off until someone unblocks them."
              action="Show blocked"
              onClick={() => jumpTo('BLOCKED')}
            />
            <AttentionCard
              tone="amber"
              icon={<Lock className="h-4 w-4" />}
              count={s?.locked}
              title="Locked after failed sign-ins"
              hint="They can try again once someone unlocks the account."
              action="Show locked"
              onClick={() => jumpTo('LOCKED')}
            />
            <AttentionCard
              tone="slate"
              icon={<UserX className="h-4 w-4" />}
              count={s?.neverSignedIn}
              title="Never signed in"
              hint="Accounts that were created but haven’t been used yet."
              action="Show them"
              onClick={() => jumpTo('NEVER')}
            />
          </div>
        )}
      </motion.section>

      {selected && (
        <AccountDialog
          key={selected.userId}
          account={selected}
          onClose={() => setSelected(null)}
          onChanged={() => onChanged()}
        />
      )}
    </div>
  )
}

const TONE = {
  rose: { bar: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', soft: 'bg-rose-500/10' },
  amber: { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', soft: 'bg-amber-500/10' },
  slate: { bar: 'bg-slate-400', text: 'text-ink-500 dark:text-slate-400', soft: 'bg-slate-500/10' },
} as const

function AttentionCard({
  tone,
  icon,
  count,
  title,
  hint,
  action,
  onClick,
}: {
  tone: keyof typeof TONE
  icon: ReactNode
  count?: number
  title: string
  hint: string
  action: string
  onClick: () => void
}) {
  const t = TONE[tone]
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 pl-5 dark:border-white/6 dark:bg-white/2">
      <span className={`absolute inset-y-3 left-0 w-1 rounded-full ${t.bar}`} />
      <div className="flex items-center gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${t.soft} ${t.text}`}>{icon}</span>
        <p className="text-sm font-semibold text-ink-900 dark:text-white">{title}</p>
      </div>
      <p className="mt-2 text-xs text-ink-500 dark:text-slate-400">{hint}</p>
      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <div className="text-2xl font-extrabold tracking-tight text-ink-900 tabular-nums dark:text-white">
          {count === undefined ? <Skeleton className="inline-block h-6 w-14 align-middle" /> : count.toLocaleString()}
        </div>
        <button
          type="button"
          onClick={onClick}
          disabled={!count}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-500/10 disabled:cursor-default disabled:opacity-40 dark:text-brand-400"
        >
          {action}
        </button>
      </div>
    </div>
  )
}

