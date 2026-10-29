import { ClipboardList } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../components/dashboard/Panel'
import { Dropdown } from '../../components/ui/Dropdown'
import RefreshButton from '../../components/ui/RefreshButton'
import { SearchInput } from '../../components/ui/SearchInput'
import { useQuery } from '../../hooks/useQuery'
import type { BenchEntryDTO } from '../../services/rmg/bench.service'
import { humanize } from '../../utils/format'
import PageHeader from '../associate/PageHeader'
import { shortDate } from './format'
import { Bar, Card, CloseButton, Loading, OpenChevron, Row, Strip, Tag, Who } from './rmgUi'

/** Tabs over the bench statuses the server computes (GREEN, AMBER, RED). */
const TABS = [
  { value: '', label: 'All' },
  { value: 'GREEN', label: 'Within limit' },
  { value: 'AMBER', label: 'Nearing limit' },
  { value: 'RED', label: 'Over limit' },
]

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'danger'> = { GREEN: 'ok', AMBER: 'warn', RED: 'danger' }
const STATUS_TAG: Record<string, 'ok' | 'warn' | 'danger'> = { GREEN: 'ok', AMBER: 'warn', RED: 'danger' }
const STATUS_LABEL: Record<string, string> = { GREEN: 'Within limit', AMBER: 'Nearing limit', RED: 'Over limit' }

/** The first and last cells draw the ring's side edges; every cell draws the top and bottom. */
const RING_MID = 'shadow-[inset_0_1.5px_0_var(--color-brand-500),inset_0_-1.5px_0_var(--color-brand-500)]'
const RING_FIRST = 'shadow-[inset_1.5px_0_0_var(--color-brand-500),inset_0_1.5px_0_var(--color-brand-500),inset_0_-1.5px_0_var(--color-brand-500)]'
const RING_LAST = 'shadow-[inset_-1.5px_0_0_var(--color-brand-500),inset_0_1.5px_0_var(--color-brand-500),inset_0_-1.5px_0_var(--color-brand-500)]'

/** People without an allocation, how long they have waited, and how many of those days were paused. */
export default function BenchPage() {
  const bench = useQuery('rmgBench', { benchStatus: '' })
  const [tab, setTab] = useState('')
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('')
  const [picked, setPicked] = useState<string | null>(null)

  const all = useMemo(() => bench.data ?? [], [bench.data])
  const departments = useMemo(() => [...new Set(all.map((b) => b.departmentName).filter(Boolean) as string[])].sort(), [all])
  const list = all
    .filter((b) => !tab || b.benchStatus === tab)
    .filter((b) => !dept || b.departmentName === dept)
    .filter((b) => !q || `${b.name} ${b.employeeId}`.toLowerCase().includes(q.toLowerCase()))
  const open = picked && list.some((b) => b.employeeId === picked) ? picked : null
  const maxDays = Math.max(1, ...all.map((b) => b.daysOnBench))
  const average = all.length ? Math.round(all.reduce((n, b) => n + b.daysOnBench, 0) / all.length) : 0
  const paused = all.reduce((n, b) => n + (b.pausedDays ?? 0), 0)
  const selected = open ? list.find((b) => b.employeeId === open) : undefined

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <PageHeader
        eyebrow="Resource · Bench"
        title="Bench tracking"
        sub="People without an allocation, how long they have waited, and how many of those days were paused."
        actions={<RefreshButton onClick={bench.refresh} loading={bench.loading} />}
      />

      {bench.error && !bench.data ? (
        <div className={`${TILE_SURFACE} p-5`}>
          <PanelError message={bench.error} status={bench.status} onRetry={bench.refresh} />
        </div>
      ) : !bench.data ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : all.length === 0 ? (
        <div className={`${TILE_SURFACE} px-6 py-12`}>
          <EmptyState icon={<ClipboardList className="h-5 w-5" />}>Nobody is on the bench.</EmptyState>
        </div>
      ) : (
        <>
          <Strip
            cells={[
              { label: 'On bench', value: all.length, sub: `Across ${departments.length} department${departments.length === 1 ? '' : 's'}` },
              { label: 'Average days', value: average, sub: 'Paused days excluded' },
              { label: 'Over the limit', value: all.filter((b) => b.benchStatus === 'RED').length, sub: 'Needs an allocation or training' },
              { label: 'Paused days', value: paused, sub: 'Leave and training time' },
            ]}
          />

          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-64 flex-1">
              <SearchInput value={q} onSearch={setQ} placeholder="Search name or ID…" />
            </div>
            <div className="w-48">
              <Dropdown ariaLabel="Department" value={dept} onChange={setDept} options={[{ value: '', label: 'All departments' }, ...departments.map((d) => ({ value: d, label: d }))]} />
            </div>
            <div role="tablist" className="inline-flex gap-1 rounded-2xl border border-slate-200/80 bg-white p-1 dark:border-white/10 dark:bg-white/3">
              {TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.value}
                  onClick={() => setTab(t.value)}
                  className={`rounded-xl px-3 py-1.5 text-[13px] font-semibold ${tab === t.value ? 'bg-brand-500/14 text-brand-700 dark:text-brand-300' : 'text-ink-500 dark:text-slate-400'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className={`grid items-start gap-4 lg:gap-5 ${open ? 'lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]' : ''}`}>
            <section className={`${TILE_SURFACE} overflow-hidden`}>
              {list.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-ink-500 dark:text-slate-400">Nobody matches these filters.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-175 border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-[11px] font-bold tracking-widest text-ink-500 uppercase dark:text-slate-400">
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Bench since</th>
                        <th className="px-4 py-3">Days on bench</th>
                        <th className="px-4 py-3">Paused</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="w-8 px-2 py-3" aria-hidden />
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((b) => (
                        <BenchRow key={b.employeeId} entry={b} maxDays={maxDays} on={b.employeeId === open} onPick={() => setPicked(b.employeeId)} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="px-4 py-3 text-xs text-ink-500 dark:text-slate-400">
                Showing {list.length} of {all.length}
              </div>
            </section>

            {selected && <BenchPanel key={selected.employeeId} entry={selected} onClose={() => setPicked(null)} />}
          </div>
        </>
      )}
    </div>
  )
}

function BenchRow({ entry: b, maxDays, on, onPick }: { entry: BenchEntryDTO; maxDays: number; on: boolean; onPick: () => void }) {
  const cell = (i: number) => `border-b border-slate-100 px-4 py-3 align-middle dark:border-white/6 ${on ? (i === 0 ? RING_FIRST : i === 5 ? RING_LAST : RING_MID) : ''}`
  return (
    <tr onClick={onPick} aria-selected={on} className="group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/3">
      <td className={cell(0)}>
        <Who name={b.name} detail={[b.designation, b.grade].filter(Boolean).join(' · ')} />
      </td>
      <td className={cell(1)}>
        <span className="whitespace-nowrap">{shortDate(b.benchStartDate) ?? '—'}</span>
      </td>
      <td className={`${cell(2)} min-w-44`}>
        <div className="grid gap-1.5">
          <Bar value={(b.daysOnBench / maxDays) * 100} tone={STATUS_TONE[b.benchStatus] ?? 'ok'} />
          <small className="text-xs text-ink-500 dark:text-slate-400">{b.daysOnBench} days</small>
        </div>
      </td>
      <td className={cell(3)}>{b.pausedDays ? `${b.pausedDays} days` : '0 days'}</td>
      <td className={cell(4)}>
        <Tag tone={STATUS_TAG[b.benchStatus] ?? 'muted'}>{STATUS_LABEL[b.benchStatus] ?? humanize(b.benchStatus)}</Tag>
      </td>
      <td className={`${cell(5)} px-2`}>
        <OpenChevron />
      </td>
    </tr>
  )
}

/** The side panel for one person: their bench history and what to do next. */
function BenchPanel({ entry, onClose }: { entry: BenchEntryDTO; onClose: () => void }) {
  const detail = useQuery('rmgBenchDetail', { employeeId: entry.employeeId })
  return (
    <aside className={`${TILE_SURFACE} grid content-start gap-4 p-5`}>
      <div className="flex items-start justify-between gap-3">
        <Who name={entry.name} detail={`${entry.employeeId} · ${entry.daysOnBench} days on bench`} />
        <CloseButton onClick={onClose} />
      </div>
      <p className="text-sm text-ink-500 dark:text-slate-400">
        Bench since {shortDate(entry.benchStartDate) ?? '—'}. {entry.pausedDays ? `${entry.pausedDays} paused days so far.` : 'No paused days yet.'}
      </p>
      {entry.benchStatus === 'RED' && (
        <div className="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-ink-700 dark:text-slate-300">
          Over the bench limit. Find an allocation, or put this person into a training program.
        </div>
      )}

      <Card title="Bench history" action={detail.loading ? <Loading /> : undefined}>
        {!detail.data ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : (
          detail.data.history.map((h) => (
            <Row
              key={h.benchStartDate}
              title={`${shortDate(h.benchStartDate)}${h.benchEndDate ? ` to ${shortDate(h.benchEndDate)}` : ''}`}
              detail={h.daysOnBench != null ? `${h.daysOnBench} days${h.pausedDays ? ` · ${h.pausedDays} paused` : ''}` : humanize(h.benchStatus)}
              aside={h.isCurrent ? <Tag tone="info">Current</Tag> : <Tag>Past</Tag>}
            />
          ))
        )}
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link to="/rmg/recommendations" className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
          Find allocation
        </Link>
        <Link to="/rmg/training" className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-ink-900 hover:border-brand-500/40 dark:border-white/10 dark:text-white">
          Put in training
        </Link>
      </div>
      <p className="rounded-2xl bg-sky-500/10 px-4 py-3 text-xs text-ink-700 dark:text-slate-300">
        Days are counted from bench start, minus paused days. Limits come from the current bench configuration.
      </p>
    </aside>
  )
}
