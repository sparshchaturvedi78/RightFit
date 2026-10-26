import { ClipboardList } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../components/dashboard/Panel'
import { Button, Input, Textarea } from '../../components/ui/form'
import { Modal } from '../../components/ui/Overlay'
import RefreshButton from '../../components/ui/RefreshButton'
import { SearchInput } from '../../components/ui/SearchInput'
import { useQuery } from '../../hooks/useQuery'
import { useToast } from '../../hooks/useToast'
import { getApiErrorMessage } from '../../services/httpClient'
import { trainingService, type TrainingAssignmentDTO, type TrainingProgramDTO } from '../../services/rmg/training.service'
import { useAppDispatch } from '../../store'
import { invalidateQueries } from '../../store/queriesSlice'
import { humanize } from '../../utils/format'
import { formatDay } from '../admin/employees/employeeUi'
import PageHeader from '../associate/PageHeader'
import { Card, OpenChevron, Row, Tag, Who } from './rmgUi'

/** "3 of 10 seats", or "No limit" for programs created before seats were set. */
function seatsLabel(p: TrainingProgramDTO): string {
  return p.maxParticipants == null ? 'No limit' : `${p.seatsTaken ?? 0} of ${p.maxParticipants} seats`
}

/** Seats still free on a program; Infinity when it has no limit. */
function seatsLeft(p: TrainingProgramDTO): number {
  return p.maxParticipants == null ? Infinity : p.maxParticipants - (p.seatsTaken ?? 0)
}

type Tab = 'programs' | 'assignments' | 'interest'
const TABS: { value: Tab; label: string }[] = [
  { value: 'programs', label: 'Programs' },
  { value: 'assignments', label: 'Assignments' },
  { value: 'interest', label: 'Interest requests' },
]

/** Training programs the bench and pool can join. Assign people, or decide on the interest they ask for. */
export default function TrainingProgramsPage() {
  const programs = useQuery('rmgTrainingPrograms', {})
  const assignments = useQuery('rmgTrainingAssignments', {})
  const [tab, setTab] = useState<Tab>('programs')
  const [creating, setCreating] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)

  const all = programs.data ?? []
  const interest = (assignments.data ?? []).filter((a) => a.assignmentStatus === 'REQUESTED')
  const selected = all.find((p) => p.programId === picked) ?? all[0]

  function refreshAll() {
    programs.refresh()
    assignments.refresh()
  }

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <PageHeader
        eyebrow="Learning · Training"
        title="Training programs"
        sub="Programs that bench and pool people can join. Assign people, or decide on the interest they ask for."
        actions={
          <>
            <div role="tablist" className="inline-flex gap-1 rounded-2xl border border-slate-200/80 bg-white p-1 dark:border-white/10 dark:bg-white/3">
              {TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.value}
                  onClick={() => setTab(t.value)}
                  className={`rounded-xl px-3 py-1.5 text-[13px] font-semibold ${tab === t.value ? 'bg-brand-500/14 text-brand-700 dark:text-brand-300' : 'text-ink-500 dark:text-slate-400'}`}
                >
                  {t.label}
                  {t.value === 'interest' && interest.length > 0 ? ` ${interest.length}` : ''}
                </button>
              ))}
            </div>
            <RefreshButton onClick={refreshAll} loading={programs.loading} />
            <Button variant="primary" onClick={() => setCreating(true)}>
              New program
            </Button>
          </>
        }
      />

      {programs.error && !programs.data ? (
        <div className={`${TILE_SURFACE} p-5`}>
          <PanelError message={programs.error} status={programs.status} onRetry={programs.refresh} />
        </div>
      ) : !programs.data ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : tab === 'programs' ? (
        all.length === 0 ? (
          <div className={`${TILE_SURFACE} px-6 py-12`}>
            <EmptyState icon={<ClipboardList className="h-5 w-5" />}>No training programs yet. Create the first one.</EmptyState>
          </div>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-5">
            <section className={`${TILE_SURFACE} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-175 border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-bold tracking-widest text-ink-500 uppercase dark:text-slate-400">
                      <th className="px-4 py-3">Program</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Length</th>
                      <th className="px-4 py-3">Cost</th>
                      <th className="px-4 py-3">Seats</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="w-8 px-2 py-3" aria-hidden />
                    </tr>
                  </thead>
                  <tbody>
                    {all.map((p) => {
                      const on = p.programId === selected?.programId
                      const ring = on ? 'shadow-[inset_0_1.5px_0_var(--color-brand-500),inset_0_-1.5px_0_var(--color-brand-500)]' : ''
                      const cell = `border-b border-slate-100 px-4 py-3 align-middle dark:border-white/6 ${ring}`
                      return (
                        <tr key={p.programId} onClick={() => setPicked(p.programId)} aria-selected={on} className="group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/3">
                          <td className={cell}>
                            <b className="block font-semibold text-ink-900 dark:text-white">{p.programName}</b>
                            <small className="text-xs text-ink-500 dark:text-slate-400">{p.provider ? `Provider: ${p.provider}` : 'No provider'}</small>
                          </td>
                          <td className={cell}>{p.trainingType ? humanize(p.trainingType) : '—'}</td>
                          <td className={cell}>{p.durationDays ? `${p.durationDays} days` : '—'}</td>
                          <td className={cell}>{p.cost ? `₹${p.cost.toLocaleString('en-IN')}` : 'Free'}</td>
                          <td className={cell}>
                            <span className="whitespace-nowrap">{seatsLabel(p)}</span>
                          </td>
                          <td className={cell}>{p.isActive ? <Tag tone="ok">Active</Tag> : <Tag>Retired</Tag>}</td>
                          <td className={`${cell} px-2`}>
                            <OpenChevron />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
            {selected && <ProgramPanel program={selected} assignments={assignments.data ?? []} onChanged={refreshAll} />}
          </div>
        )
      ) : tab === 'assignments' ? (
        <AssignmentsTable rows={assignments.data ?? []} empty="Nobody is assigned to a program yet." />
      ) : (
        <InterestList rows={interest} onChanged={refreshAll} />
      )}

      {creating && <CreateProgramDialog onClose={() => setCreating(false)} onCreated={refreshAll} />}
    </div>
  )
}

function AssignmentsTable({ rows, empty }: { rows: TrainingAssignmentDTO[]; empty: string }) {
  if (rows.length === 0) {
    return (
      <div className={`${TILE_SURFACE} px-6 py-12`}>
        <EmptyState icon={<ClipboardList className="h-5 w-5" />}>{empty}</EmptyState>
      </div>
    )
  }
  return (
    <section className={`${TILE_SURFACE} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-175 border-collapse text-sm">
          <thead>
            <tr className="text-left text-[11px] font-bold tracking-widest text-ink-500 uppercase dark:text-slate-400">
              <th className="px-4 py-3">Person</th>
              <th className="px-4 py-3">Program</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Expected end</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.assignmentId}>
                <td className="border-b border-slate-100 px-4 py-3 dark:border-white/6">
                  <Who name={a.employeeName ?? a.employeeId} detail={a.employeeId} />
                </td>
                <td className="border-b border-slate-100 px-4 py-3 dark:border-white/6">{a.programName ?? a.programId}</td>
                <td className="border-b border-slate-100 px-4 py-3 dark:border-white/6">
                  <Tag tone={a.assignmentStatus === 'COMPLETED' ? 'ok' : a.assignmentStatus === 'REQUESTED' ? 'warn' : 'muted'}>{humanize(a.assignmentStatus)}</Tag>
                </td>
                <td className="border-b border-slate-100 px-4 py-3 dark:border-white/6">{a.expectedEndDate ? formatDay(a.expectedEndDate) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/** Interest requests: approve, or decline with a reason the associate can read. */
function InterestList({ rows, onChanged }: { rows: TrainingAssignmentDTO[]; onChanged: () => void }) {
  const [declining, setDeclining] = useState<TrainingAssignmentDTO | null>(null)
  const dispatch = useAppDispatch()
  const toast = useToast()
  const [busy, setBusy] = useState<string | null>(null)

  async function approve(a: TrainingAssignmentDTO) {
    setBusy(a.assignmentId)
    try {
      await trainingService.decideInterest(a.assignmentId, { approve: true })
      toast.success('Approved', `${a.employeeName ?? a.employeeId} joins ${a.programName ?? 'the program'}`)
      dispatch(invalidateQueries('rmgTrainingAssignments'))
      onChanged()
    } catch (err) {
      toast.error('Could not approve', getApiErrorMessage(err, 'Try again.'))
    } finally {
      setBusy(null)
    }
  }

  if (rows.length === 0) {
    return (
      <div className={`${TILE_SURFACE} px-6 py-12`}>
        <EmptyState icon={<ClipboardList className="h-5 w-5" />}>No one has asked to join a program.</EmptyState>
      </div>
    )
  }
  return (
    <>
      <Card title="Waiting for a decision" note={`${rows.length}`}>
        {rows.map((a) => (
          <Row
            key={a.assignmentId}
            title={<Who name={a.employeeName ?? a.employeeId} detail={a.programName} />}
            aside={
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setDeclining(a)} disabled={busy === a.assignmentId}>
                  Decline
                </Button>
                <Button variant="primary" onClick={() => void approve(a)} loading={busy === a.assignmentId}>
                  Approve
                </Button>
              </div>
            }
          />
        ))}
      </Card>
      {declining && <DeclineDialog assignment={declining} onClose={() => setDeclining(null)} onDone={onChanged} />}
    </>
  )
}

function DeclineDialog({ assignment: a, onClose, onDone }: { assignment: TrainingAssignmentDTO; onClose: () => void; onDone: () => void }) {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function decline() {
    if (!comment.trim()) {
      setError('Add a reason so the associate knows why.')
      return
    }
    setBusy(true)
    try {
      await trainingService.decideInterest(a.assignmentId, { approve: false, comment: comment.trim() })
      toast.success('Declined', a.employeeName ?? a.employeeId)
      dispatch(invalidateQueries('rmgTrainingAssignments'))
      onDone()
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not decline. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={busy ? () => undefined : onClose}
      title={`Decline ${a.employeeName ?? a.employeeId}?`}
      subtitle="A short reason helps the associate."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => void decline()} loading={busy}>
            Decline
          </Button>
        </>
      }
    >
      <Labeled label="Reason">
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
      </Labeled>
      {error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </Modal>
  )
}

/** One program: its facts, who is on it, and the actions RMG can take. */
function ProgramPanel({ program: p, assignments, onChanged }: { program: TrainingProgramDTO; assignments: TrainingAssignmentDTO[]; onChanged: () => void }) {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const [assigning, setAssigning] = useState(false)
  const [busy, setBusy] = useState(false)
  const onProgram = assignments.filter((a) => a.programId === p.programId && a.assignmentStatus !== 'REQUESTED')

  async function retire() {
    setBusy(true)
    try {
      await trainingService.retireProgram(p.programId)
      toast.success('Program retired', p.programName)
      dispatch(invalidateQueries('rmgTrainingPrograms'))
      onChanged()
    } catch (err) {
      toast.error('Could not retire', getApiErrorMessage(err, 'Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className={`${TILE_SURFACE} grid content-start gap-4 p-5`}>
      <h2 className="text-base font-semibold text-ink-900 dark:text-white">{p.programName}</h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <Fact label="Type">{p.trainingType ? humanize(p.trainingType) : undefined}</Fact>
        <Fact label="Length">{p.durationDays ? `${p.durationDays} days` : undefined}</Fact>
        <Fact label="Provider">{p.provider}</Fact>
        <Fact label="Cost">{p.cost ? `₹${p.cost.toLocaleString('en-IN')}` : 'Free'}</Fact>
        <Fact label="Seats">{seatsLabel(p)}</Fact>
        <Fact label="Seats left">{p.maxParticipants == null ? 'Unlimited' : `${Math.max(0, seatsLeft(p))}`}</Fact>
      </dl>
      {p.description && <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-ink-700 dark:bg-white/4 dark:text-slate-300">{p.description}</p>}
      {p.requiredCertifications && <p className="text-xs text-ink-500 dark:text-slate-400">Needs: {p.requiredCertifications}</p>}

      <Card title="On this program" note={`${onProgram.length}`}>
        {onProgram.length === 0 ? (
          <p className="text-sm text-ink-500 dark:text-slate-400">Nobody is assigned yet.</p>
        ) : (
          onProgram.map((a) => (
            <Row
              key={a.assignmentId}
              title={<Who name={a.employeeName ?? a.employeeId} detail={a.expectedEndDate ? `Expected end ${formatDay(a.expectedEndDate)}` : undefined} />}
              aside={<Tag tone={a.assignmentStatus === 'COMPLETED' ? 'ok' : 'muted'}>{humanize(a.assignmentStatus)}</Tag>}
            />
          ))
        )}
      </Card>

      <div className="flex flex-wrap gap-2">
        {p.isActive && (
          <Button variant="primary" onClick={() => setAssigning(true)}>
            Assign people
          </Button>
        )}
        {p.isActive && (
          <Button variant="danger" onClick={() => void retire()} loading={busy}>
            Retire
          </Button>
        )}
      </div>

      {assigning && <AssignDialog program={p} onClose={() => setAssigning(false)} onDone={onChanged} />}
    </aside>
  )
}

function Fact({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold tracking-widest text-ink-500 uppercase dark:text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-semibold text-ink-900 dark:text-white">{children || '—'}</dd>
    </div>
  )
}

/** A label around a field, the same look as the form fields elsewhere. */
function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-semibold text-ink-900 dark:text-white">{label}</span>
      {children}
    </label>
  )
}

/** Pick people from the pool to put on a program. */
function AssignDialog({ program: p, onClose, onDone }: { program: TrainingProgramDTO; onClose: () => void; onDone: () => void }) {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [chosen, setChosen] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pool = useQuery('rmgPool', { q, grade: '', page: 0 })

  const left = seatsLeft(p)

  function toggle(id: string) {
    if (!chosen.includes(id) && chosen.length >= left) return
    setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
  }

  async function assign() {
    if (chosen.length === 0) {
      setError('Pick at least one person.')
      return
    }
    setBusy(true)
    try {
      await trainingService.assign(p.programId, { employeeIds: chosen })
      toast.success('Assigned', `${chosen.length} ${chosen.length === 1 ? 'person' : 'people'} on ${p.programName}`)
      dispatch(invalidateQueries('rmgTrainingAssignments'))
      onDone()
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not assign. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={busy ? () => undefined : onClose}
      title={`Assign people to ${p.programName}`}
      subtitle="Pick from the resource pool."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void assign()} loading={busy} disabled={chosen.length === 0 || chosen.length > left}>
            Assign {chosen.length || ''}
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <SearchInput value={q} onSearch={setQ} placeholder="Search name or ID…" />
        <p className="text-xs text-ink-500 dark:text-slate-400">{left === Infinity ? 'No seat limit on this program.' : `${Math.max(0, left)} seat${left === 1 ? '' : 's'} left. You can't pick more than that.`}</p>
        <div className="grid max-h-80 gap-1 overflow-y-auto">
          {(pool.data?.content ?? []).map((person) => (
            <label key={person.employeeId} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-slate-50 dark:hover:bg-white/5">
              <Who name={person.name} detail={[person.employeeId, person.designation].filter(Boolean).join(' · ')} />
              <input
                type="checkbox"
                checked={chosen.includes(person.employeeId)}
                disabled={!chosen.includes(person.employeeId) && chosen.length >= left}
                onChange={() => toggle(person.employeeId)}
                className="h-4 w-4 accent-brand-600"
              />
            </label>
          ))}
        </div>
        {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    </Modal>
  )
}

/** A new program: what it is, how long, who provides it, and what it costs. */
function CreateProgramDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const [form, setForm] = useState({ programName: '', description: '', trainingType: '', durationDays: '', provider: '', cost: '', requiredCertifications: '', maxParticipants: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function create() {
    if (!form.programName.trim()) {
      setError('Give the program a name.')
      return
    }
    if (!form.maxParticipants || Number(form.maxParticipants) < 1 || !Number.isInteger(Number(form.maxParticipants))) {
      setError('Say how many people the program can take (a whole number, at least 1).')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await trainingService.createProgram({
        programName: form.programName.trim(),
        description: form.description.trim() || undefined,
        trainingType: form.trainingType.trim() || undefined,
        durationDays: form.durationDays ? Number(form.durationDays) : undefined,
        provider: form.provider.trim() || undefined,
        cost: form.cost ? Number(form.cost) : undefined,
        requiredCertifications: form.requiredCertifications.trim() || undefined,
        maxParticipants: Number(form.maxParticipants),
      })
      toast.success('Program created', form.programName.trim())
      dispatch(invalidateQueries('rmgTrainingPrograms'))
      onCreated()
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create the program. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={busy ? () => undefined : onClose}
      title="New training program"
      subtitle="Associates in the pool and on the bench can ask to join."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void create()} loading={busy}>
            Create program
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Labeled label="Name">
          <Input value={form.programName} onChange={set('programName')} />
        </Labeled>
        <Labeled label="Description">
          <Textarea value={form.description} onChange={set('description')} rows={2} />
        </Labeled>
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="Type">
            <Input value={form.trainingType} onChange={set('trainingType')} />
          </Labeled>
          <Labeled label="Length (days)">
            <Input type="number" min={0} value={form.durationDays} onChange={set('durationDays')} />
          </Labeled>
          <Labeled label="Provider">
            <Input value={form.provider} onChange={set('provider')} />
          </Labeled>
          <Labeled label="Cost">
            <Input type="number" min={0} value={form.cost} onChange={set('cost')} />
          </Labeled>
        </div>
        <Labeled label="Seats (how many people it can take)">
          <Input type="number" min={1} step={1} required value={form.maxParticipants} onChange={set('maxParticipants')} />
        </Labeled>
        <Labeled label="Required certifications">
          <Input value={form.requiredCertifications} onChange={set('requiredCertifications')} />
        </Labeled>
        {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    </Modal>
  )
}
