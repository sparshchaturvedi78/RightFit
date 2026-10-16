import { motion } from 'motion/react'
import { ChevronLeft, ClipboardList, Pencil } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../../components/dashboard/Panel'
import { Button } from '../../../components/ui/form'
import RefreshButton from '../../../components/ui/RefreshButton'
import { useQuery } from '../../../hooks/useQuery'
import { useResource } from '../../../hooks/useResource'
import { useToast } from '../../../hooks/useToast'
import { getApiErrorMessage } from '../../../services/httpClient'
import { managerRequirementAssignmentService } from '../../../services/manager/requirementAssignment.service'
import { useAppDispatch } from '../../../store'
import { invalidateQueries } from '../../../store/queriesSlice'
import { humanize, timeAgo } from '../../../utils/format'
import { formatDay } from '../../admin/employees/employeeUi'
import ManagerLink from '../ManagerLink'
import NewRequirementPanel from '../projects/NewRequirementPanel'
import ResponsibilityBoard from '../projects/ResponsibilityBoard'
import { type PickedPerson } from '../projects/ResponsibilityPicker'
import { PRIORITY_TAG, STAGES, STATUS_PILL } from '../managerUi'
import StatusDialog from './StatusDialog'
import { actionsFor, STATUS_ACTIONS, type StatusAction } from './statusActions'

/** One requirement: its role, where its candidates are, who handles it, and what the manager can do with it. */
export default function RequirementPage() {
  const { requirementId = '' } = useParams()
  const { hash } = useLocation()
  const dispatch = useAppDispatch()
  const toast = useToast()
  const dashboard = useResource('manager/dashboard')
  const projects = useResource('manager/projects')
  const req = useQuery('managerRequirement', { requirementId })
  const card = useQuery('managerRequirementCard', { requirementId })
  const assigns = useQuery('managerRequirementAssignments', { requirementId })
  const [action, setAction] = useState<StatusAction | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const r = req.data
  const refreshing = req.loading || card.loading || assigns.loading

  function refresh() {
    dispatch(invalidateQueries('managerRequirement'))
    dispatch(invalidateQueries('managerRequirementCard'))
    dispatch(invalidateQueries('managerRequirementAssignments'))
    dispatch(invalidateQueries('managerProjectRequirements'))
    dispatch(invalidateQueries('managerAllRequirements'))
    dashboard.reload()
  }

  // A link such as /manager/requirements/REQ-1042#responsibilities scrolls to that section once the page has loaded.
  useEffect(() => {
    if (hash && r) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash, r])

  const back = (
    <Link to={r ? `/manager/projects/${r.projectId}` : '/manager/requirements'} className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400">
      <ChevronLeft className="h-3.5 w-3.5" /> {r ? (r.projectName ?? 'Project') : 'Requirements'}
    </Link>
  )

  if (req.error && !r) {
    return (
      <div className="mx-auto max-w-350">
        {back}
        <div className={`${TILE_SURFACE} p-5`}>
          <PanelError message={req.error} status={req.status} onRetry={req.refresh} />
        </div>
      </div>
    )
  }
  if (!r) {
    return (
      <div className="mx-auto max-w-350 space-y-4">
        {back}
        <Skeleton className="h-16 w-96 rounded-2xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    )
  }

  const open = !['CLOSED', 'CANCELLED'].includes(r.status)
  const actions = actionsFor(r.status)
  const main = actions.find((a) => a === 'publish' || a === 'resume')
  const others = actions.filter((a) => a !== main)
  const stages = card.data?.stages
  const total = stages ? STAGES.reduce((n, s) => n + (stages[s.key] ?? 0), 0) : 0
  const widest = stages ? Math.max(1, ...STAGES.map((s) => stages[s.key] ?? 0)) : 1

  const held = (type: string): PickedPerson[] =>
    (assigns.data ?? []).filter((a) => a.isActive && a.responsibilityType === type).map((a) => ({ employeeId: a.employeeId, name: a.employeeName ?? a.employeeId }))

  /** The picker hands back the whole new list; work out who was added or removed and save that straight away. */
  async function change(type: 'SOURCER' | 'INTERVIEWER' | 'COORDINATOR', next: PickedPerson[]) {
    const before = held(type)
    const added = next.filter((n) => !before.some((b) => b.employeeId === n.employeeId))
    const removed = before.filter((b) => !next.some((n) => n.employeeId === b.employeeId))
    setSaving(true)
    try {
      for (const p of added) await managerRequirementAssignmentService.assign(r!.requirementId, { employeeId: p.employeeId, responsibilityType: type })
      for (const p of removed) await managerRequirementAssignmentService.remove(r!.requirementId, p.employeeId, type)
      if (added.length) toast.success(`${added.map((p) => p.name).join(', ')} added as ${type.toLowerCase()}`)
      if (removed.length) toast.success(`${removed.map((p) => p.name).join(', ')} removed as ${type.toLowerCase()}`)
    } catch (err) {
      toast.error('Could not change who handles this', getApiErrorMessage(err, 'Try again.'))
    } finally {
      dispatch(invalidateQueries('managerRequirementAssignments'))
      dispatch(invalidateQueries('managerRequirementCard'))
      dispatch(invalidateQueries('managerProjectRequirements'))
      dispatch(invalidateQueries('managerAllRequirements'))
      dashboard.reload()
      setSaving(false)
    }
  }

  function afterChange() {
    refresh()
  }

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <div>{back}</div>

      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.14em] text-ink-500 uppercase dark:text-slate-400">{r.requirementId}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">{r.positionTitle}</h1>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${STATUS_PILL[r.status] ?? STATUS_PILL.CLOSED}`}>{humanize(r.status)}</span>
            {r.priority && (
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${PRIORITY_TAG[r.priority] ?? PRIORITY_TAG.LOW}`}>{humanize(r.priority)} priority</span>
            )}
          </div>
          <p className="mt-1.5 flex flex-wrap gap-x-4 text-[13px] text-ink-500 dark:text-slate-400">
            <ManagerLink to={`/manager/projects/${r.projectId}`} className="font-semibold text-ink-900 dark:text-white" hoverClassName="hover:text-brand-600 dark:hover:text-brand-400">
              {r.projectName ?? r.projectId}
            </ManagerLink>
            {r.createdByName && <span>Created by {r.createdByName}</span>}
            {r.createdAt && <span>{timeAgo(r.createdAt)}</span>}
            {r.updatedAt && r.updatedAt !== r.createdAt && <span>Updated {timeAgo(r.updatedAt)}</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RefreshButton onClick={refresh} loading={refreshing} />
          {open && (
            <Button variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
          {others.map((a) => (
            <Button key={a} variant={a === 'cancel' ? 'danger' : 'secondary'} onClick={() => setAction(a)}>
              {STATUS_ACTIONS[a].label}
            </Button>
          ))}
          {main && (
            <Button variant="primary" onClick={() => setAction(main)}>
              {STATUS_ACTIONS[main].label}
            </Button>
          )}
        </div>
      </motion.header>

      <div className="grid gap-4 lg:gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid min-w-0 content-start gap-4 lg:gap-5">
          <section className={`${TILE_SURFACE} grid gap-5 p-6`} aria-label="About this role">
            <h2 className="text-[15px] font-semibold text-ink-900 dark:text-white">About this role</h2>
            {r.description ? <p className="max-w-[70ch] text-sm leading-relaxed whitespace-pre-line text-ink-700 dark:text-slate-300">{r.description}</p> : <p className="text-sm text-ink-500 dark:text-slate-400">No description yet.</p>}
            <dl className="grid gap-4 sm:grid-cols-2">
              <Fact label="Skills needed">
                {r.requiredSkills ? (
                  <span className="flex flex-wrap gap-1.5">
                    {r.requiredSkills.split(',').map((k) => k.trim()).filter(Boolean).map((k) => (
                      <span key={k} className="rounded-full bg-brand-500/12 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:text-brand-400">{k}</span>
                    ))}
                  </span>
                ) : (
                  '—'
                )}
              </Fact>
              <Fact label="Experience">{r.minExperience != null || r.maxExperience != null ? `${r.minExperience ?? 0} to ${r.maxExperience ?? 'any'} years` : '—'}</Fact>
              <Fact label="Certifications">{r.requiredCertifications || '—'}</Fact>
              <Fact label="Needed">{r.allocationStartDate || r.allocationEndDate ? `${formatDay(r.allocationStartDate) ?? 'Now'} to ${formatDay(r.allocationEndDate) ?? 'open ended'}` : '—'}</Fact>
            </dl>
          </section>

          <section id="responsibilities" className={`${TILE_SURFACE} grid scroll-mt-24 gap-3 p-6`} aria-label="Who handles it">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[15px] font-semibold text-ink-900 dark:text-white">Who handles it</h2>
              <p className="text-xs text-ink-500 dark:text-slate-400">
                {open ? 'Only the project’s team and you can be chosen. Changes save straight away.' : 'This requirement is closed, so this can’t be changed.'}
              </p>
            </div>
            {assigns.error && !assigns.data ? (
              <PanelError message={assigns.error} status={assigns.status} onRetry={assigns.refresh} />
            ) : !assigns.data ? (
              <div className="grid gap-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className={`grid gap-3 transition-opacity ${saving ? 'pointer-events-none opacity-60' : ''}`} aria-busy={saving}>
                <ResponsibilityBoard
                  projectId={r.projectId}
                  value={{ SOURCER: held('SOURCER'), INTERVIEWER: held('INTERVIEWER'), COORDINATOR: held('COORDINATOR') }}
                  onChange={(type, next) => void change(type, next)}
                  disabled={!open}
                />
              </div>
            )}
          </section>
        </div>

        <aside className="grid min-w-0 content-start gap-4 lg:gap-5">
          <section className={`${TILE_SURFACE} grid gap-4 p-6`} aria-label="Candidates">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[15px] font-semibold text-ink-900 dark:text-white">Candidates</h2>
              {stages && <span className="text-xs text-ink-500 tabular-nums dark:text-slate-400">{total} in process</span>}
            </div>
            {!stages ? (
              <Skeleton className="h-40 rounded-2xl" />
            ) : r.status === 'DRAFT' ? (
              <EmptyState icon={<ClipboardList className="h-5 w-5" />}>Publish this requirement to start adding candidates.</EmptyState>
            ) : (
              <div className="grid gap-3">
                {STAGES.map((s) => (
                  <div key={s.key} className="grid grid-cols-[92px_minmax(0,1fr)_28px] items-center gap-2.5 text-[13px]">
                    <span className="text-ink-500 dark:text-slate-400">{s.label}</span>
                    <span className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/6">
                      <i className={`block h-full rounded-full ${s.bar}`} style={{ width: `${((stages[s.key] ?? 0) / widest) * 100}%` }} />
                    </span>
                    <b className="text-right font-semibold tabular-nums">{stages[s.key] ?? 0}</b>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-ink-500 dark:text-slate-400">The candidate list, invitations and interviews open from here as those pages arrive.</p>
          </section>
        </aside>
      </div>

      <StatusDialog
        requirement={r}
        action={action}
        onClose={() => setAction(null)}
        onDone={() => {
          setAction(null)
          afterChange()
        }}
      />
      <NewRequirementPanel
        open={editing}
        onClose={() => setEditing(false)}
        projects={projects.data?.claimed ?? []}
        requirement={r}
        onCreated={() => afterChange()}
      />
    </div>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-bold tracking-[0.1em] text-ink-500 uppercase dark:text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-ink-900 dark:text-white">{children}</dd>
    </div>
  )
}
