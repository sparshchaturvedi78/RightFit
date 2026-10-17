import { motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { StatStrip, type StatItem } from '../../../components/dashboard/StatStrip'
import Reveal from '../../../components/ui/Reveal'
import { useResource } from '../../../hooks/useResource'
import type { ManagerDashboardDTO } from '../../../services/manager/dashboard.service'
import type { InterviewDTO } from '../../../services/interview.service'
import { parseServerDate } from '../../../utils/format'
import { Button } from '../../../components/ui/form'
import RefreshButton from '../../../components/ui/RefreshButton'
import ManagerLink from '../ManagerLink'
import NewRequirementPanel from '../projects/NewRequirementPanel'
import { isoDay, STAGES, stageTotals, workWeek } from '../managerUi'
import AgendaPanel from './AgendaPanel'
import SelectionProcessPanel from './SelectionProcessPanel'
import ProjectsPanel from './ProjectsPanel'
import RequirementsPanel from './RequirementsPanel'
import WeekBoard from './WeekBoard'

const sum = (m: Record<string, number> | undefined, keys: string[]) => keys.reduce((n, k) => n + (m?.[k] ?? 0), 0)

/** The four headline figures: what each is made of, and where it leads. */
function figures(d: ManagerDashboardDTO | null): StatItem[] {
  const open = sum(d?.requirementsByStatus, ['DRAFT', 'PUBLISHED', 'ON_HOLD'])
  const stages = d ? stageTotals(d.candidatePipeline) : null
  const inProcess = stages ? Object.values(stages).reduce((a, b) => a + b, 0) : undefined
  const waiting = d?.allocationRequestsByStatus?.SUBMITTED ?? 0
  return [
    {
      label: 'My projects',
      value: d?.totalProjects,
      caption: d ? `${d.claimedProjects} claimed · ${d.pendingClaimProjects} to claim` : undefined,
      segments: d ? [{ value: d.claimedProjects, className: 'bg-brand-500' }, { value: d.pendingClaimProjects, className: 'bg-amber-400' }] : undefined,
      to: '/manager/projects',
    },
    {
      label: 'Open requirements',
      value: d ? open : undefined,
      caption: d ? `${sum(d.requirementsByStatus, ['PUBLISHED'])} published · ${sum(d.requirementsByStatus, ['ON_HOLD'])} on hold · ${sum(d.requirementsByStatus, ['DRAFT'])} draft` : undefined,
      segments: d
        ? [
            { value: sum(d.requirementsByStatus, ['PUBLISHED']), className: 'bg-brand-500' },
            { value: sum(d.requirementsByStatus, ['ON_HOLD']), className: 'bg-amber-400' },
            { value: sum(d.requirementsByStatus, ['DRAFT']), className: 'bg-sky-400' },
          ]
        : undefined,
      to: '/manager/requirements?status=open',
    },
    {
      label: 'Candidates in process',
      value: inProcess,
      caption: d ? `${d.pendingDecisions} waiting for your decision` : undefined,
      segments: stages ? STAGES.map((s) => ({ value: stages[s.key], className: s.bar })) : undefined,
      to: '/manager/requirements',
    },
    {
      label: 'Allocation requests',
      value: d ? waiting : undefined,
      caption: d ? `${d.allocationRequestsByStatus?.APPROVED ?? 0} approved · ${d.allocationRequestsByStatus?.REJECTED ?? 0} rejected` : undefined,
      segments: d
        ? [
            { value: waiting, className: 'bg-amber-400' },
            { value: d.allocationRequestsByStatus?.APPROVED ?? 0, className: 'bg-brand-500' },
            { value: d.allocationRequestsByStatus?.REJECTED ?? 0, className: 'bg-rose-400' },
          ]
        : undefined,
      to: '/manager/allocation-requests',
    },
  ]
}

export default function ManagerDashboardPage() {
  // "Now" is taken once when the page opens, so the week and the agenda don't shift while it is on screen.
  const [now] = useState(() => new Date())
  const dashboard = useResource('manager/dashboard')
  const interviews = useResource('manager/interviews')
  const myProjects = useResource('manager/projects')
  const [creating, setCreating] = useState(false)

  const d = dashboard.data
  const week = new Set(workWeek(now).map(isoDay))
  const thisWeek = (interviews.data ?? []).filter(
    (i: InterviewDTO) => i.status !== 'CANCELLED' && i.status !== 'DECLINED' && week.has(isoDay(parseServerDate(i.scheduledAt))),
  ).length
  const open = sum(d?.requirementsByStatus, ['DRAFT', 'PUBLISHED', 'ON_HOLD'])

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-ink-500 uppercase dark:text-slate-400">
            {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">Your week at a glance</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-slate-400">
            {d && interviews.data
              ? `${d.totalProjects} project${d.totalProjects === 1 ? '' : 's'}, ${open} open requirement${open === 1 ? '' : 's'}, ${thisWeek} interview${thisWeek === 1 ? '' : 's'} this week.`
              : ' '}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RefreshButton
            onClick={() => {
              dashboard.reload()
              interviews.reload()
              myProjects.reload()
            }}
            loading={dashboard.loading || interviews.loading || myProjects.loading}
          />
          <Button
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setCreating(true)}
            disabled={!myProjects.data || myProjects.data.claimed.length === 0}
            title={myProjects.data && myProjects.data.claimed.length === 0 ? 'Claim a project first' : undefined}
          >
            New requirement
          </Button>
        </div>
      </motion.header>

      {dashboard.error && !d && (
        <p className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          {dashboard.status === 403 ? "Your account doesn't have permission to view the dashboard summary." : dashboard.error}
        </p>
      )}

      <StatStrip items={figures(d)} loading={d === null && !dashboard.error} link={ManagerLink} />

      <div className="grid gap-4 lg:gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Reveal delay={0.05} className="h-full">
          <WeekBoard state={interviews} now={now} />
        </Reveal>
        <Reveal delay={0.1} className="h-full">
          <AgendaPanel dashboard={dashboard} interviews={interviews} now={now} />
        </Reveal>
      </div>

      <Reveal delay={0.05}>
        <RequirementsPanel state={dashboard} />
      </Reveal>
      <Reveal delay={0.05}>
        <ProjectsPanel state={dashboard} />
      </Reveal>
      <Reveal delay={0.05}>
        <SelectionProcessPanel state={dashboard} now={now} />
      </Reveal>

      <NewRequirementPanel
        open={creating}
        onClose={() => setCreating(false)}
        projects={myProjects.data?.claimed ?? []}
        onCreated={() => dashboard.reload()}
      />
    </div>
  )
}
