import { ClipboardList } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../components/dashboard/Panel'
import { Button } from '../../components/ui/form'
import { Dropdown } from '../../components/ui/Dropdown'
import RefreshButton from '../../components/ui/RefreshButton'
import { SearchInput } from '../../components/ui/SearchInput'
import { useQuery } from '../../hooks/useQuery'
import { useToast } from '../../hooks/useToast'
import { getApiErrorMessage } from '../../services/httpClient'
import type { PoolEntryDTO } from '../../services/rmg/pool.service'
import { rmgRecommendationService, type OpenRequirementDTO } from '../../services/rmg/recommendation.service'
import { useAppDispatch } from '../../store'
import { invalidateQueries } from '../../store/queriesSlice'
import { humanize } from '../../utils/format'
import PageHeader from '../associate/PageHeader'
import { journeyFor } from './journey'
import { shortDate } from './format'
import { Card, CloseButton, Journey, Loading, OpenChevron, Strip, Tag, Who } from './rmgUi'

const GRADES = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'].map((g) => ({ value: g, label: g }))

/**
 * Pick an open requirement, then recommend people from the pool. Anyone already in the requirement's pipeline is
 * left out of its list, so a recommended, shortlisted or selected person disappears from it (they still show for
 * other requirements).
 */
export default function RecommendationsPage() {
  const requirements = useQuery('rmgOpenRequirements', {})
  const [picked, setPicked] = useState<string | null>(null)
  const [priority, setPriority] = useState('')
  const [project, setProject] = useState('')

  const reqs = useMemo(() => requirements.data ?? [], [requirements.data])
  const priorities = useMemo(() => [...new Set(reqs.map((r) => r.priority).filter(Boolean) as string[])].sort(), [reqs])
  const projects = useMemo(() => [...new Set(reqs.map((r) => r.projectName))].sort(), [reqs])
  const filtered = reqs.filter((r) => (!priority || r.priority === priority) && (!project || r.projectName === project))
  const requirement = filtered.find((r) => r.requirementId === picked) ?? filtered[0]

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <PageHeader
        eyebrow="Hiring · Recommendations"
        title="Candidate recommendations"
        sub="Pick an open requirement, then recommend people from the pool. A recommended person goes to the manager's shortlist for review."
        actions={<RefreshButton onClick={requirements.refresh} loading={requirements.loading} />}
      />

      {requirements.error && !requirements.data ? (
        <div className={`${TILE_SURFACE} p-5`}>
          <PanelError message={requirements.error} status={requirements.status} onRetry={requirements.refresh} />
        </div>
      ) : !requirements.data ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : reqs.length === 0 ? (
        <div className={`${TILE_SURFACE} px-6 py-12`}>
          <EmptyState icon={<ClipboardList className="h-5 w-5" />}>No requirement is open for recommendations.</EmptyState>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-96 flex-1">
              <Dropdown
                ariaLabel="Requirement"
                searchable
                placeholder="Search a requirement…"
                emptyText="No requirement matches"
                value={requirement?.requirementId ?? ''}
                onChange={(v) => setPicked(v)}
                options={filtered.map((r) => ({ value: r.requirementId, label: `${r.requirementId} · ${r.positionTitle} · ${r.projectName}` }))}
              />
            </div>
            <div className="w-44">
              <Dropdown
                ariaLabel="Priority"
                value={priority}
                onChange={(v) => {
                  setPriority(v)
                  setPicked(null)
                }}
                options={[{ value: '', label: 'All priorities' }, ...priorities.map((p) => ({ value: p, label: humanize(p) }))]}
              />
            </div>
            <div className="w-52">
              <Dropdown
                ariaLabel="Project"
                value={project}
                onChange={(v) => {
                  setProject(v)
                  setPicked(null)
                }}
                options={[{ value: '', label: 'All projects' }, ...projects.map((p) => ({ value: p, label: p }))]}
              />
            </div>
          </div>

          {requirement ? (
            <>
              <Strip
                cells={[
                  { label: 'Skills needed', value: requirement.requiredSkills || '—' },
                  { label: 'Priority', value: requirement.priority ? humanize(requirement.priority) : '—' },
                  {
                    label: 'Experience',
                    value: requirement.minExperience != null || requirement.maxExperience != null ? `${requirement.minExperience ?? 0} to ${requirement.maxExperience ?? '—'} years` : '—',
                  },
                  { label: 'Allocation starts', value: shortDate(requirement.allocationStartDate) ?? 'Not set' },
                ]}
              />
              <Candidates key={requirement.requirementId} requirement={requirement} />
            </>
          ) : (
            <div className={`${TILE_SURFACE} px-6 py-12`}>
              <EmptyState icon={<ClipboardList className="h-5 w-5" />}>No requirement matches these filters.</EmptyState>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/** The people who can be recommended to one requirement, with filters, and the details of the one picked. */
function Candidates({ requirement }: { requirement: OpenRequirementDTO }) {
  const [q, setQ] = useState('')
  const [grade, setGrade] = useState('')
  const [location, setLocation] = useState('')
  const [who, setWho] = useState<string | null>(null)
  const candidates = useQuery('rmgPoolCandidates', { requirementId: requirement.requirementId, q, grade })

  const list = useMemo(() => candidates.data ?? [], [candidates.data])
  const locations = useMemo(() => [...new Set(list.map((p) => p.locationName).filter(Boolean) as string[])].sort(), [list])
  const shown = list.filter((p) => !location || p.locationName === location)
  const open = who && shown.some((p) => p.employeeId === who) ? who : null
  const person = shown.find((p) => p.employeeId === open)

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-64 flex-1">
          <SearchInput value={q} onSearch={setQ} placeholder="Search name or ID…" />
        </div>
        <div className="w-44">
          <Dropdown ariaLabel="Grade" value={grade} onChange={setGrade} options={[{ value: '', label: 'All grades' }, ...GRADES]} />
        </div>
        <div className="w-48">
          <Dropdown ariaLabel="Location" value={location} onChange={setLocation} options={[{ value: '', label: 'All locations' }, ...locations.map((l) => ({ value: l, label: l }))]} />
        </div>
      </div>

      <div className={`grid items-start gap-4 lg:gap-5 ${person ? 'lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]' : ''}`}>
        <Card title="People from the pool" note={`${shown.length}`} action={candidates.loading ? <Loading /> : undefined}>
          {!candidates.data ? (
            <Skeleton className="h-48 rounded-2xl" />
          ) : candidates.error && !candidates.data ? (
            <PanelError message={candidates.error} status={candidates.status} onRetry={candidates.refresh} />
          ) : shown.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-500 dark:text-slate-400">Nobody who can be recommended matches these filters.</p>
          ) : (
            shown.map((p) => (
              <CandidateRow key={p.employeeId} person={p} requirementId={requirement.requirementId} on={p.employeeId === open} onPick={() => setWho(p.employeeId)} />
            ))
          )}
        </Card>

        {person && <RecommendPanel key={person.employeeId} person={person} requirementId={requirement.requirementId} onClose={() => setWho(null)} />}
      </div>
    </>
  )
}

/** Recommends a person to the requirement, then drops them from its list. */
function useRecommend(requirementId: string) {
  const dispatch = useAppDispatch()
  const toast = useToast()
  return async (person: PoolEntryDTO, notes?: string) => {
    await rmgRecommendationService.recommend(requirementId, { employeeId: person.employeeId, notes })
    toast.success('Recommended', `${person.name} goes to the manager for review`)
    dispatch(invalidateQueries('rmgPoolCandidates'))
  }
}

function CandidateRow({ person: p, requirementId, on, onPick }: { person: PoolEntryDTO; requirementId: string; on: boolean; onPick: () => void }) {
  const bench = useQuery('rmgBench', { benchStatus: '' })
  const benchEntry = (bench.data ?? []).find((b) => b.employeeId === p.employeeId)
  const recommend = useRecommend(requirementId)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send() {
    setBusy(true)
    setError(null)
    try {
      await recommend(p)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not recommend. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onPick()
      }}
      className={`group flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-2xl px-3 py-3 hover:bg-slate-50 dark:hover:bg-white/3 ${on ? 'shadow-[inset_0_0_0_1.5px_var(--color-brand-500)]' : ''}`}
    >
      <Who name={p.name} detail={[p.employeeId, p.designation, p.grade, p.locationName].filter(Boolean).join(' · ')} />
      <div className="flex flex-wrap items-center gap-2">
        {benchEntry ? <Tag tone={benchEntry.benchStatus === 'GREEN' ? 'ok' : 'muted'}>{`Bench ${benchEntry.daysOnBench} days`}</Tag> : <Tag>In pool</Tag>}
        <Button
          variant="primary"
          className="px-3 py-1.5 text-xs"
          onClick={(e) => {
            e.stopPropagation()
            void send()
          }}
          loading={busy}
        >
          Recommend
        </Button>
        <OpenChevron />
      </div>
      {error && <p className="w-full text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  )
}

/** The person's latest selection and a note for the manager, with the same recommend action. */
function RecommendPanel({ person, requirementId, onClose }: { person: PoolEntryDTO; requirementId: string; onClose: () => void }) {
  const selections = useQuery('rmgSelections', { employeeId: person.employeeId })
  const recommend = useRecommend(requirementId)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const latest = selections.data?.[0]

  async function send() {
    setBusy(true)
    setError(null)
    try {
      await recommend(person, notes.trim() || undefined)
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not recommend. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className={`${TILE_SURFACE} grid content-start gap-4 p-5`}>
      <div className="flex items-start justify-between gap-3">
        <Who name={person.name} detail={[person.employeeId, person.designation].filter(Boolean).join(' · ')} />
        <CloseButton onClick={onClose} />
      </div>
      <Card title="Selection journey" action={selections.loading ? <Loading /> : latest ? <span className="text-xs text-ink-500 dark:text-slate-400">{latest.requirementId}</span> : undefined}>
        {!selections.data ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : !latest ? (
          <p className="text-sm text-ink-500 dark:text-slate-400">No selections yet.</p>
        ) : (
          <>
            <p className="text-sm text-ink-700 dark:text-slate-300">
              {latest.positionTitle} · {latest.projectName}
            </p>
            <Journey steps={journeyFor(latest)} />
          </>
        )}
      </Card>
      <label className="grid gap-1.5 text-sm">
        <span className="font-semibold text-ink-900 dark:text-white">Note for the manager (optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
        />
      </label>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => void send()} loading={busy}>
          Recommend
        </Button>
      </div>
    </aside>
  )
}
