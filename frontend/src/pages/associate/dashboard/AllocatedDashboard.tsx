import { ArrowRight, Briefcase, CheckCircle2, ClipboardList, Clock, Gavel, RefreshCw, TriangleAlert, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { Skeleton } from '../../../components/dashboard/Panel'
import { useQuery } from '../../../hooks/useQuery'
import type { InterviewDTO } from '../../../services/interview.service'
import { useAppDispatch } from '../../../store'
import { invalidateQueries } from '../../../store/queriesSlice'
import { humanize, parseServerDate } from '../../../utils/format'
import { useAssociateState } from '../associateState'
import { avatarOf, clock, dayWord, greeting, initials, longToday, sameDay, shortDay, timeOf } from './model'
import RecentActivity from './RecentActivity'
import { Attention, Avatar, Chip, Chips, Day, Empty, Ev, Ghost, Hero, HeroBox, HeroTop, Kpi, Li, Tag, TILE, TileHead, When } from './ui'

const OPEN = ['SCHEDULED', 'ACCEPTED']
const HOUR_SHADES = ['#ffffff', 'rgba(255, 255, 255, 0.55)', 'rgba(255, 255, 255, 0.3)']
const DUTY_TAG = { SOURCER: 'sky', COORDINATOR: 'amber', INTERVIEWER: 'violet' } as const

/** The associate on a project: their day, their projects and team, and the hiring duties they hold. */
export default function AllocatedDashboard() {
  const dispatch = useAppDispatch()
  const { dashboard, duties } = useAssociateState()
  const profile = useQuery('associateProfile', {})
  const projects = useQuery('associateProjects', {})
  const dutyInterviews = useQuery('dutyInterviews', {})
  const [now] = useState(() => new Date())

  const list = projects.data ?? []
  const myId = profile.data?.employeeId
  const dutyList = duties.data ?? []
  const roles = [...new Set(dutyList.map((x) => x.responsibility))]

  // Interviews this associate conducts on their duties.
  const mine = (dutyInterviews.data ?? []).filter((i) => !myId || i.interviewerId === myId)
  const isPast = (i: InterviewDTO) => parseServerDate(i.scheduledAt) < now
  const todayToTake = mine.filter((i) => OPEN.includes(i.status) && sameDay(parseServerDate(i.scheduledAt), now))
  const feedbackDue = mine.filter((i) => OPEN.includes(i.status) && (isPast(i) || Boolean(i.heldAt)) && !i.feedback)
  const upcoming = mine.filter((i) => OPEN.includes(i.status) && !isPast(i)).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  const done = mine.filter((i) => i.status === 'COMPLETED' && i.feedback)
  const toShortlist = dutyList.reduce((n, x) => n + (x.responsibility === 'SOURCER' ? x.toShortlist : 0), 0)
  const feedbackCount = Math.max(feedbackDue.length, dutyList.reduce((n, x) => n + (x.responsibility === 'INTERVIEWER' ? x.feedbackDue : 0), 0))
  const dutyWork = todayToTake.length + feedbackCount + toShortlist
  const requirementsWithWork = dutyList.filter((x) => x.toShortlist || x.toInvite || x.toBook || x.feedbackDue).length

  const day = list[0]?.myWorkingHoursPerDay ?? 9
  const booked = list.reduce((n, p) => n + (p.myHoursPerDay ?? 0), 0)
  const since = list.map((p) => p.myStartDate).filter(Boolean).sort()[0]
  const managers = [...new Set(list.map((p) => p.managerName).filter(Boolean) as string[])]
  const teamPeople = new Map<string, string>()
  list.forEach((p) => p.team.filter((t) => !t.me).forEach((t) => teamPeople.set(t.employeeId, t.name)))
  const sourcing = dutyList.find((x) => x.responsibility === 'SOURCER' && x.toShortlist > 0)
  const firstToday = todayToTake[0]
  const firstFeedback = feedbackDue[0]

  function refreshAll() {
    ;['associateDashboard', 'associateDuties', 'associateProfile', 'associateProjects', 'dutyInterviews', 'latestNotifications'].forEach((n) =>
      dispatch(invalidateQueries(n as Parameters<typeof invalidateQueries>[0])),
    )
  }

  const names = list.map((p) => p.projectName)
  const projectText =
    names.length === 0 ? (
      'a project'
    ) : (
      <>
        {names.map((n, i) => (
          <span key={n}>
            {i > 0 && (i === names.length - 1 ? ' and ' : ', ')}
            <strong>{n}</strong>
          </span>
        ))}
      </>
    )

  const cells = [
    firstToday && { label: 'Today', side: clock(firstToday.scheduledAt), today: true, title: `Interview · ${firstToday.employeeName ?? ''}`, sub: `${firstToday.requirementId ?? ''} · you interview` },
    firstFeedback && { label: 'Feedback', side: 'due', title: firstFeedback.employeeName ?? '', sub: `${firstFeedback.requirementId ?? ''} · held ${dayWord(parseServerDate(firstFeedback.scheduledAt), now)}`, amber: true },
    sourcing && { label: 'Sourcing', side: sourcing.requirementId, title: `${sourcing.toShortlist} to shortlist`, sub: sourcing.positionTitle },
  ].filter(Boolean) as { label: string; side: string; today?: boolean; title: string; sub: string; amber?: boolean }[]

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-5">
      {/* hero + hiring duties */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Hero>
          <HeroTop
            eyebrow={longToday(now)}
            title={`${greeting(now)}, ${profile.data?.firstName ?? ''}`.trim()}
            lead={
              <>
                You are on {projectText}
                {managers.length > 0 ? `, with ${managers.join(' and ')} as your manager${managers.length > 1 ? 's' : ''}` : ''}.
                {todayToTake.length > 0 && (
                  <>
                    {' '}
                    <strong>
                      {todayToTake.length} interview{todayToTake.length === 1 ? '' : 's'}
                    </strong>{' '}
                    on your duties {todayToTake.length === 1 ? 'is' : 'are'} today.
                  </>
                )}
              </>
            }
            actions={
              <>
                <Ghost onClick={refreshAll}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </Ghost>
                <Ghost solid to="/associate/team">
                  See my team
                  <ArrowRight className="h-3.5 w-3.5" />
                </Ghost>
              </>
            }
          />
          <Chips>
            {since && <Chip icon={CheckCircle2}>Allocated since {shortDay(since)}</Chip>}
            <Chip icon={Clock}>{booked >= day ? 'Full working day booked' : `${booked} of ${day} h booked`}</Chip>
            {feedbackCount > 0 && (
              <Chip icon={TriangleAlert} warn>
                {feedbackCount} feedback due
              </Chip>
            )}
          </Chips>
          <HeroBox title={`Your working day · ${day} hours`} note="split by your manager">
            <div className="flex h-3.5 overflow-hidden rounded-full bg-white/15">
              {list.map((p, i) => (
                <i key={p.projectId} className="block h-full" style={{ width: `${((p.myHoursPerDay ?? 0) / day) * 100}%`, background: HOUR_SHADES[i % HOUR_SHADES.length] }} />
              ))}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-4 text-xs text-white/85">
              {list.map((p, i) => (
                <span key={p.projectId} className="inline-flex items-center gap-1.5">
                  <i className="inline-block h-2.25 w-2.25 rounded-full" style={{ background: HOUR_SHADES[i % HOUR_SHADES.length] }} />
                  {p.projectName} · {p.myHoursPerDay ?? 0} h
                </span>
              ))}
            </div>
            {cells.length > 0 && (
              <div className="mt-3.5 grid gap-2" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
                {cells.map((c) => (
                  <Day key={c.label} label={c.label} side={c.side} today={c.today} compact>
                    <Ev title={c.title} sub={c.sub} amber={c.amber} />
                  </Day>
                ))}
              </div>
            )}
          </HeroBox>
        </Hero>

        <Attention
          icon={ClipboardList}
          title="Hiring duties"
          sub={roles.length > 0 ? roles.map((r) => humanize(r)).join(' · ') : 'Sourcing, coordinating, interviewing'}
          count={dutyWork}
          headline={dutyWork > 0 ? 'Duty work waiting' : 'All caught up'}
          detail={dutyWork > 0 ? `on ${requirementsWithWork || 1} requirement${requirementsWithWork === 1 ? '' : 's'}` : 'Nothing waiting on your duties'}
          empty={dutyList.length === 0 ? 'Managers have not given you a hiring duty yet.' : undefined}
          rows={[
            { label: 'Interview to take today', count: todayToTake.length, urgent: todayToTake.length > 0, to: '/associate/interviews-to-take' },
            { label: 'Feedback to give', count: feedbackCount, urgent: feedbackCount > 0, to: '/associate/interviews-to-take' },
            { label: 'People to shortlist', count: toShortlist, urgent: toShortlist > 0, to: '/associate/duties' },
            { label: 'Unread notifications', count: dashboard.data?.unreadNotifications ?? 0, urgent: false },
          ]}
        />
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
        <Kpi label="Projects" icon={Briefcase} tone="brand" value={list.length} caption={names.join(' · ') || 'none yet'} progress={list.length > 0 ? 100 : 0} />
        <Kpi label="Working day" icon={Clock} tone="sky" text={`${booked} h`} caption={booked >= day ? 'fully booked' : `${day - booked} h free`} progress={(booked / day) * 100} />
        <Kpi label="Team" icon={UsersRound} tone="violet" value={teamPeople.size} caption={`people across ${list.length === 1 ? 'your project' : list.length === 2 ? 'both projects' : 'your projects'}`} progress={Math.min(100, teamPeople.size * 10)} />
        <Kpi
          label="Duty work"
          icon={ClipboardList}
          tone="amber"
          value={dutyWork}
          caption={dutyList.length === 0 ? 'no hiring duties' : `waiting on ${requirementsWithWork} requirement${requirementsWithWork === 1 ? '' : 's'}`}
          progress={dutyList.length ? (requirementsWithWork / dutyList.length) * 100 : 0}
        />
      </div>

      {/* projects · interviews on my duties */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className={TILE} aria-label="Your projects">
          <TileHead icon={Briefcase} title="Your projects" sub="Where you work, and who with" more={{ to: '/associate/team', label: 'See my team' }} />
          {!projects.data ? (
            <Skeleton className="h-48 rounded-2xl" />
          ) : list.length === 0 ? (
            <Empty>Your project details will show here.</Empty>
          ) : (
            <div className="grid gap-3">
              {list.map((p) => {
                const others = p.team.filter((t) => !t.me)
                return (
                  <article key={p.projectId} className="grid gap-3 rounded-[20px] border border-slate-200/80 bg-slate-50 p-4 dark:border-white/7 dark:bg-white/5">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0">
                        <b className="block truncate text-base font-extrabold text-ink-900 dark:text-white">{p.projectName}</b>
                        <small className="block truncate text-xs text-ink-500 dark:text-slate-400">
                          {[p.clientName, p.myRole ? humanize(p.myRole).toLowerCase() : null].filter(Boolean).join(' · ')}
                        </small>
                      </div>
                      <Tag tone="brand">{p.status ? humanize(p.status) : 'Active'}</Tag>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        ['Manager', p.managerName ?? '—'],
                        ['On it since', shortDay(p.myStartDate, true)],
                        ['Your hours', `${p.myHoursPerDay ?? 0} h a day`],
                      ].map(([k, v]) => (
                        <div key={k} className="min-w-0 rounded-xl border border-slate-200/80 bg-white px-2.5 py-2 dark:border-white/7 dark:bg-white/3">
                          <small className="block text-[10px] font-bold tracking-[0.08em] text-ink-500 uppercase dark:text-slate-400">{k}</small>
                          <b className="block truncate text-[13px] font-bold text-ink-900 dark:text-white">{v}</b>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center">
                      {others.slice(0, 4).map((t, i) => (
                        <span key={t.employeeId} className={`${i > 0 ? '-ml-2' : ''} rounded-full ring-2 ring-slate-50 dark:ring-ink-950`}>
                          <Avatar name={initials(t.name)} grad={avatarOf(i)} small />
                        </span>
                      ))}
                      <small className="ml-2.5 text-xs text-ink-500 dark:text-slate-400">
                        {others.length + 1} people on the team
                      </small>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section className={TILE} aria-label="Interviews on my duties">
          <TileHead icon={Gavel} title="Interviews on my duties" sub="You are the interviewer" more={{ to: '/associate/interviews-to-take', label: 'Open' }} />
          {!dutyInterviews.data ? (
            <Skeleton className="h-48 rounded-2xl" />
          ) : todayToTake.length + feedbackDue.length + upcoming.length + done.length === 0 ? (
            <Empty>No interviews on your duties right now.</Empty>
          ) : (
            <div className="grid gap-2">
              {[...feedbackDue.map((i) => ({ i, kind: 'due' as const })), ...upcoming.map((i) => ({ i, kind: 'next' as const })), ...done.map((i) => ({ i, kind: 'done' as const }))]
                .slice(0, 4)
                .map(({ i, kind }, k) => {
                  const at = parseServerDate(i.scheduledAt)
                  return (
                    <Li
                      key={i.interviewId}
                      lead={<Avatar name={initials(i.employeeName)} grad={avatarOf(k + 4)} />}
                      title={i.employeeName ?? i.employeeId}
                      sub={
                        kind === 'due'
                          ? `${i.requirementId ?? ''} · held · feedback due`
                          : kind === 'done'
                            ? `${i.requirementId ?? ''} · feedback given`
                            : `${i.requirementId ?? ''} · Round ${i.roundNumber ?? 1} · ${humanize(i.mode ?? 'ONLINE').toLowerCase()}`
                      }
                      right={
                        kind === 'due' ? (
                          <Tag tone="amber">Give feedback</Tag>
                        ) : kind === 'done' ? (
                          <Tag tone="brand">Done</Tag>
                        ) : (
                          <When time={timeOf(i.scheduledAt)} day={dayWord(at, now)} today={sameDay(at, now)} />
                        )
                      }
                    />
                  )
                })}
            </div>
          )}
        </section>
      </div>

      {/* team · duties · activity */}
      <div className="grid gap-5 lg:grid-cols-3">
        <section className={TILE} aria-label="My team">
          <TileHead icon={UsersRound} title="My team" sub={list[0]?.projectName ?? 'Your project'} more={{ to: '/associate/team', label: 'See all' }} />
          {!projects.data ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : (list[0]?.team.filter((t) => !t.me).length ?? 0) === 0 ? (
            <Empty>Nobody else is on this project yet.</Empty>
          ) : (
            <div className="grid gap-2">
              {list[0].team
                .filter((t) => !t.me)
                .sort((a, b) => Number(/MANAGER/.test(b.role ?? '')) - Number(/MANAGER/.test(a.role ?? '')))
                .slice(0, 4)
                .map((t, i) => (
                  <Li
                    key={t.employeeId}
                    lead={<Avatar name={initials(t.name)} grad={avatarOf(i)} />}
                    title={t.name}
                    sub={t.designation ?? ''}
                    right={/MANAGER/.test(t.role ?? '') ? <Tag tone="violet">Manager</Tag> : <Tag>{t.role ? humanize(t.role) : 'Team member'}</Tag>}
                  />
                ))}
            </div>
          )}
        </section>

        <section className={TILE} aria-label="My duties">
          <TileHead icon={ClipboardList} title="My duties" sub="Requirements you help hire for" more={dutyList.length ? { to: '/associate/duties', label: 'Open' } : undefined} />
          {!duties.data ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : dutyList.length === 0 ? (
            <Empty>No hiring duties yet.</Empty>
          ) : (
            <div className="grid gap-2">
              {dutyList.slice(0, 4).map((x) => {
                const todo =
                  x.responsibility === 'SOURCER'
                    ? x.toShortlist
                      ? `${x.toShortlist} to shortlist`
                      : 'find people to add'
                    : x.responsibility === 'COORDINATOR'
                      ? [x.toInvite ? `${x.toInvite} to invite` : null, x.toBook ? `${x.toBook} to book` : null].filter(Boolean).join(' · ') || 'nothing to arrange'
                      : [x.feedbackDue ? `${x.feedbackDue} feedback` : null, x.upcomingInterviews ? `${x.upcomingInterviews} upcoming` : null].filter(Boolean).join(' · ') || 'no interviews yet'
                return (
                  <Li
                    key={`${x.requirementId}-${x.responsibility}`}
                    lead={<Tag tone={DUTY_TAG[x.responsibility]}>{humanize(x.responsibility)}</Tag>}
                    title={`${x.requirementId} · ${x.positionTitle}`}
                    sub={`${x.projectName} · ${todo}`}
                  />
                )
              })}
            </div>
          )}
        </section>

        <RecentActivity />
      </div>
    </div>
  )
}
