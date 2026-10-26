import { motion } from 'motion/react'
import { Download, Loader2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PanelError, Skeleton, TILE_SURFACE } from '../../../components/dashboard/Panel'
import { Button, FormError } from '../../../components/ui/form'
import { useQuery } from '../../../hooks/useQuery'
import { useResource } from '../../../hooks/useResource'
import { useToast } from '../../../hooks/useToast'
import { adminReportService, type ReportDepartment, type ReportFilters } from '../../../services/admin/report.service'
import { getApiErrorMessage } from '../../../services/httpClient'
import { daySpan, isoDay, RANGE_OPTIONS, rangeDays, REPORT_DOWNLOAD_MAX_DAYS } from '../audit/auditUi'

/** The reports, grouped the way the design shows them. Names match the backend's report types. */
const CATALOG: { area: string; reports: { type: string; label: string; note: string; about: string }[] }[] = [
  {
    area: 'People',
    reports: [
      {
        type: 'workforce',
        label: 'Workforce',
        note: 'Everyone and where they are',
        about: 'Everyone who can be put on a project, by where they are right now: in a project, on the bench, in training, or unassigned. Admins and RMGs are not included.',
      },
      { type: 'bench_aging', label: 'Bench aging', note: 'How long people have been on the bench', about: 'People on the bench, how long they have been there, and their bench zone.' },
      { type: 'red_zone', label: 'Red zone', note: 'People past the red threshold', about: 'People who have been on the bench past the red threshold of the bench policy.' },
    ],
  },
  {
    area: 'Demand and hiring',
    reports: [
      { type: 'demand_supply', label: 'Demand and supply', note: 'Open requirements against people available', about: 'For each skill: how many open requirements need it, and how many people have it.' },
      { type: 'requirements', label: 'Requirements', note: 'Requirements and their status', about: 'Requirements, their priority and status, and how many candidates each has.' },
      { type: 'candidate_pipeline', label: 'Candidate pipeline', note: 'Where candidates are in the process', about: 'Candidates for each requirement and where they are in the process.' },
      { type: 'interviews', label: 'Interviews', note: 'Held and scheduled', about: 'Interviews held and scheduled, with the feedback given.' },
    ],
  },
  {
    area: 'Projects',
    reports: [
      { type: 'allocations', label: 'Allocations', note: 'Current project allocations', about: 'Who is allocated to which project, for how many hours a day, and from when.' },
      { type: 'allocation_capacity', label: 'Allocation capacity', note: 'Hours booked against hours available', about: 'For each allocated person: hours a day they work, hours booked, and hours still free.' },
    ],
  },
  {
    area: 'Development',
    reports: [
      { type: 'rejections', label: 'Rejections', note: 'Rejections and their reasons', about: 'Candidates who were rejected, by whom, and why.' },
      { type: 'training', label: 'Training', note: 'Assignments and progress', about: 'Training assigned to people and how far they have got.' },
    ],
  },
]

const ALL = CATALOG.flatMap((a) => a.reports)
const PAGE = 25

/** Reports the server keeps to Admins (org-wide skill data). Hidden from Manager and RMG. */
const ADMIN_ONLY = new Set(['demand_supply'])

/** Solid background for sticky headers, so rows scrolling underneath never show through. */
const STICKY_BG = 'bg-slate-50 dark:bg-[#151917]'

type Row = Record<string, unknown>

/** "benchStartDate" or "employee_id" as a readable column heading. */
function heading(key: string): string {
  const spaced = key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').toLowerCase()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

const isStatusKey = (k: string) => /status$/i.test(k)
const isDateKey = (k: string) => /(date|At|since)$/.test(k)

/** "IN_PROGRESS" as "In progress". Already readable text is left alone. */
function readable(v: string): string {
  if (!/^[A-Z0-9_]+$/.test(v)) return v
  const s = v.replace(/_/g, ' ').toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** "1 Oct" (or "1 Oct 2025" when not this year) for a date or date-time. */
function shortDate(v: string): string {
  const [y, m, d] = v.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return v
  const date = new Date(y, m - 1, d)
  const sameYear = y === new Date().getFullYear()
  return date.toLocaleDateString(undefined, sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' })
}

function tone(v: string): string {
  const s = v.toLowerCase()
  if (/red|reject|cancel|fail|inactive|shortage|closed/.test(s)) return 'bg-rose-500/12 text-rose-600 dark:text-rose-400'
  if (/bench|amber|pending|hold|scheduled|progress|unassigned|draft/.test(s)) return 'bg-amber-500/14 text-amber-700 dark:text-amber-300'
  if (/project|green|active|allocated|complete|selected|published|passed|available|open/.test(s)) return 'bg-brand-500/12 text-brand-700 dark:text-brand-400'
  return 'bg-slate-500/10 text-ink-500 dark:text-slate-300'
}

/** The person a row is about, when it has an ID and a name: shown together in one "Person" column. */
const NAME_KEYS = ['name', 'employee']

function columnsOf(rows: Row[]): { keys: string[]; personName?: string } {
  if (!rows.length) return { keys: [] }
  const keys = Object.keys(rows[0])
  const personName = keys.includes('employeeId') ? NAME_KEYS.find((k) => keys.includes(k)) : undefined
  if (!personName) return { keys }
  return { keys: ['__person', ...keys.filter((k) => k !== 'employeeId' && k !== personName)], personName }
}

function Cell({ k, row, personName }: { k: string; row: Row; personName?: string }) {
  if (k === '__person') {
    return (
      <span>
        <span className="text-ink-900 dark:text-white">{String(row[personName!] ?? '—')}</span>{' '}
        <span className="text-xs text-ink-500 dark:text-slate-400">{String(row.employeeId ?? '')}</span>
      </span>
    )
  }
  const v = row[k]
  if (v === null || v === undefined || v === '') return <span className="text-ink-500 dark:text-slate-500">—</span>
  if (typeof v === 'boolean') return <>{v ? 'Yes' : 'No'}</>
  if (typeof v === 'number') return <>{v.toLocaleString()}</>
  const text = String(v)
  if ((isStatusKey(k) || k === 'priority' || k === 'decision' || k === 'recommendation') && text) {
    return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap ${tone(text)}`}>{readable(text)}</span>
  }
  if (isDateKey(k)) return <span className="whitespace-nowrap">{shortDate(text)}</span>
  return <>{readable(text)}</>
}

/** Up to three headline numbers for a report, from the rows on screen. */
function numbersFor(type: string, rows: Row[]): { value: number; label: string }[] {
  const count = (pred: (r: Row) => boolean) => rows.filter(pred).length
  const str = (r: Row, k: string) => String(r[k] ?? '')
  switch (type) {
    case 'workforce':
      return [
        { value: rows.length, label: 'people in this view' },
        { value: count((r) => str(r, 'status') === 'In project'), label: 'in a project' },
        { value: count((r) => str(r, 'status').startsWith('On bench')), label: 'on the bench' },
      ]
    case 'bench_aging':
      return [
        { value: rows.length, label: 'people on the bench' },
        { value: count((r) => str(r, 'benchStatus') === 'AMBER'), label: 'in amber' },
        { value: count((r) => str(r, 'benchStatus') === 'RED'), label: 'in red' },
      ]
    case 'red_zone': {
      const days = rows.map((r) => Number(r.daysOnBench) || 0)
      return [
        { value: rows.length, label: 'people in red' },
        { value: days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0, label: 'average days on bench' },
        { value: days.length ? Math.max(...days) : 0, label: 'longest, in days' },
      ]
    }
    case 'demand_supply':
      return [
        { value: rows.length, label: 'skills' },
        { value: count((r) => r.shortage === true), label: 'short of people' },
      ]
    default:
      return [{ value: rows.length, label: 'rows in this view' }]
  }
}

/**
 * `narrowed` is the Manager and RMG view: the same reports, with rows limited to their own projects or
 * associates (the server does the narrowing and says so in `scope`).
 */
export default function ReportsPage({ narrowed = false }: { narrowed?: boolean }) {
  const toast = useToast()
  const groups = narrowed
    ? CATALOG.map((g) => ({ ...g, reports: g.reports.filter((r) => !ADMIN_ONLY.has(r.type)) })).filter((g) => g.reports.length)
    : CATALOG
  const [searchParams, setSearchParams] = useSearchParams()
  const type = searchParams.get('r') ?? 'workforce'
  const current = ALL.find((r) => r.type === type) ?? ALL[0]

  // "Today" is taken once when the page opens, so the dates don't shift while it is on screen.
  const [anchor] = useState(() => new Date())
  const range = searchParams.get('range') ?? '7'
  const customFrom = searchParams.get('from') ?? isoDay(new Date(anchor.getTime() - 6 * 864e5))
  const customTo = searchParams.get('to') ?? isoDay(anchor)
  const department = searchParams.get('department') ?? ''
  const [size, setSize] = useState(PAGE)
  const [downloading, setDownloading] = useState<'csv' | 'xlsx' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const setParams = (patch: Record<string, string | undefined>) => {
    setSearchParams(
      (c) => {
        const n = new URLSearchParams(c)
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined || v === '') n.delete(k)
          else n.set(k, v)
        }
        return n
      },
      { replace: true },
    )
    setSize(PAGE)
  }

  // Filters follow the report: a report without a date or a department simply doesn't show that control.
  const supports = useQuery('reportFilters', { type: current.type })
  const hasDate = supports.data?.date ?? false
  const hasDept = supports.data?.department ?? false
  const days = useMemo(() => rangeDays(range, customFrom, customTo, anchor), [range, customFrom, customTo, anchor])
  const filters: ReportFilters = {
    from: hasDate ? days.start : undefined,
    to: hasDate ? days.end : undefined,
    department: hasDept && department ? department : undefined,
  }

  const rowsQuery = useQuery('reportRows', { type: current.type, ...filters })
  // The previous rows stay on screen while new filters load; this says so instead of looking stuck.
  const refreshing = Boolean(rowsQuery.data) && rowsQuery.loading
  const deptList = useResource('admin/report-departments')
  const departments = deptList.data ?? []

  const rows = useMemo(() => rowsQuery.data?.rows ?? [], [rowsQuery.data])
  const { keys, personName } = useMemo(() => columnsOf(rows), [rows])
  const shown = rows.slice(0, size)
  const scope = rowsQuery.data?.scope
  const numbers = useMemo(() => numbersFor(current.type, rows), [current.type, rows])

  // Downloads of a date-based report are capped at REPORT_DOWNLOAD_MAX_DAYS; the screen shows any range.
  const span = hasDate ? daySpan(days.start, days.end) : 0
  const downloadTooLong = hasDate && span > REPORT_DOWNLOAD_MAX_DAYS

  async function download(format: 'xlsx' | 'csv') {
    if (downloadTooLong) return
    setDownloading(format)
    setError(null)
    try {
      const blob = format === 'xlsx'
        ? await adminReportService.xlsx(current.type, filters)
        : await adminReportService.csv(current.type, filters)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${current.type}-${hasDate ? `${days.start}-to-${days.end}` : 'all'}.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Download started', `${rows.length.toLocaleString()} rows`)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not download the report. Try again.'))
    } finally {
      setDownloading(null)
    }
  }

  const deptText = hasDept && department ? department : 'all departments'
  const filterText = [hasDate ? days.label : null, deptText].filter(Boolean).join(', ')

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl dark:text-white">Reports</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-slate-400">
          Pick a report on the left. Filter it, look at it on screen, and download exactly what you see.
        </p>
        {scope && (
          <span className="mt-3 inline-flex gap-1 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs text-ink-500 dark:border-white/8 dark:bg-white/4 dark:text-slate-400">
            Showing <b className="text-brand-600 dark:text-brand-400">{deptText}</b> · {scope}
          </span>
        )}
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className={`${TILE_SURFACE} grid overflow-hidden lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]`}
        aria-label="Reports"
      >
        {/* Report list: grouped by area; scrolls inside a fixed height */}
        <nav className="h-[280px] overflow-y-auto border-b border-slate-100 lg:h-[720px] lg:border-r lg:border-b-0 dark:border-white/6" aria-label="Report list">
          {groups.map((g) => (
            <div key={g.area}>
              <div className={`sticky top-0 z-[1] border-b border-slate-100 px-4 py-2 text-[10px] font-bold tracking-[0.12em] text-ink-500 uppercase dark:border-white/6 dark:text-slate-500 ${STICKY_BG}`}>
                {g.area}
              </div>
              {g.reports.map((r) => {
                const on = r.type === current.type
                return (
                  <button
                    key={r.type}
                    type="button"
                    aria-current={on || undefined}
                    onClick={() => setParams({ r: r.type === 'workforce' ? undefined : r.type, department: undefined })}
                    className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition-colors dark:border-white/6 ${
                      on ? 'bg-brand-500/8 shadow-[inset_3px_0_0_var(--color-brand-500)]' : 'hover:bg-slate-50 dark:hover:bg-white/3'
                    }`}
                  >
                    <span className="block text-sm font-semibold text-ink-900 dark:text-white">{r.label}</span>
                    <span className="block text-xs text-ink-500 dark:text-slate-400">{r.note}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="grid min-w-0 content-start gap-4 p-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-ink-900 dark:text-white">{current.label}</h2>
            <p className="mt-1 max-w-[60ch] text-sm text-ink-500 dark:text-slate-400">{current.about}</p>
          </div>

          <div className="grid gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-white/8 dark:bg-white/3">
            {hasDate && (
              <div className="flex flex-wrap items-center gap-3">
                <div role="group" aria-label="Date range" className="inline-flex flex-wrap rounded-xl border border-slate-200/80 bg-white p-1 dark:border-white/8 dark:bg-white/4">
                  {RANGE_OPTIONS.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      aria-pressed={range === o.key}
                      onClick={() => setParams({ range: o.key === '7' ? undefined : o.key })}
                      className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                        range === o.key ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900' : 'text-ink-500 hover:text-ink-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                {range === 'custom' && (
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-500 dark:text-slate-400">
                    <label className="flex items-center gap-1.5">
                      From
                      <input type="date" value={customFrom} max={customTo} onChange={(e) => setParams({ from: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-ink-900 dark:border-white/10 dark:bg-white/5 dark:text-white" />
                    </label>
                    <label className="flex items-center gap-1.5">
                      To
                      <input type="date" value={customTo} min={customFrom} onChange={(e) => setParams({ to: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-ink-900 dark:border-white/10 dark:bg-white/5 dark:text-white" />
                    </label>
                  </div>
                )}
              </div>
            )}
            {hasDept && (
              <DepartmentSearch
                value={department}
                options={departments}
                onPick={(d) => setParams({ department: d || undefined })}
              />
            )}
            <p className={`flex items-center gap-1.5 text-xs ${refreshing ? 'font-semibold text-brand-600 dark:text-brand-400' : 'text-ink-500 dark:text-slate-400'}`} role="status">
              {refreshing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {refreshing ? (
                <>Filtering {current.label.toLowerCase()} for {filterText}…</>
              ) : hasDate || hasDept ? (
                <>Showing {current.label.toLowerCase()} for <b className="text-ink-900 dark:text-white">{filterText}</b>.</>
              ) : (
                'This report has no date or department filter. It shows everything.'
              )}
            </p>
          </div>

          {error && <FormError message={error} />}

          {rowsQuery.data && (
            <div className={`grid gap-2.5 ${numbers.length === 3 ? 'sm:grid-cols-3' : numbers.length === 2 ? 'sm:grid-cols-2' : ''}`}>
              {numbers.map((n) => (
                <div key={n.label} className="rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-white/8">
                  <b className="block text-xl tabular-nums text-ink-900 dark:text-white">{n.value.toLocaleString()}</b>
                  <span className="text-xs text-ink-500 dark:text-slate-400">{n.label}</span>
                </div>
              ))}
            </div>
          )}

          {rowsQuery.error && !rowsQuery.data ? (
            <PanelError message={rowsQuery.error} status={null} onRetry={() => setSize(PAGE)} />
          ) : !rowsQuery.data ? (
            <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-ink-500 dark:border-white/10 dark:text-slate-400">
              Nothing matches these filters.
            </div>
          ) : (
            <div className={`overflow-hidden rounded-2xl border border-slate-200/80 transition-opacity dark:border-white/8 ${refreshing ? 'pointer-events-none opacity-40' : ''}`} aria-busy={refreshing}>
              {/* Fixed height: the header stays in view and only the rows scroll */}
              <div className="h-[340px] overflow-auto">
                <table className="w-full min-w-[620px] border-collapse text-sm">
                  <thead>
                    <tr>
                      {keys.map((c) => (
                        <th
                          key={c}
                          className={`sticky top-0 z-[1] border-b border-slate-100 px-3.5 py-2.5 text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-ink-500 uppercase dark:border-white/6 dark:text-slate-500 ${STICKY_BG} ${
                            typeof rows[0][c] === 'number' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {c === '__person' ? 'Person' : heading(c)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((r, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0 dark:border-white/6">
                        {keys.map((c) => (
                          <td key={c} className={`px-3.5 py-2.5 text-ink-900 dark:text-white ${typeof r[c] === 'number' ? 'text-right tabular-nums' : ''}`}>
                            <Cell k={c} row={r} personName={personName} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-3.5 py-2.5 text-xs text-ink-500 dark:border-white/6 dark:text-slate-400">
                <span>Showing {shown.length.toLocaleString()} of {rows.length.toLocaleString()} rows</span>
                {rows.length > size && <Button variant="secondary" onClick={() => setSize((s) => s + PAGE)}>Show {Math.min(PAGE, rows.length - size)} more</Button>}
              </div>
            </div>
          )}

          {/* Download: always the rows for the current filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-white/8">
            <p className="max-w-[48ch] text-xs text-ink-500 dark:text-slate-400">
              {downloadTooLong
                ? `Downloads are limited to ${REPORT_DOWNLOAD_MAX_DAYS} days at a time. This range is ${span} days, so pick custom dates within ${REPORT_DOWNLOAD_MAX_DAYS} days to download.`
                : `Download includes the ${rows.length.toLocaleString()} rows for these filters: ${filterText}.`}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" icon={<Download className="h-4 w-4" />} loading={downloading === 'xlsx'} onClick={() => void download('xlsx')} disabled={downloading !== null || downloadTooLong || !rowsQuery.data || rows.length === 0}>
                Download Excel
              </Button>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  )
}

/** Type to choose a department; a few matches are shown with how many people each has. */
function DepartmentSearch({ value, options, onPick }: { value: string; options: ReportDepartment[]; onPick: (d: string) => void }) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const q = text.trim().toLowerCase()
  const matches = (q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options).slice(0, 6)

  if (value) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-ink-500 dark:text-slate-400">Department</span>
        <span className="inline-flex items-center gap-2 rounded-xl border border-brand-500/30 bg-brand-500/8 px-3 py-2 text-sm font-semibold text-brand-700 dark:text-brand-400">
          {value}
          <button type="button" aria-label="Remove department filter" onClick={() => onPick('')}><X className="h-3.5 w-3.5" /></button>
        </span>
      </div>
    )
  }
  return (
    <div className="relative max-w-sm">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Department · type to choose"
        aria-label="Department (required)"
        autoComplete="off"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500/40 dark:border-white/10 dark:bg-white/5 dark:text-white"
      />
      {open && (
        <ul className="absolute top-full right-0 left-0 z-10 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-white/10 dark:bg-ink-900">
          {matches.length === 0 && <li className="px-2.5 py-2 text-xs text-ink-500 dark:text-slate-400">No department matches “{text}”.</li>}
          {matches.map((d) => (
            <li key={d.name}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setOpen(false)
                  setText('')
                  onPick(d.name)
                }}
              >
                <span>{d.name}</span>
                <span className="text-xs text-ink-500 dark:text-slate-400">{d.people.toLocaleString()} {d.people === 1 ? 'person' : 'people'}</span>
              </button>
            </li>
          ))}
          {options.length > matches.length && (
            <li className="px-2.5 pt-2 text-[11px] text-ink-500 dark:text-slate-500">
              Showing {matches.length} of {options.length} departments. Keep typing to narrow it down.
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
