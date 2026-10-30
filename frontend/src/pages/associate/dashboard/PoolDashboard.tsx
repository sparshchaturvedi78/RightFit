import { Activity, ArrowRight, CalendarClock, Clock, GraduationCap, Mail, RefreshCw, Sparkles, Target, TriangleAlert, UserRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Skeleton } from '../../../components/dashboard/Panel'
import { useQuery } from '../../../hooks/useQuery'
import { useToast } from '../../../hooks/useToast'
import { associateWorkService } from '../../../services/associate/work.service'
import { getApiErrorMessage } from '../../../services/httpClient'
import { useAppDispatch } from '../../../store'
import { invalidateQueries } from '../../../store/queriesSlice'
import { humanize, parseServerDate } from '../../../utils/format'
import { useAssociateState } from '../associateState'
import { avatarOf, clock, dayWord, daysBetween, ENDED, fitOf, greeting, initials, longToday, sameDay, shortDay, skillList, stepOf, STEPS, timeOf, workWeek } from './model'
import RecentActivity from './RecentActivity'
import { Attention, Avatar, Bar, Chip, Chips, Day, Empty, Ev, Free, Ghost, Hero, HeroBox, HeroTop, Kpi, Li, Ring, Steps, Tag, TILE, TileHead, When, type Tone } from './ui'

const OPEN_INVITES = ['SENT', 'VIEWED']
const LIVE_TRAINING = ['ASSIGNED', 'IN_PROGRESS']
const FIT_TONES: Tone[] = ['brand', 'sky', 'amber', 'violet']

/** The associate in the resource pool: what needs an answer, how they fit the open work, and what they are learning. */
export default function PoolDashboard() {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const { dashboard } = useAssociateState()
  const profile = useQuery('associateProfile', {})
  const invitations = useQuery('associateInvitations', {})
  const opportunities = useQuery('associateOpportunities', {})
  const interviews = useQuery('associateInterviews', {})
  const requirements = useQuery('associateRequirements', {})
  const assignments = useQuery('associateTrainingAssignments', {})
  const trainings = useQuery('associateTrainings', {})
  const skills = useQuery('associateSkills', {})
  const certifications = useQuery('associateCertifications', {})
  const preferences = useQuery('associatePreferences', {})
  const [now] = useState(() => new Date())
  const [busy, setBusy] = useState<string | null>(null)

  const d = dashboard.data
  const openInvites = (invitations.data ?? []).filter((i) => OPEN_INVITES.includes(i.status))
  const toConfirm = (opportunities.data ?? []).filter((o) => o.status === 'SELECTED' && !o.confirmed)
  const booked = (interviews.data ?? [])
    .filter((i) => ['SCHEDULED', 'ACCEPTED'].includes(i.status) && parseServerDate(i.scheduledAt) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  const toAccept = booked.filter((i) => i.status === 'SCHEDULED')
  const today = booked.filter((i) => sameDay(parseServerDate(i.scheduledAt), now))
  const training = (assignments.data ?? []).find((a) => LIVE_TRAINING.includes(a.assignmentStatus))
  const firstDeadline = openInvites.map((i) => i.responseDeadline).filter(Boolean).sort()[0]

  // How the associate's skills fit each open requirement.
  const mine = useMemo(() => new Set((skills.data ?? []).map((s) => s.skillName.toLowerCase())), [skills.data])
  const fits = useMemo(
    () =>
      (requirements.data ?? [])
        .map((r) => ({ r, skills: skillList(r.requiredSkills), fit: fitOf(skillList(r.requiredSkills), mine) }))
        .filter((x) => x.fit !== null)
        .sort((a, b) => (b.fit ?? 0) - (a.fit ?? 0)),
    [requirements.data, mine],
  )
  const matching = fits.filter((x) => (x.fit ?? 0) >= 50)

  // Profile completeness: a phone number, three skills, a certification and work preferences.
  const prefs = preferences.data
  const skillCount = skills.data?.length ?? 0
  const checks = [
    { done: Boolean(profile.data?.phone), missing: 'a phone number' },
    { done: skillCount >= 3, missing: `${3 - skillCount} more skill${3 - skillCount === 1 ? '' : 's'}` },
    { done: (certifications.data?.length ?? 0) >= 1, missing: 'a certification' },
    {
      done: Boolean(prefs && (prefs.preferredTechnology || prefs.preferredLocation || prefs.preferredWorkMode || prefs.preferredDomain)),
      missing: 'work preferences',
    },
  ]
  const profilePct = Math.round((checks.filter((c) => c.done).length / checks.length) * 100)
  const profileMissing = checks.filter((c) => !c.done).map((c) => c.missing)
  const poolDays = d?.inPoolSince ? daysBetween(parseServerDate(d.inPoolSince), now) : null

  // The selection in progress: the newest candidacy that has not ended.
  const active = (opportunities.data ?? []).filter((o) => !ENDED.includes(o.status) && stepOf(o.status) >= 0).sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))[0]
  const activeReq = active ? (requirements.data ?? []).find((r) => r.requirementId === active.requirementId) : undefined
  const step = active ? stepOf(active.status) : -1

  // The week strip: interviews, reply-by dates and training end dates, Monday to Friday.
  const week = workWeek(now).map((date) => {
    const events: { title: string; sub: string; amber?: boolean; to?: string }[] = []
    booked
      .filter((i) => sameDay(parseServerDate(i.scheduledAt), date))
      .forEach((i) => events.push({ title: `${clock(i.scheduledAt)} · Interview`, sub: `${i.requirementId ?? ''} · with ${(i.interviewerName ?? '').split(' ')[0]}`, to: '/associate/interviews' }))
    openInvites
      .filter((i) => i.responseDeadline && sameDay(parseServerDate(i.responseDeadline), date))
      .forEach((i) => events.push({ title: 'Reply by', sub: `Invitation · ${i.requirementId}`, amber: true, to: '/associate/invitations' }))
    if (training?.expectedEndDate && sameDay(parseServerDate(training.expectedEndDate), date)) events.push({ title: 'Training ends', sub: training.programName, to: '/associate/training' })
    return { date, events }
  })
  const weekCount = week.reduce((n, d2) => n + d2.events.length, 0)

  const waiting = openInvites.length + toConfirm.length + toAccept.length
  const trainingPct = training?.startDate && training.expectedEndDate
    ? Math.round(Math.min(1, Math.max(0, (now.getTime() - parseServerDate(training.startDate).getTime()) / Math.max(1, parseServerDate(training.expectedEndDate).getTime() - parseServerDate(training.startDate).getTime()))) * 100)
    : 0
  const openPrograms = (trainings.data ?? []).filter((t) => !t.myStatus || t.myStatus === 'REQUESTED').slice(0, 2)

  function refreshAll() {
    ;['associateDashboard', 'associateProfile', 'associateInvitations', 'associateOpportunities', 'associateInterviews', 'associateRequirements', 'associateTrainingAssignments', 'associateTrainings', 'associateSkills', 'latestNotifications'].forEach(
      (n) => dispatch(invalidateQueries(n as Parameters<typeof invalidateQueries>[0])),
    )
  }

  async function apply(requirementId: string) {
    setBusy(requirementId)
    try {
      await associateWorkService.apply(requirementId)
      toast.success('Applied', `${requirementId} · the manager has been told`)
      dispatch(invalidateQueries('associateRequirements'))
      dispatch(invalidateQueries('associateOpportunities'))
    } catch (err) {
      toast.error('Could not apply', getApiErrorMessage(err, 'Try again.'))
    } finally {
      setBusy(null)
    }
  }

  async function showInterest(programId: string) {
    setBusy(programId)
    try {
      await associateWorkService.requestTraining(programId)
      toast.success('Interest sent', 'Your RMG will decide')
      dispatch(invalidateQueries('associateTrainings'))
      dispatch(invalidateQueries('associateTrainingAssignments'))
    } catch (err) {
      toast.error('Could not send', getApiErrorMessage(err, 'Try again.'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-5">
      {/* hero + waiting on you */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Hero>
          <HeroTop
            eyebrow={longToday(now)}
            title={`${greeting(now)}, ${profile.data?.firstName ?? ''}`.trim()}
            lead={
              <>
                You are in the resource pool. <strong>{openInvites.length} invitation{openInvites.length === 1 ? '' : 's'}</strong> and{' '}
                <strong>{today.length} interview{today.length === 1 ? '' : 's'}</strong> need you today, and <strong>{matching.length} open requirement{matching.length === 1 ? '' : 's'}</strong>{' '}
                {matching.length === 1 ? 'matches' : 'match'} your skills.
              </>
            }
            actions={
              <>
                <Ghost onClick={refreshAll}>
                  <RefreshCw className={`h-3.5 w-3.5 ${dashboard.loading ? "animate-spin" : ""}`} />
                  Refresh
                </Ghost>
                <Ghost solid to={openInvites.length > 0 ? '/associate/invitations' : '/associate/projects'}>
                  {openInvites.length > 0 ? 'Open invitation' : 'Find work'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Ghost>
              </>
            }
          />
          <Chips>
            {firstDeadline && (
              <Chip icon={TriangleAlert} warn>
                Reply by {parseServerDate(firstDeadline).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
              </Chip>
            )}
            <Link to="/associate/profile" title={profileMissing.length ? `Still to add: ${profileMissing.join(', ')}` : 'Profile complete'} className="inline-flex">
              <Chip icon={UserRound}>Profile {profilePct}% complete</Chip>
            </Link>
            {poolDays !== null && <Chip icon={Clock}>In the pool {poolDays} day{poolDays === 1 ? '' : 's'}</Chip>}
          </Chips>
          <HeroBox title="Your week · interviews and deadlines" note={`${weekCount} thing${weekCount === 1 ? '' : 's'} this week`}>
            <div className="grid grid-cols-5 gap-2">
              {week.map(({ date, events }) => (
                <Day key={date.toISOString()} label={sameDay(date, now) ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short' })} side={String(date.getDate())} today={sameDay(date, now)}>
                  {events.length === 0 ? <Free /> : events.slice(0, 2).map((e, i) => <Ev key={i} title={e.title} sub={e.sub} amber={e.amber} to={e.to} />)}
                </Day>
              ))}
            </div>
          </HeroBox>
        </Hero>

        <Attention
          icon={TriangleAlert}
          title="Waiting on you"
          sub="Invitations, selections and interviews"
          count={waiting}
          headline={waiting > 0 ? 'Action needed' : 'All caught up'}
          detail={waiting > 0 ? `${waiting} thing${waiting === 1 ? '' : 's'} to answer` : 'Nothing to answer'}
          rows={[
            { label: `Invitation to answer${openInvites[0] ? ` · ${openInvites[0].requirementId}` : ''}`, count: openInvites.length, urgent: openInvites.length > 0, to: '/associate/invitations' },
            { label: `Selection to confirm${toConfirm[0] ? ` · ${toConfirm[0].projectName ?? toConfirm[0].requirementId}` : ''}`, count: toConfirm.length, urgent: toConfirm.length > 0, to: '/associate/invitations' },
            {
              label: `Interview to accept${toAccept[0] ? ` · ${dayWord(parseServerDate(toAccept[0].scheduledAt), now)} ${clock(toAccept[0].scheduledAt)}` : ''}`,
              count: toAccept.length,
              urgent: toAccept.length > 0,
              to: '/associate/interviews',
            },
            { label: 'Unread notifications', count: d?.unreadNotifications ?? 0, urgent: false },
          ]}
        />
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
        <Kpi
          label="Interviews today"
          icon={CalendarClock}
          tone="brand"
          value={today.length}
          to="/associate/interviews"
          caption={today[0] ? `${timeOf(today[0].scheduledAt)} · ${humanize(today[0].mode ?? 'ONLINE').toLowerCase()}` : 'nothing booked today'}
          progress={today.length > 0 ? 100 : 0}
        />
        <Kpi
          label="Invitations"
          icon={Mail}
          tone="amber"
          value={openInvites.length}
          to="/associate/invitations"
          caption={firstDeadline ? `reply by ${parseServerDate(firstDeadline).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}` : 'none waiting'}
          progress={openInvites.length > 0 ? 55 : 0}
        />
        <Kpi
          label="Requirements for you"
          icon={Target}
          tone="sky"
          value={matching.length}
          to="/associate/projects"
          caption={`of ${requirements.data?.length ?? 0} open match your skills`}
          progress={requirements.data?.length ? (matching.length / requirements.data.length) * 100 : 0}
        />
        <Kpi
          label="Training"
          icon={GraduationCap}
          tone="violet"
          text={training ? `${trainingPct}%` : '0'}
          to="/associate/training"
          caption={training ? `${training.programName} · ends ${training.expectedEndDate ? dayWord(parseServerDate(training.expectedEndDate), now) : '—'}` : 'no training running'}
          progress={trainingPct}
        />
      </div>

      {/* journey · skill match · interviews */}
      <div className="grid gap-5 lg:grid-cols-3">
        <section className={TILE} aria-label="Selection journey">
          <TileHead icon={Activity} title="Selection journey" sub={active ? `${active.requirementId} · ${active.positionTitle ?? ''}` : 'Where your selection stands'} />
          {!opportunities.data ? (
            <Skeleton className="h-32 rounded-2xl" />
          ) : !active ? (
            <Empty>You are not in a selection right now. Apply to an open requirement to start one.</Empty>
          ) : (
            <>
              <Steps steps={STEPS} current={step} notes={STEPS.map((_, i) => (i < step ? 'Done' : i === step ? shortDay(active.updatedAt) : 'Next'))} />
              <div className="mt-4.5">
                <Li
                  lead={<Avatar name={initials(activeReq?.managerName ?? active.projectName)} grad={avatarOf(3)} />}
                  title={active.projectName ?? active.requirementId}
                  sub={activeReq?.managerName ? `Manager · ${activeReq.managerName}` : humanize(active.status)}
                  right={<Tag tone="brand">On track</Tag>}
                />
              </div>
            </>
          )}
        </section>

        <section className={TILE} aria-label="Skill match">
          <TileHead icon={Target} title="Skill match" sub="How you fit the open requirements" />
          {!requirements.data || !skills.data ? (
            <Skeleton className="h-32 rounded-2xl" />
          ) : fits.length === 0 ? (
            <Empty>Add skills to your profile to see how you fit the open requirements.</Empty>
          ) : (
            <div className="grid gap-3.5">
              {fits.slice(0, 4).map((x, i) => (
                <div key={x.r.requirementId}>
                  <div className="mb-1.5 flex justify-between gap-2 text-[13px]">
                    <b className="truncate font-bold text-ink-900 dark:text-white">
                      {x.r.requirementId} · {x.skills.slice(0, 2).join(', ')}
                    </b>
                    <span className="shrink-0 text-ink-500 dark:text-slate-400">{x.fit}%</span>
                  </div>
                  <Bar value={x.fit ?? 0} tone={FIT_TONES[i % FIT_TONES.length]} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={TILE} aria-label="Upcoming interviews">
          <TileHead icon={CalendarClock} title="Upcoming interviews" sub="Booked with you" />
          {!interviews.data ? (
            <Skeleton className="h-32 rounded-2xl" />
          ) : booked.length === 0 ? (
            <Empty>No interviews booked. They come after you accept an invitation.</Empty>
          ) : (
            <div className="grid gap-2">
              {booked.slice(0, 3).map((i, k) => {
                const at = parseServerDate(i.scheduledAt)
                return (
                  <Li
                    key={i.interviewId}
                    lead={<Avatar name={initials(i.interviewerName)} grad={avatarOf(k + 3)} />}
                    title={`${i.requirementId ?? ''} · Round ${i.roundNumber ?? 1}`}
                    sub={`${i.interviewerName ?? ''} · ${humanize(i.mode ?? 'ONLINE')}`}
                    right={<When time={timeOf(i.scheduledAt)} day={dayWord(at, now)} today={sameDay(at, now)} />}
                  />
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* requirements matched to the associate */}
      <section className={TILE} aria-label="Matched for you">
        <TileHead icon={Sparkles} title="Matched for you" sub="Open requirements that fit your skills" more={{ to: '/associate/projects', label: 'See all projects' }} />
        {!requirements.data || !skills.data ? (
          <Skeleton className="h-36 rounded-2xl" />
        ) : fits.length === 0 ? (
          <Empty>No open requirement matches your skills yet.</Empty>
        ) : (
          <div className="grid gap-3.5 md:grid-cols-3">
            {fits.slice(0, 3).map((x, i) => (
              <article key={x.r.requirementId} className="grid gap-2.5 rounded-[18px] border border-slate-200/80 bg-slate-50 p-3.5 dark:border-white/7 dark:bg-white/5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <b className="block truncate text-sm font-bold text-ink-900 dark:text-white">{x.r.positionTitle}</b>
                    <small className="block truncate text-xs text-ink-500 dark:text-slate-400">
                      {x.r.projectName} · {x.r.requirementId}
                    </small>
                  </div>
                  <Ring value={x.fit ?? 0} tone={FIT_TONES[i]} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {x.skills.slice(0, 4).map((s) => (
                    <Tag key={s} tone={mine.has(s.toLowerCase()) ? 'brand' : 'muted'}>
                      {s}
                    </Tag>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-ink-500 dark:text-slate-400">
                  <span className="truncate">
                    {x.r.allocationStartDate ? `From ${shortDay(x.r.allocationStartDate)}` : 'Start not set'}
                    {x.r.priority ? ` · ${humanize(x.r.priority)}${x.r.priority === 'HIGH' ? ' priority' : ''}` : ''}
                  </span>
                  {x.r.myStatus ? (
                    <Tag tone="sky">{humanize(x.r.myStatus)}</Tag>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void apply(x.r.requirementId)}
                      disabled={busy === x.r.requirementId}
                      className="rounded-[10px] bg-brand-500 px-2.75 py-1.5 text-xs font-bold text-white shadow-[0_8px_18px_-10px_rgba(34,197,94,0.8)] hover:bg-brand-600 disabled:opacity-60"
                    >
                      Apply
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* training · recent activity */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className={TILE} aria-label="Training">
          <TileHead icon={GraduationCap} title="Training" sub="What you are learning, and what is open to join" more={{ to: '/associate/training', label: 'Open training' }} />
          {training ? (
            <div className="grid gap-3 rounded-[20px] border border-slate-200/80 bg-slate-50 p-4 dark:border-white/7 dark:bg-white/5">
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0">
                  <b className="block truncate text-base font-extrabold text-ink-900 dark:text-white">{training.programName}</b>
                  <small className="block text-xs text-ink-500 dark:text-slate-400">{training.assignedByName ? `Assigned by ${training.assignedByName}` : 'Assigned by your RMG'}</small>
                </div>
                <Tag tone="violet">{humanize(training.assignmentStatus)}</Tag>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-[13px]">
                  <b className="text-ink-900 dark:text-white">{trainingPct}% done</b>
                  <span className="text-ink-500 dark:text-slate-400">ends {shortDay(training.expectedEndDate)}</span>
                </div>
                <Bar value={trainingPct} tone="violet" />
              </div>
            </div>
          ) : (
            <Empty>No training running. Show interest in one below and your RMG will decide.</Empty>
          )}
          <div className="mt-3 grid gap-2">
            {openPrograms.map((p, k) => {
              const left = p.maxParticipants != null ? p.maxParticipants - (p.seatsTaken ?? 0) : null
              return (
                <Li
                  key={p.programId}
                  lead={<Avatar name={initials(p.programName)} grad={avatarOf(k + 2)} square />}
                  title={p.programName}
                  sub={`${p.durationDays ? `${p.durationDays} days` : 'Self paced'}${left != null ? ` · ${Math.max(0, left)} of ${p.maxParticipants} seats left` : ''}`}
                  right={
                    p.myStatus === 'REQUESTED' ? (
                      <Tag tone="amber">Requested</Tag>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void showInterest(p.programId)}
                        disabled={busy === p.programId || left === 0}
                        className="shrink-0 rounded-[10px] border border-slate-200/80 bg-white px-2.75 py-1.5 text-xs font-bold text-ink-900 hover:border-brand-500/40 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      >
                        {left === 0 ? 'Full' : 'Show interest'}
                      </button>
                    )
                  }
                />
              )
            })}
          </div>
        </section>

        <RecentActivity />
      </div>
    </div>
  )
}
