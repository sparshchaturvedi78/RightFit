import { CalendarClock } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../components/dashboard/Panel'
import { Button } from '../../components/ui/form'
import { Drawer, Modal } from '../../components/ui/Overlay'
import RefreshButton from '../../components/ui/RefreshButton'
import { useQuery } from '../../hooks/useQuery'
import { useToast } from '../../hooks/useToast'
import { getApiErrorMessage } from '../../services/httpClient'
import { interviewService, type InterviewDTO } from '../../services/interview.service'
import { useAppDispatch } from '../../store'
import { invalidateQueries } from '../../store/queriesSlice'
import { humanize, parseServerDate } from '../../utils/format'
import PageHeader from './PageHeader'
import { Card, Due, Row, Tag } from './ui'

function when(value: string): string {
  return parseServerDate(value).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/** The associate's own interviews as a candidate: accept or decline new ones, and see what is booked. */
export default function AssociateInterviewsPage() {
  const list = useQuery('associateInterviews', {})
  const [now] = useState(() => new Date())
  const [answering, setAnswering] = useState<{ interview: InterviewDTO; response: 'ACCEPT' | 'DECLINE' } | null>(null)
  const [opened, setOpened] = useState<InterviewDTO | null>(null)

  // The row title opens the details drawer, so every interview can be read in full.
  const all = list.data ?? []

  // A later round says why it exists: an earlier round for the same role was declined or cancelled.
  const roundOf = (i: InterviewDTO) => {
    const round = i.roundNumber ?? 1
    const earlier = all
      .filter((x) => x.requirementId === i.requirementId && (x.roundNumber ?? 1) < round && ['DECLINED', 'CANCELLED'].includes(x.status))
      .sort((a, b) => (b.roundNumber ?? 1) - (a.roundNumber ?? 1))[0]
    return earlier ? `round ${round} · round ${earlier.roundNumber ?? 1} ${earlier.status === 'DECLINED' ? 'was declined' : 'was cancelled'}` : `round ${round}`
  }

  const titleOf = (i: InterviewDTO) => (
    <button type="button" onClick={() => setOpened(i)} className="text-left hover:text-brand-600 dark:hover:text-brand-400">
      {i.requirementId} · {roundOf(i)}
    </button>
  )

  const future = (i: InterviewDTO) => parseServerDate(i.scheduledAt) >= now
  const toAnswer = all.filter((i) => i.status === 'SCHEDULED' && future(i))
  const booked = all.filter((i) => i.status === 'ACCEPTED' && future(i))
  const past = all.filter((i) => !toAnswer.includes(i) && !booked.includes(i))

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <PageHeader
        eyebrow="Find work"
        title="Interviews"
        sub="Interviews managers booked with you. Times are checked so you never have two at once."
        actions={<RefreshButton onClick={list.refresh} loading={list.loading} />}
      />

      {list.error && !list.data ? (
        <div className={`${TILE_SURFACE} p-5`}>
          <PanelError message={list.error} status={list.status} onRetry={list.refresh} />
        </div>
      ) : !list.data ? (
        <Skeleton className="h-48 rounded-3xl" />
      ) : all.length === 0 ? (
        <div className={`${TILE_SURFACE} px-6 py-12`}>
          <EmptyState icon={<CalendarClock className="h-5 w-5" />}>No interviews yet. They are booked after you accept an invitation.</EmptyState>
        </div>
      ) : (
        <>
          <Card title="Waiting for your answer" note={`${toAnswer.length}`}>
            {toAnswer.length === 0 ? (
              <p className="text-sm text-ink-500 dark:text-slate-400">Nothing to answer.</p>
            ) : (
              toAnswer.map((i) => (
                <Row
                  key={i.interviewId}
                  title={titleOf(i)}
                  detail={[when(i.scheduledAt),`${i.durationMinutes ?? 60} min`, i.interviewerName ? `with ${i.interviewerName}` : null, i.mode ? humanize(i.mode) : null].filter(Boolean).join(' · ')}
                  aside={
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => setAnswering({ interview: i, response: 'DECLINE' })}>
                        Decline
                      </Button>
                      <Button variant="primary" onClick={() => setAnswering({ interview: i, response: 'ACCEPT' })}>
                        Accept
                      </Button>
                    </div>
                  }
                />
              ))
            )}
          </Card>

          <Card title="Booked" note={`${booked.length}`}>
            {booked.length === 0 ? (
              <p className="text-sm text-ink-500 dark:text-slate-400">No interviews booked.</p>
            ) : (
              booked.map((i) => (
                <Row
                  key={i.interviewId}
                  title={titleOf(i)}
                  detail={[i.interviewerName ? `with ${i.interviewerName}` : null, i.mode ? humanize(i.mode) : null, i.locationOrLink].filter(Boolean).join(' · ')}
                  aside={<Due>{when(i.scheduledAt)}</Due>}
                />
              ))
            )}
          </Card>

          {past.length > 0 && (
            <Card title="Earlier" note={`${past.length}`}>
              {past.map((i) => (
                <Row key={i.interviewId} title={titleOf(i)} detail={when(i.scheduledAt)} aside={<Tag>{humanize(i.status)}</Tag>} />
              ))}
            </Card>
          )}
        </>
      )}

      {opened && <InterviewDetails interview={opened} onClose={() => setOpened(null)} />}
      {answering && <AnswerDialog {...answering} onClose={() => setAnswering(null)} />}
    </div>
  )
}

/** Everything about one interview: when, who with, where, and its state. */
function InterviewDetails({ interview: i, onClose }: { interview: InterviewDTO; onClose: () => void }) {
  const link = i.locationOrLink ?? ''
  return (
    <Drawer open onClose={onClose} title={`${i.requirementId} · round ${i.roundNumber ?? 1}`} subtitle={humanize(i.status)}>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
        <Fact label="When">{when(i.scheduledAt)}</Fact>
        <Fact label="Length">{i.durationMinutes ? `${i.durationMinutes} min` : undefined}</Fact>
        <Fact label="Mode">{i.mode ? humanize(i.mode) : undefined}</Fact>
        <Fact label="Interviewer">{i.interviewerName}</Fact>
        <div className="col-span-2 min-w-0">
          <dt className="text-[11px] font-bold tracking-widest text-ink-500 uppercase dark:text-slate-500">
            {i.mode === 'IN_PERSON' ? 'Room' : 'Meeting link'}
          </dt>
          <dd className="mt-0.5 break-all text-ink-900 dark:text-white">
            {!link ? (
              <span className="text-ink-500 dark:text-slate-400">Not shared yet</span>
            ) : /^https?:\/\//.test(link) ? (
              <a href={link} target="_blank" rel="noreferrer" className="text-brand-600 underline underline-offset-2 dark:text-brand-400">
                {link}
              </a>
            ) : (
              link
            )}
          </dd>
        </div>
      </dl>
    </Drawer>
  )
}

function Fact({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold tracking-widest text-ink-500 uppercase dark:text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-ink-900 dark:text-white">{children || '—'}</dd>
    </div>
  )
}

function AnswerDialog({ interview, response, onClose }: { interview: InterviewDTO; response: 'ACCEPT' | 'DECLINE'; onClose: () => void }) {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const accept = response === 'ACCEPT'

  async function send() {
    if (!accept && !comment.trim()) {
      setError('Add a short reason so the manager can rebook.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await interviewService.associateRespond(interview.interviewId, { response, comment: comment.trim() || undefined })
      toast.success(accept ? 'Interview accepted' : 'Interview declined', when(interview.scheduledAt))
      dispatch(invalidateQueries('associateInterviews'))
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not send your answer. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={busy ? () => undefined : onClose}
      title={accept ? 'Accept this interview?' : 'Decline this interview?'}
      subtitle={`${interview.requirementId} · ${when(interview.scheduledAt)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={accept ? 'primary' : 'danger'} onClick={() => void send()} loading={busy}>
            {accept ? 'Accept' : 'Decline'}
          </Button>
        </>
      }
    >
      <label className="grid gap-1.5 text-sm">
        <span className="font-semibold text-ink-900 dark:text-white">{accept ? 'Note (optional)' : 'Reason'}</span>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
      </label>
      {error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </Modal>
  )
}
