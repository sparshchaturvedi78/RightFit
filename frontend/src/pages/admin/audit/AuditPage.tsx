import { motion } from 'motion/react'
import { ChevronRight, Download, Loader2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PanelError, Skeleton, TILE_SURFACE } from '../../../components/dashboard/Panel'
import { Button, FormError } from '../../../components/ui/form'
import { useQuery } from '../../../hooks/useQuery'
import { useResource } from '../../../hooks/useResource'
import { useToast } from '../../../hooks/useToast'
import { adminAuditService, type AuditFilters, type AuditLogDTO } from '../../../services/admin/audit.service'
import { adminEmployeeService, type EmployeeDTO } from '../../../services/admin/employee.service'
import { getApiErrorMessage } from '../../../services/httpClient'
import { formatDay } from '../employees/employeeUi'
import { useAppDispatch } from '../../../store'
import { invalidateQueries } from '../../../store/queriesSlice'
import { AREAS, actionLabel, actionTone, AUDIT_EXPORT_MAX_DAYS, daySpan, initials, isoDay, RANGE_OPTIONS, rangeDays, TONE_CLASS } from './auditUi'
import AuditDetail from './AuditDetail'

const PAGE = 25

/** Solid background for sticky headers, so rows scrolling underneath never show through. */
const STICKY_BG = 'bg-slate-50 dark:bg-[#151917]'

function timeOf(ts: string): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

/** "8 Oct" for an ISO day. */
function shortDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

/** Who did it, for a list line: their name, else their email, else "System". */
function whoOf(e: AuditLogDTO): string {
  return e.performedByName ?? (e.performedByEmail && e.performedByEmail !== 'system' ? e.performedByEmail : 'System')
}

export default function AuditPage() {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  // Everything that shapes the view is in the URL, so a shared link opens the same view.
  // "Today" is taken once when the page opens, so the dates don't shift while it is on screen.
  const [anchor] = useState(() => new Date())
  const today = isoDay(anchor)
  const yesterday = isoDay(new Date(anchor.getTime() - 864e5))
  const range = searchParams.get('range') ?? '7'
  const customFrom = searchParams.get('from') ?? isoDay(new Date(anchor.getTime() - 6 * 864e5))
  const customTo = searchParams.get('to') ?? today
  const personId = Number(searchParams.get('person')) || undefined
  const personName = searchParams.get('personName') ?? ''
  const action = searchParams.get('action') ?? ''
  const area = searchParams.get('area') ?? 'all'
  const selectedId = Number(searchParams.get('entry')) || null
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Days the user opened or closed; untouched days follow the default (only the newest day open).
  const [toggled, setToggled] = useState<Record<string, boolean>>({})
  // Entries loaded under each day, so the detail panel and the footer can see them.
  const [loaded, setLoaded] = useState<Record<string, AuditLogDTO[]>>({})

  const setParams = useCallback(
    (patch: Record<string, string | undefined>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [k, v] of Object.entries(patch)) {
            if (v === undefined || v === '') next.delete(k)
            else next.set(k, v)
          }
          return next
        },
        { replace: true },
      )
      if (!('entry' in patch)) {
        setToggled({})
        setLoaded({})
      }
    },
    [setSearchParams],
  )

  const days = useMemo(() => rangeDays(range, customFrom, customTo, anchor), [range, customFrom, customTo, anchor])
  const areaEntity = AREAS.find((a) => a.key === area)?.entityType
  const filters: AuditFilters = useMemo(
    () => ({
      startDate: days.start,
      endDate: days.end,
      userId: personId,
      action: action || undefined,
      entityType: areaEntity,
    }),
    [days.start, days.end, personId, action, areaEntity],
  )

  const dayCounts = useQuery('auditDays', filters)
  const summary = useQuery('auditSummary', filters)
  // The previous results stay on screen while new filters load; this says so instead of looking stuck.
  const filtering = Boolean(dayCounts.data) && dayCounts.loading
  const actions = useResource('admin/audit-actions')

  // One group per day that has entries, newest first. The newest day starts open; the rest start closed.
  const groups = useMemo(
    () => [...(dayCounts.data ?? [])].filter((d) => d.count > 0).sort((a, b) => b.date.localeCompare(a.date)),
    [dayCounts.data],
  )
  const defaultOpen = groups[0]?.date
  const isOpen = (day: string) => toggled[day] ?? day === defaultOpen
  const totalInRange = groups.reduce((n, d) => n + d.count, 0)
  const shownCount = groups.reduce((n, g) => n + (isOpen(g.date) ? (loaded[g.date]?.length ?? 0) : 0), 0)

  const onLoaded = useCallback((day: string, items: AuditLogDTO[]) => setLoaded((p) => ({ ...p, [day]: items })), [])
  const allLoaded = Object.values(loaded).flat()
  const firstOpen = groups.find((g) => isOpen(g.date))?.date
  const selected = allLoaded.find((r) => r.id === selectedId) ?? (firstOpen ? loaded[firstOpen]?.[0] : undefined) ?? null

  // Downloads are capped at AUDIT_EXPORT_MAX_DAYS; the screen still shows any range.
  const span = daySpan(days.start, days.end)
  const exportTooLong = span > AUDIT_EXPORT_MAX_DAYS

  async function download() {
    if (exportTooLong) return
    setExporting(true)
    setError(null)
    try {
      const blob = await adminAuditService.exportCsv(filters)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-log-${days.start}-to-${days.end}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Download started', `${totalInRange.toLocaleString()} entries`)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not download the CSV. Try again.'))
    } finally {
      setExporting(false)
    }
  }

  const areaLabel = area !== 'all' ? AREAS.find((a) => a.key === area)?.label : undefined
  const whoText = personName ? `by ${personName}` : 'all people'
  const whatText = [action ? actionLabel(action) : null, areaLabel].filter(Boolean).join(', ') || 'all changes'
  const exportNote = exportTooLong
    ? `Downloads are limited to ${AUDIT_EXPORT_MAX_DAYS} days at a time. This range is ${span} days, so pick custom dates within ${AUDIT_EXPORT_MAX_DAYS} days to download.`
    : `Downloads the ${totalInRange.toLocaleString()} entries shown below, for ${days.label}.`

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl dark:text-white">Audit log</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-slate-400">
            A record of who changed what, and when. Entries can’t be edited or removed.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Stat value={dayCounts.data ? totalInRange.toLocaleString() : undefined} label="entries in this range" />
            <Stat value={summary.data ? summary.data.people.toLocaleString() : undefined} label={summary.data?.people === 1 ? 'person' : 'people'} />
            {summary.data?.topAction && <Stat label="Most common" value={actionLabel(summary.data.topAction)} labelFirst />}
          </div>
        </div>
        <div className="flex max-w-xs flex-col items-end gap-1.5">
          <Button
            variant="primary"
            icon={exporting ? undefined : <Download className="h-4 w-4" />}
            loading={exporting}
            disabled={exportTooLong}
            onClick={() => void download()}
            aria-label="Export CSV"
          >
            Export CSV
          </Button>
          <p className="text-right text-xs text-ink-500 dark:text-slate-400">{exportNote}</p>
        </div>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className={`${TILE_SURFACE} space-y-3 p-4`}
        aria-label="Filters"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Date range" className="inline-flex flex-wrap rounded-xl border border-slate-200/80 bg-slate-50 p-1 dark:border-white/8 dark:bg-white/4">
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
                <input
                  type="date"
                  value={customFrom}
                  max={customTo}
                  onChange={(e) => setParams({ from: e.target.value })}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-ink-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>
              <label className="flex items-center gap-1.5">
                To
                <input
                  type="date"
                  value={customTo}
                  min={customFrom}
                  onChange={(e) => setParams({ to: e.target.value })}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-ink-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>
            </div>
          )}
          <PersonSearch
            selectedName={personName}
            onPick={(e) => setParams({ person: e.userId ? String(e.userId) : undefined, personName: `${e.firstName} ${e.lastName}` })}
            onClear={() => setParams({ person: undefined, personName: undefined })}
          />
          <ActionSearch
            value={action}
            options={actions.data ?? []}
            onPick={(a) => setParams({ action: a || undefined })}
          />
          <button
            type="button"
            onClick={() => {
              setSearchParams({}, { replace: true })
              setToggled({})
              setLoaded({})
            }}
            className="ml-auto text-xs font-semibold text-ink-500 hover:text-ink-900 dark:text-slate-400 dark:hover:text-white"
          >
            Clear filters
          </button>
        </div>

        <div role="group" aria-label="What was changed" className="flex flex-wrap gap-2">
          {AREAS.map((a) => (
            <button
              key={a.key}
              type="button"
              aria-pressed={area === a.key}
              onClick={() => setParams({ area: a.key === 'all' ? undefined : a.key })}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                area === a.key
                  ? 'border-brand-500/30 bg-brand-500/12 text-brand-600 dark:text-brand-400'
                  : 'border-slate-200 text-ink-500 hover:text-ink-900 dark:border-white/10 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        {filtering ? (
          <p className="flex items-center gap-2 text-[13px] font-semibold text-brand-600 dark:text-brand-400" role="status">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Filtering entries from {shortDay(days.start)} to {shortDay(days.end)}, {whoText}, {whatText}…
          </p>
        ) : (
          <p className="text-[13px] text-ink-500 dark:text-slate-400" role="status">
            Showing <b className="text-ink-900 tabular-nums dark:text-white">{totalInRange.toLocaleString()}</b> entries from{' '}
            <b className="text-ink-900 dark:text-white">{shortDay(days.start)}</b> to <b className="text-ink-900 dark:text-white">{shortDay(days.end)}</b>, {whoText}, {whatText}.
          </p>
        )}
      </motion.section>

      {error && <FormError message={error} />}

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={`${TILE_SURFACE} grid overflow-hidden lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]`}
        aria-label="Entries"
      >
        {/* The list has a fixed height and scrolls inside, so a day with 100+ entries stays in the panel. */}
        <div className="flex h-[640px] min-h-0 flex-col border-b border-slate-100 lg:border-r lg:border-b-0 dark:border-white/6">
          {dayCounts.error && !dayCounts.data ? (
            <div className="p-4"><PanelError message={dayCounts.error} status={null} onRetry={() => dispatch(invalidateQueries('auditDays'))} /></div>
          ) : !dayCounts.data ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <p className="text-sm font-semibold text-ink-900 dark:text-white">Nothing matches these filters</p>
              <p className="text-xs text-ink-500 dark:text-slate-400">Try a wider date range, or clear the filters.</p>
            </div>
          ) : (
            <>
              {filtering && (
                <div className="flex shrink-0 items-center gap-2 border-b border-brand-500/20 bg-brand-500/8 px-4 py-2 text-xs font-semibold text-brand-700 dark:text-brand-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating results for the new filters…
                </div>
              )}
              <div
                className={`min-h-0 flex-1 overflow-y-auto transition-opacity ${filtering ? 'pointer-events-none opacity-40' : ''}`}
                role="listbox"
                aria-label="Entry list"
                aria-busy={filtering}
              >
                {groups.map((g) => (
                  <DayGroup
                    key={g.date}
                    day={g.date}
                    title={g.date === today ? 'Today' : g.date === yesterday ? 'Yesterday' : formatDay(g.date) ?? g.date}
                    count={g.count}
                    open={isOpen(g.date)}
                    onToggle={() => setToggled((t) => ({ ...t, [g.date]: !isOpen(g.date) }))}
                    filters={filters}
                    selectedId={selected?.id ?? null}
                    onSelect={(id) => setParams({ entry: String(id) })}
                    onLoaded={onLoaded}
                  />
                ))}
              </div>
              <div className="shrink-0 border-t border-slate-100 px-4 py-2.5 text-xs text-ink-500 tabular-nums dark:border-white/6 dark:text-slate-400">
                Showing {shownCount.toLocaleString()} of {totalInRange.toLocaleString()} entries in this range
              </div>
            </>
          )}
        </div>

        <div className="min-w-0">
          {selected ? <AuditDetail entry={selected} /> : (
            <div className="flex h-full min-h-[320px] items-center justify-center p-8 text-sm text-ink-500 dark:text-slate-400">
              Open a day and pick an entry to read it in full.
            </div>
          )}
        </div>
      </motion.section>
    </div>
  )
}

/**
 * One day in the list. The header opens and closes it and shows the day's total. When open, the day loads
 * its own entries, 25 at a time, so a busy day pages inside its group instead of pushing other days away.
 */
function DayGroup({
  day,
  title,
  count,
  open,
  onToggle,
  filters,
  selectedId,
  onSelect,
  onLoaded,
}: {
  day: string
  title: string
  count: number
  open: boolean
  onToggle: () => void
  filters: AuditFilters
  selectedId: number | null
  onSelect: (id: number) => void
  onLoaded: (day: string, items: AuditLogDTO[]) => void
}) {
  return (
    <section aria-label={title}>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className={`sticky top-0 z-[2] flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 text-[10px] font-bold tracking-[0.12em] text-ink-500 uppercase dark:border-white/6 dark:text-slate-400 ${STICKY_BG}`}
      >
        <span className="flex items-center gap-1.5">
          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-90' : ''}`} />
          {title}
        </span>
        <span className="tabular-nums normal-case tracking-normal font-semibold">
          {count.toLocaleString()} {count === 1 ? 'entry' : 'entries'}
        </span>
      </button>
      {open && <DayItems day={day} count={count} filters={filters} selectedId={selectedId} onSelect={onSelect} onLoaded={onLoaded} />}
    </section>
  )
}

function DayItems({
  day,
  count,
  filters,
  selectedId,
  onSelect,
  onLoaded,
}: {
  day: string
  count: number
  filters: AuditFilters
  selectedId: number | null
  onSelect: (id: number) => void
  onLoaded: (day: string, items: AuditLogDTO[]) => void
}) {
  const [size, setSize] = useState(PAGE)
  const page = useQuery('auditEntries', { ...filters, startDate: day, endDate: day, page: 0, size })
  const items = useMemo(() => page.data?.content ?? [], [page.data])
  const total = page.data?.totalElements ?? count

  useEffect(() => {
    if (page.data) onLoaded(day, items)
  }, [page.data, items, day, onLoaded])

  if (page.error && !page.data) {
    return <p className="px-4 py-3 text-xs text-rose-600 dark:text-rose-400">{page.error}</p>
  }
  if (!page.data) {
    return <div className="space-y-2 p-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
  }
  const left = total - items.length
  return (
    <div className={`transition-opacity ${page.loading ? 'opacity-50' : ''}`} aria-busy={page.loading}>
      {items.map((r) => {
        const tone = actionTone(r.action)
        const on = selectedId === r.id
        return (
          <button
            key={r.id}
            type="button"
            role="option"
            aria-selected={on}
            onClick={() => onSelect(r.id)}
            className={`grid w-full grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors dark:border-white/6 ${
              on ? 'bg-brand-500/8 shadow-[inset_3px_0_0_var(--color-brand-500)]' : 'hover:bg-slate-50 dark:hover:bg-white/3'
            }`}
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-[10px] font-bold ${TONE_CLASS[tone]}`}>{initials(r.action)}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink-900 dark:text-white">{actionLabel(r.action)}</span>
              <span className="block truncate text-xs text-ink-500 dark:text-slate-400">
                {whoOf(r)}{r.changeSummary ? ` · ${r.changeSummary}` : ''}
              </span>
            </span>
            <span className="text-xs text-ink-500 tabular-nums dark:text-slate-400">{timeOf(r.timestamp)}</span>
          </button>
        )
      })}
      {left > 0 && (
        <div className="p-3 text-center">
          <Button variant="secondary" onClick={() => setSize((s) => s + PAGE)}>
            Show {Math.min(PAGE, left)} more · {left.toLocaleString()} left
          </Button>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, labelFirst = false }: { label: string; value?: string; labelFirst?: boolean }) {
  const number = <span className="text-sm font-bold tabular-nums text-ink-900 dark:text-white">{value === undefined ? '–' : value}</span>
  const text = <span className="text-ink-500 dark:text-slate-400">{label}</span>
  return (
    <div className="flex items-baseline gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 shadow-sm dark:border-white/8 dark:bg-white/4 dark:shadow-none">
      {labelFirst ? <>{text}{number}</> : <>{number}{text}</>}
    </div>
  )
}

/** Type a name or employee ID; at most a few matches are shown. Picking one filters the log to that person. */
function PersonSearch({ selectedName, onPick, onClear }: { selectedName: string; onPick: (e: EmployeeDTO) => void; onClear: () => void }) {
  const [text, setText] = useState('')
  const [matches, setMatches] = useState<EmployeeDTO[] | null>(null)
  const [open, setOpen] = useState(false)

  async function search(q: string) {
    setText(q)
    if (q.trim().length < 2) {
      setMatches(null)
      return
    }
    try {
      const page = await adminEmployeeService.list({ q: q.trim(), status: 'ACTIVE', size: 6, sortBy: 'firstName' })
      setMatches(page.content)
    } catch {
      setMatches([])
    }
  }

  if (selectedName) {
    return (
      <span className="inline-flex items-center gap-2 rounded-xl border border-brand-500/30 bg-brand-500/8 px-3 py-2 text-sm font-semibold text-brand-700 dark:text-brand-400">
        {selectedName}
        <button type="button" aria-label="Remove person filter" onClick={onClear}><X className="h-3.5 w-3.5" /></button>
      </span>
    )
  }
  return (
    <div className="relative min-w-[220px]">
      <input
        value={text}
        onChange={(e) => void search(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Anyone · type a name or ID"
        aria-label="Person"
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500/40 dark:border-white/10 dark:bg-white/5 dark:text-white"
      />
      {open && matches && (
        <ul className="absolute top-full right-0 left-0 z-10 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-white/10 dark:bg-ink-900">
          {matches.length === 0 && <li className="px-2.5 py-2 text-xs text-ink-500 dark:text-slate-400">No one matches “{text}”.</li>}
          {matches.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setOpen(false)
                  setText('')
                  onPick(m)
                }}
              >
                <span>{m.firstName} {m.lastName}</span>
                <span className="text-xs text-ink-500 dark:text-slate-400">{m.employeeId}</span>
              </button>
            </li>
          ))}
          {matches.length > 0 && <li className="px-2.5 pt-2 text-[11px] text-ink-500 dark:text-slate-500">Showing {matches.length} matches. Keep typing to narrow it down.</li>}
        </ul>
      )}
    </div>
  )
}

/** Type part of an action name; a few matches are offered. */
function ActionSearch({ value, options, onPick }: { value: string; options: string[]; onPick: (a: string) => void }) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const q = text.trim().toLowerCase()
  const matches = q ? options.filter((o) => actionLabel(o).toLowerCase().includes(q) || o.toLowerCase().includes(q)).slice(0, 6) : options.slice(0, 6)

  if (value) {
    return (
      <span className="inline-flex items-center gap-2 rounded-xl border border-brand-500/30 bg-brand-500/8 px-3 py-2 text-sm font-semibold text-brand-700 dark:text-brand-400">
        {actionLabel(value)}
        <button type="button" aria-label="Remove action filter" onClick={() => onPick('')}><X className="h-3.5 w-3.5" /></button>
      </span>
    )
  }
  return (
    <div className="relative min-w-[220px]">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Any action · type e.g. blocked"
        aria-label="Action"
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500/40 dark:border-white/10 dark:bg-white/5 dark:text-white"
      />
      {open && (
        <ul className="absolute top-full right-0 left-0 z-10 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-white/10 dark:bg-ink-900">
          {matches.length === 0 && <li className="px-2.5 py-2 text-xs text-ink-500 dark:text-slate-400">No action matches “{text}”.</li>}
          {matches.map((a) => (
            <li key={a}>
              <button
                type="button"
                className="w-full rounded-lg px-2.5 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setOpen(false)
                  setText('')
                  onPick(a)
                }}
              >
                {actionLabel(a)}
              </button>
            </li>
          ))}
          {options.length > 6 && <li className="px-2.5 pt-2 text-[11px] text-ink-500 dark:text-slate-500">Showing {matches.length} of {options.length} actions. Keep typing to narrow it down.</li>}
        </ul>
      )}
    </div>
  )
}
