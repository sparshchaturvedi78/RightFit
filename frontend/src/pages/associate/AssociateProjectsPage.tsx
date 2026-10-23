import { FolderSearch, Search } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../components/dashboard/Panel'
import { Dropdown } from '../../components/ui/Dropdown'
import { Button, Input } from '../../components/ui/form'
import RefreshButton from '../../components/ui/RefreshButton'
import { useQuery } from '../../hooks/useQuery'
import { useToast } from '../../hooks/useToast'
import { associateWorkService, type OpenRequirementDTO } from '../../services/associate/work.service'
import { getApiErrorMessage } from '../../services/httpClient'
import { useAppDispatch } from '../../store'
import { invalidateQueries } from '../../store/queriesSlice'
import { humanize } from '../../utils/format'
import { formatDay } from '../admin/employees/employeeUi'
import { useAssociateState } from './associateState'
import PageHeader from './PageHeader'
import { Tag } from './ui'

const PRIORITIES = [
  { value: '', label: 'Any priority' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
]

/** Statuses an associate can still take back themselves (before anyone invites them). */
const WITHDRAWABLE = ['IDENTIFIED', 'SHORTLISTED']

function skillsOf(r: OpenRequirementDTO): string[] {
  return (r.requiredSkills ?? '').split(/[,;]/).map((s) => s.trim()).filter(Boolean)
}

/** Open requirements an associate in the pool can apply to. Applying makes them a candidate the manager reviews. */
export default function AssociateProjectsPage() {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const { allocated, dashboard } = useAssociateState()
  const list = useQuery('associateRequirements', {})
  const [query, setQuery] = useState('')
  const [skill, setSkill] = useState('')
  const [years, setYears] = useState('')
  const [priority, setPriority] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const text = query.trim().toLowerCase()
  const wanted = skill.trim().toLowerCase()
  const myYears = years ? Number(years) : null
  const shown = (list.data ?? []).filter(
    (r) =>
      (!text || [r.requirementId, r.positionTitle, r.projectName, r.managerName].some((v) => v?.toLowerCase().includes(text))) &&
      (!wanted || skillsOf(r).some((s) => s.toLowerCase().includes(wanted))) &&
      (myYears == null || ((r.minExperience == null || myYears >= r.minExperience) && (r.maxExperience == null || myYears <= r.maxExperience))) &&
      (!priority || r.priority === priority),
  )

  async function act(r: OpenRequirementDTO, kind: 'apply' | 'withdraw') {
    setBusy(r.requirementId)
    try {
      if (kind === 'apply') {
        await associateWorkService.apply(r.requirementId)
        toast.success('Applied', `${r.requirementId} · ${r.positionTitle}. The manager will review it.`)
      } else if (r.myApplicationId) {
        await associateWorkService.withdraw(r.myApplicationId)
        toast.success('Application withdrawn', r.requirementId)
      }
      dispatch(invalidateQueries('associateRequirements'))
      dispatch(invalidateQueries('associateOpportunities'))
    } catch (err) {
      toast.error(kind === 'apply' ? 'Could not apply' : 'Could not withdraw', getApiErrorMessage(err, 'Try again.'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <PageHeader
        eyebrow="Find work"
        title="Projects"
        sub="Open requirements across the company. Apply to the ones that fit; the manager decides who moves on."
        actions={<RefreshButton onClick={list.refresh} loading={list.loading} />}
      />

      {dashboard.data && allocated && (
        <p className="rounded-2xl bg-sky-500/8 px-4 py-3 text-sm text-ink-700 dark:text-slate-300">You are on a project. Applying opens again when your allocation ends.</p>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-5">
        <aside aria-label="Filters" className={`${TILE_SURFACE} grid gap-4 p-5 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto`}>
          <label className="grid gap-1.5 text-xs font-semibold text-ink-500 dark:text-slate-400">
            Search
            <span className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
              <Search className="h-4 w-4 shrink-0" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Role, project or manager"
                className="w-full bg-transparent py-2.5 text-sm text-ink-900 outline-none dark:text-white"
              />
            </span>
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-ink-500 dark:text-slate-400">
            Skill
            <Input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="For example, Java" />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-ink-500 dark:text-slate-400">
            My years of experience
            <Input type="number" min={0} step={0.5} value={years} onChange={(e) => setYears(e.target.value)} placeholder="Shows roles that fit" />
          </label>
          <div className="grid gap-1.5 text-xs font-semibold text-ink-500 dark:text-slate-400">
            Priority
            <Dropdown ariaLabel="Priority" value={priority} onChange={setPriority} options={PRIORITIES} />
          </div>
        </aside>

        <section aria-label="Open requirements" className="grid min-w-0 gap-3">
          {list.error && !list.data ? (
            <div className={`${TILE_SURFACE} p-5`}>
              <PanelError message={list.error} status={list.status} onRetry={list.refresh} />
            </div>
          ) : !list.data ? (
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
          ) : shown.length === 0 ? (
            <div className={`${TILE_SURFACE} px-6 py-12`}>
              <EmptyState icon={<FolderSearch className="h-5 w-5" />}>{(list.data ?? []).length === 0 ? 'No requirements are open right now.' : 'Nothing matches these filters.'}</EmptyState>
            </div>
          ) : (
            <>
              <p className="text-sm text-ink-500 dark:text-slate-400">
                <b className="text-ink-900 dark:text-white">{shown.length}</b> open requirement{shown.length === 1 ? '' : 's'}
              </p>
              {shown.map((r) => (
                <article key={r.requirementId} className={`${TILE_SURFACE} grid gap-3 p-5`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-ink-900 dark:text-white">
                        {r.requirementId} · {r.positionTitle}
                      </h2>
                      <p className="text-xs text-ink-500 dark:text-slate-400">
                        {[r.projectName, r.managerName ? `Manager ${r.managerName}` : null, r.allocationStartDate ? `Starts ${formatDay(r.allocationStartDate)}` : null, r.allocationEndDate ? `ends ${formatDay(r.allocationEndDate)}` : 'open ended'].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    {r.priority && <Tag tone={r.priority === 'HIGH' || r.priority === 'CRITICAL' ? 'info' : 'muted'}>{humanize(r.priority)} priority</Tag>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-700 dark:text-slate-300">
                    {(r.minExperience != null || r.maxExperience != null) && <span>{r.minExperience ?? 0} to {r.maxExperience ?? '—'} years</span>}
                    {r.requiredCertifications && <span>Certifications: {r.requiredCertifications}</span>}
                  </div>
                  {skillsOf(r).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {skillsOf(r).map((s) => (
                        <span key={s} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-ink-700 dark:bg-white/8 dark:text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {r.description && <p className="line-clamp-2 text-sm text-ink-700 dark:text-slate-300">{r.description}</p>}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {r.myStatus ? <Tag tone="ok">You applied · {humanize(r.myStatus)}</Tag> : <span />}
                    {!allocated &&
                      (!r.myStatus || ['WITHDRAWN', 'REJECTED', 'DECLINED'].includes(r.myStatus) ? (
                        <Button variant="primary" loading={busy === r.requirementId} onClick={() => void act(r, 'apply')}>
                          Apply
                        </Button>
                      ) : WITHDRAWABLE.includes(r.myStatus) ? (
                        <Button variant="secondary" loading={busy === r.requirementId} onClick={() => void act(r, 'withdraw')}>
                          Withdraw
                        </Button>
                      ) : null)}
                  </div>
                </article>
              ))}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
