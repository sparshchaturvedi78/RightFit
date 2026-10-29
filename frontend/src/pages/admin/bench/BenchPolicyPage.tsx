import { motion } from 'motion/react'
import { RefreshCw } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { PanelError, Skeleton, TILE_SURFACE } from '../../../components/dashboard/Panel'
import { Button, Field, FormError, Input } from '../../../components/ui/form'
import { useResource } from '../../../hooks/useResource'
import { useToast } from '../../../hooks/useToast'
import { adminBenchConfigurationService, type BenchConfigurationDTO } from '../../../services/admin/benchConfiguration.service'
import { getApiErrorMessage } from '../../../services/httpClient'
import { useAppDispatch } from '../../../store'
import type { ResourceKey } from '../../../store/resourceRegistry'
import { loadResource } from '../../../store/resourcesSlice'
import { formatDay } from '../employees/employeeUi'

const STALE_AFTER_SAVE: ResourceKey[] = ['admin/bench-policy', 'admin/bench-history']

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Whole days, at least 1. Anything else is not a number of days. */
function parseDays(raw: string): number | null {
  const n = Number(raw)
  return raw.trim() !== '' && Number.isInteger(n) && n >= 1 ? n : null
}

export default function BenchPolicyPage() {
  const dispatch = useAppDispatch()
  const current = useResource('admin/bench-policy')
  const history = useResource('admin/bench-history')
  const policy = current.data

  const reload = () => STALE_AFTER_SAVE.forEach((key) => void dispatch(loadResource({ key, force: true })))

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl dark:text-white">Bench policy</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500 dark:text-slate-400">
            How long someone can sit on the bench before their status turns amber, then red. Changing it starts a new policy
            from the date you choose; earlier periods keep the rules they were under.
          </p>
        </div>
        <Button
          variant="secondary"
          aria-label="Refresh bench policy"
          disabled={current.loading}
          onClick={reload}
          icon={<RefreshCw className={`h-4 w-4 ${current.loading ? 'animate-spin' : ''}`} />}
        >
          Refresh
        </Button>
      </motion.header>

      {current.error && !policy ? (
        <PanelError message={current.error} status={null} onRetry={reload} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]"
        >
          <section className={`${TILE_SURFACE} p-6`} aria-labelledby="bench-current">
            <h2 id="bench-current" className="text-base font-bold text-ink-900 dark:text-white">Current policy</h2>
            <p className="mt-1 mb-5 text-sm text-ink-500 dark:text-slate-400">
              {policy ? `In effect since ${formatDay(policy.effectiveFrom)}. Days on the bench, counted from when someone was last placed.` : 'Loading…'}
            </p>

            {policy ? <PolicyScale green={policy.greenMaxDays} amber={policy.amberMaxDays} /> : <Skeleton className="h-14 rounded-2xl" />}
            {policy && <PolicyLegend green={policy.greenMaxDays} amber={policy.amberMaxDays} />}

            <div className="mt-7 border-t border-slate-100 pt-6 dark:border-white/6">
              {policy && <PolicyForm key={policy.id} policy={policy} onSaved={reload} />}
            </div>
          </section>

          <aside className={`${TILE_SURFACE} h-fit p-6`} aria-labelledby="bench-history">
            <h2 id="bench-history" className="text-base font-bold text-ink-900 dark:text-white">History</h2>
            <p className="mt-1 mb-5 text-sm text-ink-500 dark:text-slate-400">Every policy that has applied, newest first.</p>
            {history.error && !history.data ? (
              <PanelError message={history.error} status={null} onRetry={reload} />
            ) : !history.data ? (
              <div className="space-y-4">
                {[0, 1].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl" />
                ))}
              </div>
            ) : (
              <HistoryList rows={history.data} />
            )}
          </aside>
        </motion.div>
      )}
    </div>
  )
}

/** The three zones as one bar. Widths follow the days, so the bar redraws as the numbers change. */
function PolicyScale({ green, amber }: { green: number; amber: number }) {
  const span = amber + Math.max(15, Math.round(amber * 0.25))
  const pct = (days: number) => `${(days / span) * 100}%`
  return (
    <div>
      <div className="flex h-14 overflow-hidden rounded-2xl bg-slate-100 dark:bg-white/6" role="img" aria-label={`Green up to ${green} days, amber up to ${amber} days, red from ${amber + 1} days`}>
        <div className="flex items-center justify-center bg-green-500 text-xs font-bold text-white dark:bg-green-400" style={{ flexBasis: pct(green) }}>
          Green
        </div>
        <div className="flex items-center justify-center bg-amber-500 text-xs font-bold text-white dark:bg-amber-400" style={{ flexBasis: pct(amber - green) }}>
          Amber
        </div>
        <div className="flex items-center justify-center bg-rose-500 text-xs font-bold text-white dark:bg-rose-400" style={{ flexBasis: pct(span - amber) }}>
          Red
        </div>
      </div>
      <div className="relative mt-2 h-5 text-[11px] text-ink-500 tabular-nums dark:text-slate-400">
        <span className="absolute -translate-x-1/2" style={{ left: '0%' }}>0</span>
        <span className="absolute -translate-x-1/2" style={{ left: pct(green) }}>{green}</span>
        <span className="absolute -translate-x-1/2" style={{ left: pct(amber) }}>{amber}</span>
      </div>
    </div>
  )
}

function PolicyLegend({ green, amber }: { green: number; amber: number }) {
  const items = [
    { color: 'bg-green-500 dark:bg-green-400', label: `Up to ${green} days`, note: 'Recently placed. Nothing to do.' },
    { color: 'bg-amber-500 dark:bg-amber-400', label: `${green + 1} to ${amber} days`, note: 'Needs a look from the RMG.' },
    { color: 'bg-rose-500 dark:bg-rose-400', label: `${amber + 1} days and over`, note: 'Escalated. Needs a placement.' },
  ]
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      {items.map((it) => (
        <div key={it.label} className="rounded-2xl border border-slate-200/80 p-4 dark:border-white/8">
          <p className="flex items-center gap-2 text-lg font-bold text-ink-900 tabular-nums dark:text-white">
            <span className={`h-2.5 w-2.5 rounded-full ${it.color}`} />
            {it.label}
          </p>
          <p className="mt-1 text-xs text-ink-500 dark:text-slate-400">{it.note}</p>
        </div>
      ))}
    </div>
  )
}

function PolicyForm({ policy, onSaved }: { policy: BenchConfigurationDTO; onSaved: () => void }) {
  const toast = useToast()
  const [green, setGreen] = useState(String(policy.greenMaxDays))
  const [amber, setAmber] = useState(String(policy.amberMaxDays))
  const [from, setFrom] = useState(todayISO())
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<{ green?: string; amber?: string; from?: string }>({})
  const [saving, setSaving] = useState(false)

  const g = parseDays(green)
  const a = parseDays(amber)
  const changed = g !== policy.greenMaxDays || a !== policy.amberMaxDays
  const preview = useMemo(() => (g !== null && a !== null && a > g ? { green: g, amber: a } : null), [g, a])
  // Shown as the numbers are typed, not only on save. Save stays disabled until both numbers are valid.
  const amberError = g !== null && a !== null && a <= g ? 'Amber must be longer than green' : undefined
  const invalid = g === null || a === null || !!amberError

  async function submit(ev: FormEvent) {
    ev.preventDefault()
    const found: { green?: string; amber?: string; from?: string } = {}
    if (g === null) found.green = 'Enter whole days, starting at 1'
    if (a === null) found.amber = 'Enter whole days, starting at 1'
    if (g !== null && a !== null && a <= g) found.amber = 'Amber must be longer than green'
    if (!from || from < todayISO()) found.from = 'Pick today or a later date'
    setFieldError(found)
    if (Object.keys(found).length) return
    setError(null)
    setSaving(true)
    try {
      await adminBenchConfigurationService.create({ greenMaxDays: g!, amberMaxDays: a!, effectiveFrom: from })
      toast.success('Bench policy saved', `Green up to ${g} days, amber up to ${a}, red from ${a! + 1}`)
      onSaved()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save the bench policy.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-ink-900 dark:text-white">Set a new policy</h3>
        <p className="mt-1 text-sm text-ink-500 dark:text-slate-400">
          {preview ? `Red will start on day ${preview.amber + 1}.` : 'Enter both numbers to see when red starts.'}
        </p>
      </div>
      <FormError message={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Green up to (days)" htmlFor="bench-green" required error={fieldError.green ?? (g === null && green !== '' ? 'Enter whole days, starting at 1' : undefined)}>
          <Input id="bench-green" inputMode="numeric" value={green} onChange={(e) => { setGreen(e.target.value); setFieldError((x) => ({ ...x, green: undefined, amber: undefined })) }} />
        </Field>
        <Field label="Amber up to (days)" htmlFor="bench-amber" required error={fieldError.amber ?? amberError ?? (a === null && amber !== '' ? 'Enter whole days, starting at 1' : undefined)}>
          <Input id="bench-amber" inputMode="numeric" value={amber} onChange={(e) => { setAmber(e.target.value); setFieldError((x) => ({ ...x, amber: undefined })) }} />
        </Field>
      </div>

      <Field label="Takes effect" htmlFor="bench-from" required error={fieldError.from} hint="The current policy ends the day before. Each save adds a new version; nothing is deleted.">
        <Input id="bench-from" type="date" value={from} min={todayISO()} onChange={(e) => { setFrom(e.target.value); setFieldError((x) => ({ ...x, from: undefined })) }} className="max-w-xs" />
      </Field>

      <div className="flex flex-wrap justify-end gap-3">
        <Button
          variant="secondary"
          disabled={!changed}
          onClick={() => {
            setGreen(String(policy.greenMaxDays))
            setAmber(String(policy.amberMaxDays))
            setFieldError({})
          }}
        >
          Reset to current
        </Button>
        <Button type="submit" variant="primary" loading={saving} disabled={!changed || invalid}>
          Save new policy
        </Button>
      </div>
    </form>
  )
}

function HistoryList({ rows }: { rows: BenchConfigurationDTO[] }) {
  const sorted = [...rows].sort((x, y) => y.effectiveFrom.localeCompare(x.effectiveFrom))
  if (sorted.length === 0) {
    return <p className="text-sm text-ink-500 dark:text-slate-400">No bench policy has been set yet.</p>
  }
  return (
    // Long history scrolls inside the panel instead of stretching the page.
    <ol className="max-h-105 space-y-0 overflow-y-auto pr-2">
      {sorted.map((r) => (
        <li key={r.id} className="relative border-l-2 border-slate-200 pb-5 pl-5 last:border-l-transparent last:pb-0 dark:border-white/10">
          <span
            className={`absolute top-1 -left-[7px] h-3 w-3 rounded-full border-2 ${
              r.isActive ? 'border-brand-500 bg-brand-500' : 'border-slate-400 bg-white dark:bg-ink-900'
            }`}
          />
          <p className="text-sm font-semibold text-ink-900 dark:text-white">
            {formatDay(r.effectiveFrom)} → {r.isActive ? 'now' : r.effectiveTo ? formatDay(r.effectiveTo) : '—'}
          </p>
          <p className="mt-0.5 text-xs text-ink-500 dark:text-slate-400">
            {r.isActive ? 'In effect' : 'Earlier policy'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold">
            <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-green-700 dark:text-green-400">Green ≤ {r.greenMaxDays}d</span>
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-700 dark:text-amber-400">Amber ≤ {r.amberMaxDays}d</span>
            <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-rose-700 dark:text-rose-400">Red ≥ {r.redThresholdDays}d</span>
          </div>
        </li>
      ))}
    </ol>
  )
}
