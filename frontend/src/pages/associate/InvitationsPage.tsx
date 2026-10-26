import { Mail } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../components/dashboard/Panel'
import { Button } from '../../components/ui/form'
import { Drawer, Modal } from '../../components/ui/Overlay'
import RefreshButton from '../../components/ui/RefreshButton'
import { useQuery } from '../../hooks/useQuery'
import { useToast } from '../../hooks/useToast'
import { associateOpportunityService, type OpportunityDetailsDTO, type OpportunityHistoryDTO } from '../../services/associate/opportunity.service'
import { getApiErrorMessage } from '../../services/httpClient'
import type { InvitationDTO } from '../../services/manager/invitation.service'
import { useAppDispatch } from '../../store'
import { invalidateQueries } from '../../store/queriesSlice'
import { humanize, timeAgo } from '../../utils/format'
import { formatDay } from '../admin/employees/employeeUi'
import PageHeader from './PageHeader'
import { Card, Due, Row, Tag } from './ui'

const OPEN = ['SENT', 'VIEWED']

type Answer =
  | { kind: 'invite'; invitation: InvitationDTO; response: 'ACCEPT' | 'REJECT' | 'JOIN' }
  | { kind: 'confirm'; opportunity: OpportunityHistoryDTO; decision: 'ACCEPT' | 'DECLINE' }

/** Invitations from managers to answer, and selections to confirm. Answering here moves the candidacy on. */
export default function InvitationsPage() {
  const invitations = useQuery('associateInvitations', {})
  const opportunities = useQuery('associateOpportunities', {})
  const [opened, setOpened] = useState<string | null>(null)
  const [answer, setAnswer] = useState<Answer | null>(null)

  const all = invitations.data ?? []
  const open = all.filter((i) => OPEN.includes(i.status))
  const answered = all.filter((i) => !OPEN.includes(i.status))
  const toConfirm = (opportunities.data ?? []).filter((o) => o.status === 'SELECTED' && !o.confirmed)

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <PageHeader
        eyebrow="Find work"
        title="Invitations"
        sub="Managers invite you to their requirements. Accept to move on to interviews, or decline with a short note."
        actions={
          <RefreshButton
            onClick={() => {
              invitations.refresh()
              opportunities.refresh()
            }}
            loading={invitations.loading}
          />
        }
      />

      {toConfirm.length > 0 && (
        <Card title="Selected for you · confirm" note={`${toConfirm.length}`}>
          {toConfirm.map((o) => (
            <Row
              key={o.applicationId}
              title={`${o.projectName ?? ''} · ${o.positionTitle ?? o.requirementId}`}
              detail="The manager selected you. Confirm so they can request your allocation."
              aside={
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setAnswer({ kind: 'confirm', opportunity: o, decision: 'DECLINE' })}>
                    Decline
                  </Button>
                  <Button variant="primary" onClick={() => setAnswer({ kind: 'confirm', opportunity: o, decision: 'ACCEPT' })}>
                    Confirm
                  </Button>
                </div>
              }
            />
          ))}
        </Card>
      )}

      {invitations.error && !invitations.data ? (
        <div className={`${TILE_SURFACE} p-5`}>
          <PanelError message={invitations.error} status={invitations.status} onRetry={invitations.refresh} />
        </div>
      ) : !invitations.data ? (
        <Skeleton className="h-48 rounded-3xl" />
      ) : all.length === 0 ? (
        <div className={`${TILE_SURFACE} px-6 py-12`}>
          <EmptyState icon={<Mail className="h-5 w-5" />}>No invitations yet. Managers invite you after shortlisting you.</EmptyState>
        </div>
      ) : (
        <>
          <Card title="Waiting for your answer" note={`${open.length}`}>
            {open.length === 0 ? (
              <p className="text-sm text-ink-500 dark:text-slate-400">You have answered every invitation.</p>
            ) : (
              open.map((i) => (
                <Row
                  key={i.invitationId}
                  title={
                    <button type="button" onClick={() => setOpened(i.invitationId)} className="text-left hover:text-brand-600 dark:hover:text-brand-400">
                      {i.requirementId} · from {i.invitedByName ?? 'a manager'}
                    </button>
                  }
                  detail={[i.requiresInterview === false ? 'Direct joining, no interview' : 'Interview first', i.invitedAt ? `sent ${timeAgo(i.invitedAt)}` : null, i.message].filter(Boolean).join(' · ')}
                  aside={
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {i.responseDeadline && <Due>Reply by {formatDay(i.responseDeadline)}</Due>}
                      <Button variant="secondary" onClick={() => setAnswer({ kind: 'invite', invitation: i, response: 'REJECT' })}>
                        Decline
                      </Button>
                      <Button variant="primary" onClick={() => setAnswer({ kind: 'invite', invitation: i, response: i.requiresInterview === false ? 'JOIN' : 'ACCEPT' })}>
                        {i.requiresInterview === false ? 'Join' : 'Accept'}
                      </Button>
                    </div>
                  }
                />
              ))
            )}
          </Card>

          {answered.length > 0 && (
            <Card title="Answered" note={`${answered.length}`}>
              {answered.map((i) => (
                <Row
                  key={i.invitationId}
                  title={
                    <button type="button" onClick={() => setOpened(i.invitationId)} className="text-left hover:text-brand-600 dark:hover:text-brand-400">
                      {i.requirementId} · from {i.invitedByName ?? 'a manager'}
                    </button>
                  }
                  detail={[i.respondedAt ? `answered ${timeAgo(i.respondedAt)}` : null, i.responseComment].filter(Boolean).join(' · ')}
                  aside={<Tag tone={i.status === 'ACCEPTED' ? 'ok' : 'muted'}>{humanize(i.status)}</Tag>}
                />
              ))}
            </Card>
          )}
        </>
      )}

      {opened && <InvitationDetails invitationId={opened} onClose={() => setOpened(null)} />}
      {answer && <AnswerDialog answer={answer} onClose={() => setAnswer(null)} />}
    </div>
  )
}

/** Opening an invitation marks it viewed and shows the project, the role and who is on the team. */
function InvitationDetails({ invitationId, onClose }: { invitationId: string; onClose: () => void }) {
  const [data, setData] = useState<OpportunityDetailsDTO | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    associateOpportunityService
      .openInvitation(invitationId)
      .then((d) => live && setData(d))
      .catch((err) => live && setError(getApiErrorMessage(err, 'Could not open the invitation.')))
    return () => {
      live = false
    }
  }, [invitationId])

  return (
    <Drawer open onClose={onClose} title={data ? `${data.projectName ?? ''} · ${data.positionTitle ?? ''}` : 'Invitation'} subtitle={data?.requirementId}>
      {error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
      ) : !data ? (
        <Skeleton className="h-48 rounded-2xl" />
      ) : (
        <div className="grid gap-5 text-sm">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Fact label="Client">{data.clientName}</Fact>
            <Fact label="Manager">{data.managerName}</Fact>
            <Fact label="Experience">{data.minExperience != null || data.maxExperience != null ? `${data.minExperience ?? 0} to ${data.maxExperience ?? '—'} years` : undefined}</Fact>
            <Fact label="Priority">{data.priority ? humanize(data.priority) : undefined}</Fact>
            <Fact label="Starts">{data.allocationStartDate ? formatDay(data.allocationStartDate) : undefined}</Fact>
            <Fact label="Ends">{data.allocationEndDate ? formatDay(data.allocationEndDate) : 'Open ended'}</Fact>
            <Fact label="Skills">{data.requiredSkills}</Fact>
            <Fact label="Certifications">{data.requiredCertifications}</Fact>
          </dl>
          {data.requirementDescription && <p className="text-ink-700 dark:text-slate-300">{data.requirementDescription}</p>}
          {data.invitation.message && <p className="rounded-2xl bg-sky-500/8 px-3.5 py-2.5 text-ink-700 dark:text-slate-300">“{data.invitation.message}”</p>}
          {data.team && data.team.length > 0 && (
            <div className="grid gap-2">
              <b className="text-[11px] tracking-widest text-ink-500 uppercase dark:text-slate-400">Team</b>
              {data.team.map((m) => (
                <Row key={m.employeeId} title={m.name ?? m.employeeId} detail={[m.designation, m.role ? humanize(m.role) : null].filter(Boolean).join(' · ')} />
              ))}
            </div>
          )}
        </div>
      )}
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

function AnswerDialog({ answer, onClose }: { answer: Answer; onClose: () => void }) {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const positive = answer.kind === 'invite' ? answer.response !== 'REJECT' : answer.decision === 'ACCEPT'
  const title =
    answer.kind === 'invite'
      ? positive ? `Accept the invitation for ${answer.invitation.requirementId}?` : `Decline the invitation for ${answer.invitation.requirementId}?`
      : positive ? `Confirm ${answer.opportunity.projectName ?? ''}?` : `Decline ${answer.opportunity.projectName ?? ''}?`

  async function send() {
    if (!positive && !comment.trim()) {
      setError('Add a short reason so the manager knows.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      if (answer.kind === 'invite') {
        await associateOpportunityService.respond(answer.invitation.invitationId, { response: answer.response, comment: comment.trim() || undefined })
      } else {
        await associateOpportunityService.confirm(answer.opportunity.applicationId, { decision: answer.decision, comment: comment.trim() || undefined })
      }
      toast.success(positive ? 'Sent' : 'Declined', 'The manager has been told.')
      dispatch(invalidateQueries('associateInvitations'))
      dispatch(invalidateQueries('associateOpportunities'))
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
      title={title}
      subtitle={positive ? 'The manager is told straight away.' : 'A short reason helps the manager.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={positive ? 'primary' : 'danger'} onClick={() => void send()} loading={busy}>
            {positive ? 'Send' : 'Decline'}
          </Button>
        </>
      }
    >
      <label className="grid gap-1.5 text-sm">
        <span className="font-semibold text-ink-900 dark:text-white">{positive ? 'Note (optional)' : 'Reason'}</span>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" />
      </label>
      {error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </Modal>
  )
}
