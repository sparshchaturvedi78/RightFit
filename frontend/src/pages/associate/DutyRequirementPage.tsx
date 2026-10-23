import { ChevronLeft, Search, UserPlus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PanelError, Skeleton, TILE_SURFACE } from '../../components/dashboard/Panel'
import { Button } from '../../components/ui/form'
import { Modal } from '../../components/ui/Overlay'
import RefreshButton from '../../components/ui/RefreshButton'
import { useQuery } from '../../hooks/useQuery'
import { useToast } from '../../hooks/useToast'
import { getApiErrorMessage } from '../../services/httpClient'
import { managerCandidateService } from '../../services/manager/candidate.service'
import { managerEmployeeService, type EmployeeCandidateDTO } from '../../services/manager/employee.service'
import { useAppDispatch } from '../../store'
import { invalidateQueries } from '../../store/queriesSlice'
import { humanize } from '../../utils/format'
import { formatDay } from '../admin/employees/employeeUi'
import CandidatesPanel from '../manager/requirements/CandidatesPanel'
import { useAssociateState } from './associateState'
import PageHeader from './PageHeader'
import { Card } from './ui'

/**
 * One requirement the associate holds a duty on. A SOURCER adds people and shortlists them; a COORDINATOR invites
 * shortlisted people and books interviews. Selecting, rejecting and allocation stay with the manager.
 */
export default function DutyRequirementPage() {
  const { requirementId = '' } = useParams()
  const { duties } = useAssociateState()
  const req = useQuery('managerRequirement', { requirementId })
  const [finding, setFinding] = useState(false)
  const roles = (duties.data ?? []).filter((d) => d.requirementId === requirementId).map((d) => d.responsibility)
  const sourcer = roles.includes('SOURCER')
  const coordinator = roles.includes('COORDINATOR')
  const r = req.data

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <Link to="/associate/duties" className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-ink-500 hover:text-ink-900 dark:text-slate-400 dark:hover:text-white">
        <ChevronLeft className="h-4 w-4" /> My duties
      </Link>

      {req.error && !r ? (
        <div className={`${TILE_SURFACE} p-5`}>
          <PanelError message={req.error} status={req.status} onRetry={req.refresh} />
        </div>
      ) : !r ? (
        <Skeleton className="h-48 rounded-3xl" />
      ) : (
        <>
          <PageHeader
            eyebrow={`${r.requirementId} · ${roles.map((x) => humanize(x)).join(' and ') || 'Duty'}`}
            title={r.positionTitle}
            sub={`${r.projectName ?? r.projectId} · ${humanize(r.status)}`}
            actions={
              <>
                {sourcer && r.status === 'PUBLISHED' && (
                  <Button variant="primary" icon={<UserPlus className="h-4 w-4" />} onClick={() => setFinding(true)}>
                    Add a person
                  </Button>
                )}
                <RefreshButton onClick={req.refresh} loading={req.loading} />
              </>
            }
          />

          <Card title="About this role">
            {r.description && <p className="text-sm text-ink-700 dark:text-slate-300">{r.description}</p>}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
              <Fact label="Skills">{r.requiredSkills}</Fact>
              <Fact label="Experience">{r.minExperience != null || r.maxExperience != null ? `${r.minExperience ?? 0} to ${r.maxExperience ?? '—'} years` : undefined}</Fact>
              <Fact label="Certifications">{r.requiredCertifications}</Fact>
              <Fact label="Needed">{[r.allocationStartDate ? formatDay(r.allocationStartDate) : null, r.allocationEndDate ? formatDay(r.allocationEndDate) : 'open ended'].filter(Boolean).join(' to ')}</Fact>
            </dl>
          </Card>

          <CandidatesPanel
            requirementId={r.requirementId}
            status={r.status}
            intro={sourcer ? 'Add people who fit and shortlist them. The manager decides who is selected.' : 'Invite shortlisted people and book interviews once they accept.'}
            can={{ shortlist: sourcer, invite: coordinator, book: coordinator, decide: false, allocate: false, withdraw: false }}
          />
        </>
      )}

      {finding && r && <FindPersonDialog requirementId={r.requirementId} onClose={() => setFinding(false)} />}
    </div>
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

/** A sourcer searches the company by name, ID or skill and adds people to the requirement as Identified. */
function FindPersonDialog({ requirementId, onClose }: { requirementId: string; onClose: () => void }) {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [skill, setSkill] = useState('')
  const [rows, setRows] = useState<EmployeeCandidateDTO[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [added, setAdded] = useState<Set<string>>(() => new Set())
  const [error, setError] = useState<string | null>(null)

  async function search() {
    setBusy('search')
    setError(null)
    try {
      const page = await managerEmployeeService.search({ q: q.trim() || undefined, skills: skill.trim() ? [skill.trim()] : undefined, size: 20 })
      setRows(page.content)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not search. Try again.'))
    } finally {
      setBusy(null)
    }
  }

  async function add(p: EmployeeCandidateDTO) {
    setBusy(p.employeeId)
    setError(null)
    try {
      await managerCandidateService.identify(requirementId, { employeeId: p.employeeId })
      setAdded((cur) => new Set(cur).add(p.employeeId))
      toast.success(`${p.name} added as Identified`, requirementId)
      dispatch(invalidateQueries('managerCandidates'))
      dispatch(invalidateQueries('associateDuties'))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not add them. Try again.'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Add a person to ${requirementId}`}
      subtitle="They join as Identified. Shortlist them once you are happy they fit."
      footer={
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name or employee ID"
            aria-label="Name or employee ID"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
          />
          <input
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="Skill"
            aria-label="Skill"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
          />
          <Button variant="primary" icon={<Search className="h-4 w-4" />} loading={busy === 'search'} onClick={() => void search()}>
            Search
          </Button>
        </div>
        {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
        {rows && rows.length === 0 && <p className="text-sm text-ink-500 dark:text-slate-400">No one matches.</p>}
        {rows && rows.length > 0 && (
          <ul className="grid max-h-80 gap-1 overflow-y-auto">
            {rows.map((p) => (
              <li key={p.employeeId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 dark:border-white/10">
                <span className="min-w-0">
                  <b className="block truncate text-sm text-ink-900 dark:text-white">{p.name}</b>
                  <small className="block truncate text-xs text-ink-500 dark:text-slate-400">
                    {[p.employeeId, p.designation, p.availabilityStatus ? humanize(p.availabilityStatus) : null].filter(Boolean).join(' · ')}
                  </small>
                </span>
                <Button variant={added.has(p.employeeId) ? 'secondary' : 'primary'} disabled={added.has(p.employeeId)} loading={busy === p.employeeId} onClick={() => void add(p)}>
                  {added.has(p.employeeId) ? 'Added' : 'Add'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
