import { ClipboardList } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../components/dashboard/Panel'
import { Button } from '../../components/ui/form'
import RefreshButton from '../../components/ui/RefreshButton'
import { Dropdown } from '../../components/ui/Dropdown'
import { SearchInput } from '../../components/ui/SearchInput'
import { useQuery } from '../../hooks/useQuery'
import { humanize } from '../../utils/format'
import PageHeader from '../associate/PageHeader'
import { journeyFor } from './journey'
import { shortDate } from './format'
import { Card, CloseButton, Journey, Loading, OpenChevron, Row, Tag, Who } from './rmgUi'

const GRADES = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'].map((g) => ({ value: g, label: g }))

/** Bench tag tone: within the limit is green, anything else is quiet. */
const benchTone = (status: string) => (status === 'GREEN' ? 'ok' : 'muted')

/** The first and last cells draw the ring's side edges; every cell draws the top and bottom. */
const RING_MID = 'shadow-[inset_0_1.5px_0_var(--color-brand-500),inset_0_-1.5px_0_var(--color-brand-500)]'
const RING_FIRST = 'shadow-[inset_1.5px_0_0_var(--color-brand-500),inset_0_1.5px_0_var(--color-brand-500),inset_0_-1.5px_0_var(--color-brand-500)]'
const RING_LAST = 'shadow-[inset_-1.5px_0_0_var(--color-brand-500),inset_0_1.5px_0_var(--color-brand-500),inset_0_-1.5px_0_var(--color-brand-500)]'

/**
 * Everyone free to be allocated. The table takes the full width; opening a person slides their details in beside it,
 * and the close control brings the table back to full width.
 */
export default function ResourcePoolPage() {
  const [q, setQ] = useState('')
  const [grade, setGrade] = useState('')
  const [page, setPage] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)

  const pool = useQuery('rmgPool', { q, grade, page })
  const bench = useQuery('rmgBench', { benchStatus: '' })
  const list = pool.data?.content ?? []
  const open = picked && list.some((p) => p.employeeId === picked) ? picked : null
  const benchById = new Map((bench.data ?? []).map((b) => [b.employeeId, b]))

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <PageHeader
        eyebrow="Resource · Pool"
        title="Resource pool"
        sub="Everyone who is free to be allocated. Open a person to see how they came into the pool and where they stand in selections."
        actions={
          <RefreshButton
            onClick={() => {
              pool.refresh()
              bench.refresh()
            }}
            loading={pool.loading}
          />
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-64 flex-1">
          <SearchInput
            value={q}
            onSearch={(v) => {
              setQ(v)
              setPage(0)
            }}
            placeholder="Search name or ID…"
          />
        </div>
        <div className="w-44">
          <Dropdown
            ariaLabel="Grade"
            value={grade}
            onChange={(v) => {
              setGrade(v)
              setPage(0)
            }}
            options={[{ value: '', label: 'All grades' }, ...GRADES]}
          />
        </div>
      </div>

      {pool.error && !pool.data ? (
        <div className={`${TILE_SURFACE} p-5`}>
          <PanelError message={pool.error} status={pool.status} onRetry={pool.refresh} />
        </div>
      ) : !pool.data ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : list.length === 0 ? (
        <div className={`${TILE_SURFACE} px-6 py-12`}>
          <EmptyState icon={<ClipboardList className="h-5 w-5" />}>Nobody in the pool matches these filters.</EmptyState>
        </div>
      ) : (
        <div className={`grid items-start gap-4 lg:gap-5 ${open ? 'lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]' : ''}`}>
          <section className={`${TILE_SURFACE} overflow-hidden`}>
            <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2 text-xs text-ink-500 dark:text-slate-400">
              <span>Showing {list.length} of {pool.data.totalElements}</span>
              <span>Select a person to see their details</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-175 border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-bold tracking-widest text-ink-500 uppercase dark:text-slate-400">
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Grade</th>
                    <th className="px-4 py-3">In pool since</th>
                    <th className="px-4 py-3">Why in pool</th>
                    <th className="px-4 py-3">Now</th>
                    <th className="w-8 px-2 py-3" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {list.map((p) => {
                    const on = p.employeeId === open
                    const b = benchById.get(p.employeeId)
                    const cell = (i: number) =>
                      `border-b border-slate-100 px-4 py-3 align-middle dark:border-white/6 ${on ? (i === 0 ? RING_FIRST : i === 5 ? RING_LAST : RING_MID) : ''}`
                    return (
                      <tr
                        key={p.employeeId}
                        onClick={() => setPicked(p.employeeId)}
                        aria-selected={on}
                        className="group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/3"
                      >
                        <td className={cell(0)}>
                          <Who name={p.name} detail={[p.employeeId, p.designation].filter(Boolean).join(' · ')} />
                        </td>
                        <td className={cell(1)}>
                          <span className="text-ink-700 dark:text-slate-300">{p.grade ?? '—'}</span>
                        </td>
                        <td className={cell(2)}>
                          <span className="whitespace-nowrap text-ink-700 dark:text-slate-300">{shortDate(p.inPoolSince) ?? '—'}</span>
                        </td>
                        <td className={cell(3)}>
                          <span className="text-ink-700 dark:text-slate-300">{p.entryReason ? humanize(p.entryReason) : '—'}</span>
                        </td>
                        <td className={cell(4)}>
                          {b ? <Tag tone={benchTone(b.benchStatus)}>{`Bench ${b.daysOnBench} days`}</Tag> : <Tag>In pool</Tag>}
                        </td>
                        <td className={`${cell(5)} px-2`}>
                          <OpenChevron />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3">
              <Button variant="secondary" onClick={() => setPage((n) => Math.max(0, n - 1))} disabled={pool.data.first}>
                Previous
              </Button>
              <Button variant="secondary" onClick={() => setPage((n) => n + 1)} disabled={pool.data.last}>
                Next
              </Button>
            </div>
          </section>

          {open && <PersonPanel key={open} employeeId={open} onClose={() => setPicked(null)} />}
        </div>
      )}
    </div>
  )
}

/** The side panel for one person in the pool: their status, where they stand in selections, and their pool history. */
function PersonPanel({ employeeId, onClose }: { employeeId: string; onClose: () => void }) {
  const detail = useQuery('rmgPoolDetail', { employeeId })
  const selections = useQuery('rmgSelections', { employeeId })
  const bench = useQuery('rmgBench', { benchStatus: '' })
  const onBench = (bench.data ?? []).find((b) => b.employeeId === employeeId)
  const latest = selections.data?.[0]

  if (!detail.data) {
    return (
      <aside className={`${TILE_SURFACE} grid content-start gap-4 p-5`}>
        <div className="flex justify-between">
          <Loading label="Loading person" />
          <CloseButton onClick={onClose} />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </aside>
    )
  }
  const person = detail.data

  return (
    <aside className={`${TILE_SURFACE} grid content-start gap-4 p-5`}>
      <div className="flex items-start justify-between gap-3">
        <Who name={person.name} detail={person.employeeId} />
        <CloseButton onClick={onClose} />
      </div>
      {onBench ? <Tag tone={benchTone(onBench.benchStatus)}>{`On bench ${onBench.daysOnBench} days`}</Tag> : <Tag>{humanize(person.poolStatus)}</Tag>}

      <Card title="Selection journey" action={selections.loading ? <Loading /> : latest ? <span className="text-xs text-ink-500 dark:text-slate-400">{latest.requirementId}</span> : undefined}>
        {!selections.data ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : !latest ? (
          <p className="text-sm text-ink-500 dark:text-slate-400">No selections yet.</p>
        ) : (
          <>
            <p className="text-sm text-ink-700 dark:text-slate-300">
              {latest.positionTitle} · {latest.projectName}
            </p>
            <Journey steps={journeyFor(latest)} />
          </>
        )}
      </Card>

      <Card title="Pool history">
        {person.history.length === 0 ? (
          <p className="text-sm text-ink-500 dark:text-slate-400">No pool history yet.</p>
        ) : (
          person.history.map((h) => (
            <Row
              key={h.entryDate}
              title={h.entryReason ? humanize(h.entryReason) : 'Joined pool'}
              detail={`${shortDate(h.entryDate)}${h.exitDate ? ` to ${shortDate(h.exitDate)}` : ''}`}
              aside={h.isCurrent ? <Tag tone="ok">Current</Tag> : <Tag>Past</Tag>}
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
    </aside>
  )
}
