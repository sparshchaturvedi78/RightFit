import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState, Skeleton } from '../../../components/dashboard/Panel'
import { Button } from '../../../components/ui/form'
import { Modal } from '../../../components/ui/Overlay'
import { useToast } from '../../../hooks/useToast'
import { getApiErrorMessage } from '../../../services/httpClient'
import { managerCandidateService } from '../../../services/manager/candidate.service'
import { associateWorkService } from '../../../services/associate/work.service'
import { managerRequirementService } from '../../../services/manager/requirement.service'
import { useAppDispatch } from '../../../store'
import { invalidateQueries } from '../../../store/queriesSlice'
import { PRIORITY_TAG } from '../managerUi'

/**
 * Pick one of the manager's live (published) requirements and add the person to it as Identified.
 * Mounted only while a person is chosen, so each open starts with a clean list.
 */
/** What the dialog needs to show one requirement a person can be added to. */
interface Choice {
  requirementId: string
  positionTitle: string
  projectName?: string
  projectId?: string
  priority?: string
}

/**
 * `manager`: the manager's own live requirements. `sourcer`: the live requirements the signed-in associate sources for.
 */
export default function AddToRequirementDialog({
  source = 'manager',
  person,
  onClose,
}: {
  source?: 'manager' | 'sourcer'
  person: { employeeId: string; name: string }
  onClose: () => void
}) {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const [items, setItems] = useState<Choice[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [added, setAdded] = useState<Set<string>>(() => new Set())
  const [rowError, setRowError] = useState<Record<string, string>>({})

  useEffect(() => {
    let live = true
    const load: Promise<Choice[]> =
      source === 'sourcer'
        ? associateWorkService.duties().then((duties) =>
            duties
              .filter((d) => d.responsibility === 'SOURCER' && d.requirementStatus === 'PUBLISHED')
              .map((d) => ({ requirementId: d.requirementId, positionTitle: d.positionTitle, projectName: d.projectName })),
          )
        : managerRequirementService
            .list({ status: 'PUBLISHED', size: 100, sortBy: 'requirementId', sortDirection: 'ASC' })
            .then((page) => page.content)
    load
      .then((rows) => {
        if (live) setItems(rows)
      })
      .catch((err) => {
        if (live) setLoadError(getApiErrorMessage(err, 'Could not load requirements.'))
      })
    return () => {
      live = false
    }
  }, [source])

  const text = query.trim().toLowerCase()
  const shown = (items ?? []).filter(
    (r) => !text || [r.requirementId, r.positionTitle, r.projectName].some((v) => v?.toLowerCase().includes(text)),
  )

  async function add(r: Choice) {
    setBusyId(r.requirementId)
    setRowError((cur) => ({ ...cur, [r.requirementId]: '' }))
    try {
      await managerCandidateService.identify(r.requirementId, { employeeId: person.employeeId })
      setAdded((cur) => new Set(cur).add(r.requirementId))
      toast.success(`${person.name} added as Identified`, `${r.requirementId} · ${r.positionTitle}`)
      dispatch(invalidateQueries('managerCandidates'))
      dispatch(invalidateQueries('managerRequirementCard'))
      dispatch(invalidateQueries('managerDirectory'))
    } catch (err) {
      setRowError((cur) => ({ ...cur, [r.requirementId]: getApiErrorMessage(err, 'Could not add them. Try again.') }))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Add ${person.name} to a requirement`}
      subtitle="Only live (published) requirements are listed. They start as Identified."
      footer={
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="grid gap-4">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
          <Search className="h-4 w-4 shrink-0 text-ink-500 dark:text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by requirement, role or project"
            aria-label="Search requirements"
            className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-ink-500/60 dark:placeholder:text-slate-500"
          />
        </label>

        {loadError ? (
          <p className="rounded-2xl bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">{loadError}</p>
        ) : !items ? (
          <div className="grid gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <EmptyState icon={<Search className="h-5 w-5" />}>{items.length === 0 ? 'You have no live requirements. Publish one first.' : 'No requirement matches that search.'}</EmptyState>
        ) : (
          <ul className="grid gap-2" aria-label="Live requirements">
            {shown.map((r) => {
              const done = added.has(r.requirementId)
              return (
                <li key={r.requirementId} className="grid gap-2 rounded-2xl border border-slate-200 p-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center dark:border-white/10">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-900 dark:text-white">
                      <span className="truncate">
                        {r.requirementId} · {r.positionTitle}
                      </span>
                      {r.priority && PRIORITY_TAG[r.priority] && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${PRIORITY_TAG[r.priority]}`}>{r.priority}</span>
                      )}
                    </p>
                    <p className="truncate text-xs text-ink-500 dark:text-slate-400">{r.projectName ?? r.projectId}</p>
                    {rowError[r.requirementId] && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{rowError[r.requirementId]}</p>}
                  </div>
                  <Button variant={done ? 'secondary' : 'primary'} disabled={done} loading={busyId === r.requirementId} onClick={() => void add(r)}>
                    {done ? 'Added' : 'Add as Identified'}
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Modal>
  )
}
