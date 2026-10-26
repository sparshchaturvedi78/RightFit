import { ClipboardList } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../components/dashboard/Panel'
import { Dropdown } from '../../components/ui/Dropdown'
import RefreshButton from '../../components/ui/RefreshButton'
import { SearchInput } from '../../components/ui/SearchInput'
import { useQuery } from '../../hooks/useQuery'
import type { RejectionDTO } from '../../services/rmg/rejection.service'
import { humanize, parseServerDate } from '../../utils/format'
import { formatDay } from '../admin/employees/employeeUi'
import PageHeader from '../associate/PageHeader'
import { Bar, Card, Loading, Row, Strip, Tag, Who } from './rmgUi'

const DAY = 24 * 60 * 60 * 1000

/** Tag tone for a reason category: skill gaps are the strongest signal, availability next. */
function categoryTone(category?: string): 'danger' | 'warn' | 'muted' {
  if (!category) return 'muted'
  if (/skill/i.test(category)) return 'danger'
  if (/avail/i.test(category)) return 'warn'
  return 'muted'
}

/** Every rejection, with the reason. Use the patterns to spot skill gaps, availability problems and repeat rejections. */
export default function RejectionsPage() {
  const list = useQuery('rmgRejections', {})
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [picked, setPicked] = useState<string | null>(null)

  const [now] = useState(() => Date.now())
  const all = useMemo(() => list.data ?? [], [list.data])
  const categories = useMemo(() => [...new Set(all.map((r) => r.reasonCategory).filter(Boolean) as string[])].sort(), [all])
  const rows = all
    .filter((r) => !category || r.reasonCategory === category)
    .filter((r) => !q || `${r.employeeName ?? ''} ${r.employeeId} ${r.requirementId ?? ''} ${r.positionTitle ?? ''}`.toLowerCase().includes(q.toLowerCase()))
  const selected = rows.find((r) => r.rejectionId === picked) ?? rows[0]
  const recent = all.filter((r) => now - parseServerDate(r.rejectionDate).getTime() <= 30 * DAY)
  const byEmployee = new Map<string, number>()
  all.forEach((r) => byEmployee.set(r.employeeId, (byEmployee.get(r.employeeId) ?? 0) + 1))
  const repeat = [...byEmployee.values()].filter((n) => n >= 2).length

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <PageHeader
        eyebrow="Governance · Rejections"
        title="Rejection management"
        sub="Every time a candidate is rejected, with the reason. Use the patterns to spot skill gaps, availability problems and repeat rejections."
        actions={<RefreshButton onClick={list.refresh} loading={list.loading} />}
      />

      {list.error && !list.data ? (
        <div className={`${TILE_SURFACE} p-5`}>
          <PanelError message={list.error} status={list.status} onRetry={list.refresh} />
        </div>
      ) : !list.data ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : all.length === 0 ? (
        <div className={`${TILE_SURFACE} px-6 py-12`}>
          <EmptyState icon={<ClipboardList className="h-5 w-5" />}>No one has been rejected yet.</EmptyState>
        </div>
      ) : (
        <>
          <Strip
            cells={[
              { label: 'Rejections, last 30 days', value: recent.length, sub: `Across ${new Set(recent.map((r) => r.requirementId)).size} requirements` },
              { label: 'Skill gap', value: recent.filter((r) => /skill/i.test(r.reasonCategory ?? '')).length, sub: 'Most common reason' },
              { label: 'Availability', value: recent.filter((r) => /avail/i.test(r.reasonCategory ?? '')).length, sub: 'Notice or leave' },
              { label: 'Repeat rejections', value: repeat, sub: 'Same person, 2 or more times' },
            ]}
          />

          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-64 flex-1">
              <SearchInput value={q} onSearch={setQ} placeholder="Search person or requirement…" />
            </div>
            <div className="w-56">
              <Dropdown
                ariaLabel="Reason category"
                value={category}
                onChange={setCategory}
                options={[{ value: '', label: 'All reasons' }, ...categories.map((c) => ({ value: c, label: humanize(c) }))]}
              />
            </div>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-5">
            <section className={`${TILE_SURFACE} overflow-hidden`}>
              {rows.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-ink-500 dark:text-slate-400">No rejection matches these filters.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-175 border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-[11px] font-bold tracking-widest text-ink-500 uppercase dark:text-slate-400">
                        <th className="px-4 py-3">Person</th>
                        <th className="px-4 py-3">Requirement</th>
                        <th className="px-4 py-3">Reason</th>
                        <th className="px-4 py-3">Rejected by</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const on = r.rejectionId === selected?.rejectionId
                        const ring = on ? 'shadow-[inset_0_1.5px_0_var(--color-brand-500),inset_0_-1.5px_0_var(--color-brand-500)]' : ''
                        const cell = `border-b border-slate-100 px-4 py-3 align-middle dark:border-white/6 ${ring}`
                        return (
                          <tr key={r.rejectionId} onClick={() => setPicked(r.rejectionId)} aria-selected={on} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-white/3">
                            <td className={cell}>
                              <Who name={r.employeeName ?? r.employeeId} detail={r.employeeId} />
                            </td>
                            <td className={cell}>
                              <span className="text-ink-700 dark:text-slate-300">{[r.requirementId, r.positionTitle].filter(Boolean).join(' · ') || '—'}</span>
                            </td>
                            <td className={cell}>
                              <div className="grid gap-1">
                                <span>{r.reasonCategory ? <Tag tone={categoryTone(r.reasonCategory)}>{humanize(r.reasonCategory)}</Tag> : null}</span>
                                {r.rejectionComment && <small className="text-xs text-ink-500 dark:text-slate-400">{r.rejectionComment}</small>}
                              </div>
                            </td>
                            <td className={cell}>{r.rejectedByName ?? '—'}</td>
                            <td className={cell}>{formatDay(r.rejectionDate.slice(0, 10))}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {selected && <PersonRejections key={selected.employeeId} row={selected} />}
          </div>
        </>
      )}
    </div>
  )
}

/** One person's rejections: the reasons they have had, their history, and what to do next. */
function PersonRejections({ row }: { row: RejectionDTO }) {
  const history = useQuery('rmgRejectionHistory', { employeeId: row.employeeId })
  const data = history.data
  const max = Math.max(1, ...Object.values(data?.byReason ?? {}))
  const repeat = (data?.totalRejections ?? 0) >= 2

  return (
    <aside className={`${TILE_SURFACE} grid content-start gap-4 p-5`}>
      <div className="flex items-start justify-between gap-3">
        <Who name={row.employeeName ?? row.employeeId} detail={data ? `Rejections: ${data.totalRejections}` : row.employeeId} />
        {history.loading && <Loading />}
      </div>

      {!data ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : (
        <>
          <Card title="By reason">
            <div className="grid gap-3">
              {Object.entries(data.byReason).map(([reason, count]) => (
                <div key={reason} className="grid gap-1.5">
                  <div className="flex justify-between text-sm">
                    <b className="font-semibold text-ink-900 dark:text-white">{humanize(reason)}</b>
                    <span className="text-ink-500 dark:text-slate-400">{count}</span>
                  </div>
                  <Bar value={(count / max) * 100} tone={categoryTone(reason) === 'danger' ? 'danger' : categoryTone(reason) === 'warn' ? 'warn' : 'ok'} />
                </div>
              ))}
            </div>
          </Card>

          {repeat && <div className="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-ink-700 dark:text-slate-300">Rejected more than once. Consider training before the next recommendation.</div>}

          <Card title="History">
            {data.history.map((h) => (
              <Row
                key={h.rejectionId}
                title={[h.requirementId, h.positionTitle].filter(Boolean).join(' · ') || 'Requirement'}
                detail={`${formatDay(h.rejectionDate.slice(0, 10))} · ${h.rejectionComment ?? humanize(h.reasonName ?? '')}`}
                aside={h.reasonCategory ? <Tag tone={categoryTone(h.reasonCategory)}>{humanize(h.reasonCategory)}</Tag> : undefined}
              />
            ))}
          </Card>
        </>
      )}

      <Link to="/rmg/training" className="inline-flex w-fit items-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-ink-900 hover:border-brand-500/40 dark:border-white/10 dark:text-white">
        Recommend for training
      </Link>
    </aside>
  )
}
