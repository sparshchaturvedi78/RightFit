import { motion } from 'motion/react'
import { CalendarClock, Star } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../../components/dashboard/Panel'
import { Button } from '../../../components/ui/form'
import RefreshButton from '../../../components/ui/RefreshButton'
import { useQuery } from '../../../hooks/useQuery'
import { useToast } from '../../../hooks/useToast'
import { getApiErrorMessage } from '../../../services/httpClient'
import { interviewService, type InterviewDTO, type SubmitFeedbackRequest } from '../../../services/interview.service'
import { useAppDispatch } from '../../../store'
import { invalidateQueries } from '../../../store/queriesSlice'
import { humanize, parseServerDate } from '../../../utils/format'

type Show = 'upcoming' | 'feedback' | 'past' | 'cancelled'
type Range = 'week' | 'fortnight' | 'all'

const OPEN = ['SCHEDULED', 'ACCEPTED']
const DEAD = ['CANCELLED', 'DECLINED']

const SHOW_LABEL: Record<Show, string> = { upcoming: 'Upcoming', feedback: 'Feedback due', past: 'Past', cancelled: 'Cancelled' }
const RANGE_LABEL: Record<Range, string> = { week: 'This week', fortnight: 'Next 2 weeks', all: 'All dates' }

const STATUS_TONE: Record<string, string> = {
  SCHEDULED: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
  ACCEPTED: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
  DECLINED: 'bg-slate-500/12 text-ink-700 dark:text-slate-300',
  CANCELLED: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

function endOf(i: InterviewDTO): Date {
  const start = parseServerDate(i.scheduledAt)
  return new Date(start.getTime() + (i.durationMinutes ?? 60) * 60_000)
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** Monday 00:00 to Sunday 23:59 of the week containing `now`. */
function weekBounds(now: Date): [Date, Date] {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const back = (monday.getDay() + 6) % 7
  monday.setDate(monday.getDate() - back)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 7)
  return [monday, sunday]
}

/** Every interview on the manager's requirements, grouped by day, with the open ones checked for clashes. */
/**
 * The interviews page. `manager`: every interview on the manager's requirements. `mine`: the interviews the signed-in
 * person conducts (an INTERVIEWER duty), who can give feedback but not cancel.
 */
export default function InterviewsPage({ scope = 'manager' }: { scope?: 'manager' | 'mine' }) {
  const basePath = scope === 'mine' ? '/associate/interviews-to-take' : '/manager/interviews'
  const requirementPath = (id: string) => (scope === 'mine' ? `/associate/duties/${id}` : `/manager/requirements/${id}`)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { interviewId } = useParams()
  const list = useQuery(scope === 'mine' ? 'dutyInterviews' : 'managerInterviews', {})
  const [now] = useState(() => new Date())
  const [show, setShow] = useState<Show>('upcoming')
  const [range, setRange] = useState<Range>('week')
  const [query, setQuery] = useState('')

  const all = useMemo(() => list.data ?? [], [list.data])

  // Two open interviews clash when they share the interviewer or the candidate and their times overlap.
  const clashes = useMemo(() => {
    const open = all.filter((i) => OPEN.includes(i.status))
    const map = new Map<string, string[]>()
    for (const a of open) {
      const aStart = parseServerDate(a.scheduledAt)
      const aEnd = endOf(a)
      for (const b of open) {
        if (a === b) continue
        const shared = a.interviewerId === b.interviewerId || a.employeeId === b.employeeId
        const overlap = aStart < endOf(b) && parseServerDate(b.scheduledAt) < aEnd
        if (shared && overlap) {
          map.set(a.interviewId, [...(map.get(a.interviewId) ?? []), `${b.employeeName ?? b.employeeId} at ${timeLabel(b.scheduledAt)}`])
        }
      }
    }
    return map
  }, [all])

  const [weekStart, weekEnd] = weekBounds(now)
  const fortnightEnd = new Date(now.getTime() + 14 * 86_400_000)
  const text = query.trim().toLowerCase()

  const inRange = (i: InterviewDTO) => {
    const at = parseServerDate(i.scheduledAt)
    if (range === 'week') return at >= weekStart && at < weekEnd
    if (range === 'fortnight') return at >= now && at < fortnightEnd
    return true
  }

  const matchesShow = (i: InterviewDTO) => {
    const past = parseServerDate(i.scheduledAt) < now
    const open = OPEN.includes(i.status)
    if (show === 'upcoming') return open && !past
    if (show === 'feedback') return open && past
    if (show === 'past') return past && !open && !DEAD.includes(i.status)
    return DEAD.includes(i.status)
  }

  const shown = all.filter(
    (i) =>
      matchesShow(i) &&
      inRange(i) &&
      (!text || [i.employeeName, i.requirementId, i.interviewId, i.interviewerName].some((v) => v?.toLowerCase().includes(text))),
  )

  const groups = useMemo(() => {
    const byDay = new Map<string, { label: string; items: InterviewDTO[] }>()
    for (const i of [...shown].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))) {
      const at = parseServerDate(i.scheduledAt)
      const key = `${at.getFullYear()}-${at.getMonth()}-${at.getDate()}`
      const label = sameDay(at, now) ? `Today · ${dayLabel(at)}` : dayLabel(at)
      const group = byDay.get(key) ?? { label, items: [] }
      group.items.push(i)
      byDay.set(key, group)
    }
    return [...byDay.values()]
  }, [shown, now])

  const openAll = all.filter((i) => OPEN.includes(i.status))
  const kpis = {
    today: openAll.filter((i) => sameDay(parseServerDate(i.scheduledAt), now)).length,
    week: openAll.filter((i) => {
      const at = parseServerDate(i.scheduledAt)
      return at >= weekStart && at < weekEnd
    }).length,
    waiting: openAll.filter((i) => i.status === 'SCHEDULED' && parseServerDate(i.scheduledAt) >= now).length,
    feedback: openAll.filter((i) => parseServerDate(i.scheduledAt) < now).length,
  }

  const selected = interviewId ?? shown[0]?.interviewId ?? null

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-ink-500 uppercase dark:text-slate-400">Hiring</p>
          <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">{scope === 'mine' ? 'Interviews to take' : 'Interviews'}</h1>
          <p className="mt-1 max-w-[62ch] text-sm text-ink-500 dark:text-slate-400">
            {scope === 'mine'
              ? 'Interviews you are the interviewer for. Give feedback after each one; the manager decides.'
              : 'Every interview across your requirements, in time order. Book them from a requirement; manage and give feedback here.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex w-64 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Candidate, requirement or ID"
              aria-label="Search interviews"
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-ink-500/60 dark:placeholder:text-slate-500"
            />
          </label>
          <RefreshButton onClick={list.refresh} loading={list.loading} />
        </div>
      </motion.header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Today" value={kpis.today} />
        <Kpi label="This week" value={kpis.week} />
        <Kpi label="Waiting for the candidate" value={kpis.waiting} />
        <Kpi label="Feedback due" value={kpis.feedback} tone={kpis.feedback > 0 ? 'warn' : undefined} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show">
          {(Object.keys(SHOW_LABEL) as Show[]).map((s) => (
            <Chip key={s} pressed={show === s} onClick={() => setShow(s)}>
              {SHOW_LABEL[s]}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Date range">
          {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
            <Chip key={r} pressed={range === r} onClick={() => setRange(r)}>
              {RANGE_LABEL[r]}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-label="Interview list" className="grid min-w-0 gap-2">
          {list.error && !list.data ? (
            <PanelError message={list.error} status={list.status} onRetry={list.refresh} />
          ) : !list.data ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className={`${TILE_SURFACE} px-6 py-12`}>
              <EmptyState icon={<CalendarClock className="h-5 w-5" />}>
                {all.length === 0 ? 'No interviews yet. Book one from a requirement once a candidate accepts.' : 'Nothing matches this view.'}
              </EmptyState>
            </div>
          ) : (
            groups.map((g) => (
              <div key={g.label} className="grid gap-2">
                <p className="mt-3 text-[11px] font-bold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-400">{g.label}</p>
                {g.items.map((i) => {
                  const clash = clashes.get(i.interviewId)
                  const current = i.interviewId === selected
                  return (
                    <button
                      key={i.interviewId}
                      type="button"
                      aria-current={current ? 'true' : undefined}
                      onClick={() => navigate(`${basePath}/${i.interviewId}`)}
                      className={`${TILE_SURFACE} grid w-full grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5 text-left transition-shadow ${
                        current ? 'ring-2 ring-brand-500' : 'hover:shadow-md'
                      }`}
                    >
                      <span className="text-[15px] font-bold text-ink-900 tabular-nums dark:text-white">
                        {timeLabel(i.scheduledAt)}
                        <small className="block text-[11px] font-semibold text-ink-500 dark:text-slate-400">{i.durationMinutes ?? 60} min</small>
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-900 dark:text-white">
                          {i.employeeName ?? i.employeeId}
                          {i.mode && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-ink-700 dark:bg-white/8 dark:text-slate-300">{humanize(i.mode)}</span>}
                        </span>
                        <span className="block truncate text-xs text-ink-500 dark:text-slate-400">
                          {[i.requirementId, i.roundNumber ? `Round ${i.roundNumber}` : null, i.interviewerName ? `with ${i.interviewerName}` : null].filter(Boolean).join(' · ')}
                        </span>
                        {clash && (
                          <span className="mt-1.5 inline-block rounded-full bg-amber-500/14 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                            Clashes with {clash[0]}
                          </span>
                        )}
                      </span>
                      <span className={`justify-self-end rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[i.status] ?? STATUS_TONE.DECLINED}`}>{humanize(i.status)}</span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </section>

        <aside className="lg:sticky lg:top-4" aria-label="Selected interview">
          {selected ? (
            <InterviewDetail
              key={selected}
              interviewId={selected}
              now={now}
              canCancel={scope === 'manager'}
              requirementPath={requirementPath}
              onChanged={() => {
                dispatch(invalidateQueries('managerInterviews'))
                dispatch(invalidateQueries('dutyInterviews'))
              }}
            />
          ) : (
            <div className={`${TILE_SURFACE} p-6`}>
              <EmptyState icon={<CalendarClock className="h-5 w-5" />}>Pick an interview to see its details.</EmptyState>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function InterviewDetail({
  interviewId,
  now,
  canCancel,
  requirementPath,
  onChanged,
}: {
  interviewId: string
  now: Date
  canCancel: boolean
  requirementPath: (id: string) => string
  onChanged: () => void
}) {
  const toast = useToast()
  const detail = useQuery('managerInterview', { interviewId })
  const [cancelling, setCancelling] = useState(false)
  const [reason, setReason] = useState('')
  const [rating, setRating] = useState(0)
  const [recommendation, setRecommendation] = useState<SubmitFeedbackRequest['recommendation'] | ''>('')
  const [comments, setComments] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const i = detail.data
  if (!i) {
    return (
      <div className={`${TILE_SURFACE} grid gap-3 p-6`}>
        {detail.error ? <PanelError message={detail.error} status={detail.status} onRetry={detail.refresh} /> : <Skeleton className="h-48 rounded-2xl" />}
      </div>
    )
  }

  const open = OPEN.includes(i.status)
  const past = parseServerDate(i.scheduledAt) < now
  const fb = i.feedback
  const feedbackDue = open && past && !fb

  async function run(action: () => Promise<unknown>, done: string) {
    setBusy(true)
    setError(null)
    try {
      await action()
      toast.success(done, i?.employeeName ?? '')
      detail.refresh()
      onChanged()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`${TILE_SURFACE} grid gap-5 p-6`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-400">
            {i.interviewId} · Round {i.roundNumber ?? 1}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-ink-900 dark:text-white">{i.employeeName ?? i.employeeId}</h2>
          <p className="text-xs text-ink-500 dark:text-slate-400">{i.employeeId}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[i.status] ?? STATUS_TONE.DECLINED}`}>{humanize(i.status)}</span>
      </div>

      <LinkEditor key={i.interviewId} interviewId={i.interviewId} current={i.locationOrLink ?? ''} open={open} onChanged={onChanged} />

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <Fact label="Requirement">
          {i.requirementId && (
            <Link to={requirementPath(i.requirementId)} className="font-semibold text-ink-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400">
              {i.requirementId}
            </Link>
          )}
        </Fact>
        <Fact label="When">{`${dayLabel(parseServerDate(i.scheduledAt))}, ${timeLabel(i.scheduledAt)} · ${i.durationMinutes ?? 60} min`}</Fact>
        <Fact label="Interviewer">{i.interviewerName ?? '—'}</Fact>
        <Fact label="Mode">{i.mode ? humanize(i.mode) : '—'}{i.locationOrLink ? ` · ${i.locationOrLink}` : ''}</Fact>
      </dl>

      {i.candidateResponseComment && (
        <p className="rounded-2xl bg-sky-500/8 px-3.5 py-2.5 text-xs text-ink-700 dark:text-slate-300">
          Candidate replied: “{i.candidateResponseComment}”
        </p>
      )}

      {canCancel && open && !past && (
        <div className="grid gap-2">
          {cancelling ? (
            <>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-ink-900 dark:text-white">Why is it cancelled?</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
                />
              </label>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setCancelling(false)} disabled={busy}>
                  Keep it
                </Button>
                <Button
                  variant="danger"
                  loading={busy}
                  onClick={() => {
                    if (!reason.trim()) {
                      setError('Say why, so the candidate knows.')
                      return
                    }
                    void run(() => interviewService.cancel(i.interviewId, reason.trim()), 'Interview cancelled')
                  }}
                >
                  Cancel interview
                </Button>
              </div>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setCancelling(true)}>
              Cancel interview
            </Button>
          )}
        </div>
      )}

      <section className="grid gap-3 rounded-2xl border border-dashed border-slate-200 p-4 dark:border-white/10" aria-label="Feedback">
        <div className="flex items-center justify-between">
          <b className="text-sm text-ink-900 dark:text-white">Feedback</b>
          {fb && <span className="text-xs text-ink-500 dark:text-slate-400">by {fb.givenByName ?? 'interviewer'}</span>}
        </div>
        {fb ? (
          <div className="grid gap-1.5 text-sm">
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={`h-4 w-4 ${n <= fb.rating ? 'fill-current' : 'opacity-30'}`} aria-hidden="true" />
              ))}
            </span>
            <span className="text-ink-700 dark:text-slate-300">Advice: {humanize(fb.recommendation)}</span>
            {fb.comments && <p className="text-ink-700 dark:text-slate-300">{fb.comments}</p>}
          </div>
        ) : feedbackDue ? (
          <>
            <fieldset className="grid gap-1.5">
              <legend className="mb-1 text-xs text-ink-500 dark:text-slate-400">Rating out of five</legend>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={rating === n}
                    onClick={() => setRating(n)}
                    className={`h-9 w-9 rounded-xl border text-sm font-bold transition-colors ${
                      rating === n ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 text-ink-700 dark:border-white/10 dark:text-slate-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="grid gap-1.5 text-sm">
              <span className="text-xs text-ink-500 dark:text-slate-400">Recommendation (advice only; you decide)</span>
              <select
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value as SubmitFeedbackRequest['recommendation'] | '')}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
              >
                <option value="">Choose</option>
                <option value="SELECT">Select for the next step</option>
                <option value="ON_HOLD">On hold</option>
                <option value="REJECT">Reject</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="text-xs text-ink-500 dark:text-slate-400">Notes (optional)</span>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={2}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
              />
            </label>
            <Button
              variant="primary"
              loading={busy}
              disabled={!rating || !recommendation}
              onClick={() =>
                void run(
                  () =>
                    interviewService.submitFeedback(i.interviewId, {
                      rating,
                      recommendation: recommendation as SubmitFeedbackRequest['recommendation'],
                      comments: comments.trim() || undefined,
                    }),
                  'Feedback saved',
                )
              }
            >
              Save feedback
            </Button>
          </>
        ) : (
          <p className="text-xs text-ink-500 dark:text-slate-400">Feedback opens after the interview starts.</p>
        )}
      </section>

      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  )
}

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
        pressed
          ? 'border-brand-500/30 bg-brand-500/12 text-brand-700 dark:text-brand-300'
          : 'border-slate-200 text-ink-500 hover:text-ink-900 dark:border-white/10 dark:text-slate-400 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: 'warn' }) {
  return (
    <div className={`${TILE_SURFACE} grid gap-1 px-4 py-3.5`}>
      <span className="text-xs text-ink-500 dark:text-slate-400">{label}</span>
      <b className={`text-2xl tabular-nums ${tone === 'warn' ? 'text-amber-600 dark:text-amber-400' : 'text-ink-900 dark:text-white'}`}>{value}</b>
    </div>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold tracking-[0.1em] text-ink-500 uppercase dark:text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink-900 dark:text-white">{children}</dd>
    </div>
  )
}

function timeLabel(value: string): string {
  return parseServerDate(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
}

function dayLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

/** The meeting link the candidate joins with. The interviewer or the coordinator sets it; the candidate is told when it changes. */
function LinkEditor({ interviewId, current, open, onChanged }: { interviewId: string; current: string; open: boolean; onChanged: () => void }) {
  const toast = useToast()
  const [value, setValue] = useState(current)
  const [busy, setBusy] = useState(false)
  if (!open) {
    return current ? <p className="text-sm text-ink-700 dark:text-slate-300">Link: <span className="break-all">{current}</span></p> : null
  }

  async function save() {
    setBusy(true)
    try {
      await interviewService.setLink(interviewId, value)
      toast.success(value.trim() ? 'Link shared with the candidate' : 'Link removed')
      onChanged()
    } catch (err) {
      toast.error('Could not save the link', getApiErrorMessage(err, 'Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-2 rounded-2xl border border-dashed border-slate-200 p-3.5 dark:border-white/10">
      <label className="grid gap-1 text-xs font-semibold text-ink-500 dark:text-slate-400">
        Meeting link
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://meet.example.com/..."
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
      </label>
      <div className="flex justify-end">
        <Button variant="secondary" loading={busy} disabled={value === current} onClick={() => void save()}>
          Share link
        </Button>
      </div>
    </div>
  )
}
