import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PanelError, Skeleton, TILE_SURFACE } from '../../../components/dashboard/Panel'
import { useQuery } from '../../../hooks/useQuery'
import type { AccountState, UserAccountDTO } from '../../../services/admin/userAccount.service'
import { avatarGradient } from '../employees/employeeUi'
import { accountInitials, accountName, ROLE_LABEL, stateDot, stateText } from './usersUi'

/** Most matches shown at once; a longer search narrows down by typing more. */
const LIMIT = 50

/**
 * A search replaces the four role lanes: one list of the people who match, across every role, each with
 * their roles and a link to their employee page.
 */
export default function UserSearchResults({
  q,
  state,
  selectedId,
  onOpen,
}: {
  q: string
  state: AccountState
  selectedId: number | null
  onOpen: (u: UserAccountDTO) => void
}) {
  const { data, loading, error, status, refresh } = useQuery('userAccounts', { q, state, page: 0, size: LIMIT })
  const rows = data?.content ?? null
  const total = data?.totalElements ?? 0

  return (
    <section aria-label="Search results" className={`${TILE_SURFACE} p-5`}>
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold text-ink-900 dark:text-white">
          Results for “{q}”
        </h2>
        <span className="text-xs text-ink-500 tabular-nums dark:text-slate-400">
          {rows ? `${total.toLocaleString()} ${total === 1 ? 'person' : 'people'}` : ''}
        </span>
      </header>

      {error && !rows ? (
        <PanelError message={error} status={status} onRetry={refresh} />
      ) : rows === null ? (
        <div className="grid gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-ink-500 dark:border-white/10 dark:text-slate-400">
          Nobody matches “{q}”{state === 'ALL' ? '' : ' in this view'}.
        </p>
      ) : (
        <ul className={`grid gap-2 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {rows.map((u) => {
            const blocked = u.signInState === 'BLOCKED'
            return (
              <li key={u.userId} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpen(u)}
                  aria-label={`${accountName(u)}, ${stateText(u)}`}
                  aria-pressed={selectedId === u.userId}
                  className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all outline-none hover:-translate-y-px hover:border-brand-500/30 hover:shadow-md focus-visible:ring-4 focus-visible:ring-brand-500/20 ${
                    selectedId === u.userId ? 'border-brand-500/40 bg-brand-500/6' : 'border-slate-200/80 bg-slate-50/70 dark:border-white/8 dark:bg-white/3'
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${avatarGradient(u.userId)} text-xs font-bold text-white`}>
                    {accountInitials(u)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm font-semibold ${blocked ? 'text-ink-500 line-through dark:text-slate-500' : 'text-ink-900 dark:text-white'}`}>
                      {accountName(u)}
                      <span className="ml-2 text-xs font-medium text-ink-500 dark:text-slate-400">{u.employeeId}</span>
                    </span>
                    <span className="flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] text-ink-500 dark:text-slate-400">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${stateDot(u.signInState)}`} />
                      <span>{stateText(u)}</span>
                      {u.roles.map((r) => (
                        <span key={r} className="rounded-full border border-slate-200 px-1.5 text-[10px] font-semibold text-ink-700 dark:border-white/10 dark:text-slate-300">
                          {ROLE_LABEL[r] ?? r}
                        </span>
                      ))}
                      {u.self && <span className="rounded-full bg-brand-500/15 px-1.5 text-[10px] font-semibold text-brand-700 dark:text-brand-400">You</span>}
                    </span>
                  </span>
                </button>
                <Link
                  to={`/admin/employees?q=${encodeURIComponent(u.employeeId)}`}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-500/10 dark:text-brand-400"
                >
                  Employee page
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
      {total > LIMIT && rows && <p className="mt-3 text-xs text-ink-500 dark:text-slate-400">Showing the first {LIMIT}. Type more to narrow it down.</p>}
    </section>
  )
}
