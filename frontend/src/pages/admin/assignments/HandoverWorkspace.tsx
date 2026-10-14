import { motion } from 'motion/react'
import { ArrowRight, Check, FolderKanban, Inbox, Search, TriangleAlert, UsersRound } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import PersonPicker from '../../../components/people/PersonPicker'
import { Badge } from '../../../components/ui/Badge'
import { Button, FormError } from '../../../components/ui/form'
import { Modal } from '../../../components/ui/Overlay'
import { useQuery } from '../../../hooks/useQuery'
import {
  adminAssignmentService,
  type AssignmentPreviewDTO,
  type HandoverKind,
  type ReplacementResultDTO,
} from '../../../services/admin/assignment.service'
import type { EmployeeDTO } from '../../../services/admin/employee.service'
import { getApiErrorMessage } from '../../../services/httpClient'
import { humanize, initialsOf } from '../../../utils/format'
import { avatarGradient, employmentTone, fullName, hasRole } from '../employees/employeeUi'
import { claimBadge, statusTone } from '../projects/projectUi'

/** One thing that can move: a project (manager handover) or a person (RMG handover). */
interface Item {
  key: string
  title: string
  subtitle: string
  badges: ReactNode
  /** Ticked when the preview opens. */
  preselect: boolean
}

function itemsOf(kind: HandoverKind, p: AssignmentPreviewDTO): Item[] {
  if (kind === 'manager') {
    return [...(p.projects ?? [])]
      .sort((a, b) => Number(b.status === 'ACTIVE') - Number(a.status === 'ACTIVE') || a.projectName.localeCompare(b.projectName))
      .map((proj) => ({
        key: proj.projectId,
        title: proj.projectName,
        subtitle: [proj.projectId, proj.clientName].filter(Boolean).join(' · '),
        badges: (
          <>
            <Badge tone={statusTone(proj.status)} dot>
              {humanize(proj.status)}
            </Badge>
            {proj.status === 'ACTIVE' && <Badge tone={claimBadge(proj).tone}>{claimBadge(proj).label}</Badge>}
          </>
        ),
        // Closed projects can move too, but only active ones need a manager now.
        preselect: proj.status === 'ACTIVE',
      }))
  }
  return (p.people ?? []).map((person) => ({
    key: person.employeeId,
    title: person.name,
    subtitle: [person.employeeId, person.designation, person.grade].filter(Boolean).join(' · '),
    badges: null,
    preselect: true,
  }))
}

function Tick({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
        on ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 bg-white dark:border-white/20 dark:bg-white/5'
      }`}
    >
      {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
    </span>
  )
}

function Step({ n, title, hint, children }: { n: number; title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-white dark:bg-white dark:text-ink-900">
          {n}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink-900 dark:text-white">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-ink-500 dark:text-slate-400">{hint}</p>}
        </div>
      </div>
      <div className="sm:pl-9">{children}</div>
    </section>
  )
}

const SURFACE = 'rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-white/8 dark:bg-white/3 dark:shadow-none'

/**
 * Right column: what one person would hand over and to whom. Pick what moves (active projects / everyone is
 * pre-ticked), choose the replacement, confirm. The backend checks everything again and saves all or nothing.
 */
export default function HandoverWorkspace({
  kind,
  employeeId,
  onDone,
}: {
  kind: HandoverKind
  employeeId: string
  onDone: (result: ReplacementResultDTO, to: EmployeeDTO, from: AssignmentPreviewDTO) => void
}) {
  const query = useQuery('handoverPreview', { kind, employeeId })
  // While another person's preview loads, the store still holds the previous one: never show the wrong person.
  const preview = query.data && query.data.departingEmployeeId === employeeId ? query.data : null

  const items = useMemo(() => (preview ? itemsOf(kind, preview) : []), [kind, preview])
  const [picked, setPicked] = useState<Set<string> | null>(null)
  const selected = picked ?? new Set(items.filter((i) => i.preselect).map((i) => i.key))
  const [filter, setFilter] = useState('')
  const [replacement, setReplacement] = useState<EmployeeDTO | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const role = kind === 'manager' ? { code: 'MANAGER', label: 'Manager' } : { code: 'RMG', label: 'RMG' }
  const noun = kind === 'manager' ? ['project', 'projects'] : ['person', 'people']
  const count = (n: number) => `${n} ${n === 1 ? noun[0] : noun[1]}`

  if (query.error && !preview) {
    return (
      <div className={`${SURFACE} flex flex-col items-center gap-3 px-6 py-16 text-center`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
          <TriangleAlert className="h-5 w-5" />
        </span>
        <p className="text-base font-semibold text-ink-900 dark:text-white">Couldn’t load {employeeId}</p>
        <p className="max-w-sm text-sm text-ink-500 dark:text-slate-400">
          {query.status === 404 || /not found/i.test(query.error) ? `No one has the employee ID ${employeeId}.` : query.error}
        </p>
      </div>
    )
  }

  if (!preview) {
    return (
      <div className={`${SURFACE} space-y-4 p-6`}>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/6" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 animate-pulse rounded bg-slate-100 dark:bg-white/6" />
            <div className="h-3 w-32 animate-pulse rounded bg-slate-100 dark:bg-white/6" />
          </div>
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/6" />
        ))}
      </div>
    )
  }

  const p = preview
  const [first, ...rest] = p.departingName.split(' ')
  const visible = filter.trim()
    ? items.filter((i) => `${i.title} ${i.subtitle}`.toLowerCase().includes(filter.trim().toLowerCase()))
    : items
  const allOn = visible.length > 0 && visible.every((i) => selected.has(i.key))
  const chosen = items.filter((i) => selected.has(i.key))
  // Requirement responsibilities the departing manager holds themselves don't move with projects.
  const ownResponsibilities = (p.responsibilities ?? []).filter((r) => r.currentOwnerId === p.departingEmployeeId)

  function toggle(key: string) {
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setPicked(next)
    setError(null)
  }

  function toggleAll() {
    const next = new Set(selected)
    visible.forEach((i) => (allOn ? next.delete(i.key) : next.add(i.key)))
    setPicked(next)
    setError(null)
  }

  const blocker = (person: EmployeeDTO): string | null => {
    if (person.employeeId === p.departingEmployeeId) return `Choose someone other than ${p.departingName}.`
    if (person.employmentStatus !== 'ACTIVE') return `${fullName(person)} is inactive and can’t take over.`
    if (!hasRole(person, role.label))
      return `${fullName(person)} doesn’t have the ${role.label} role. Give it to them first (Employees → Edit), then hand over.`
    if (kind === 'rmg' && selected.has(person.employeeId))
      return `${fullName(person)} is one of the people moving — untick them first, they can’t be their own RMG.`
    return null
  }
  const ready = chosen.length > 0 && replacement !== null && blocker(replacement) === null

  async function handOver() {
    if (!replacement) return
    setSaving(true)
    setError(null)
    try {
      const keys = chosen.map((i) => i.key)
      const result =
        kind === 'manager'
          ? await adminAssignmentService.replaceManager(p.departingEmployeeId, {
              newManagerEmployeeId: replacement.employeeId,
              selectedProjectBusinessIds: keys,
            })
          : await adminAssignmentService.replaceRmg(p.departingEmployeeId, {
              newRmgEmployeeId: replacement.employeeId,
              selectedEmployeeBusinessIds: keys,
            })
      if (!result.success) throw new Error(result.error ?? 'The handover failed.')
      setConfirming(false)
      onDone(result, replacement, p)
    } catch (err) {
      setError(getApiErrorMessage(err, 'The handover failed. Nothing was changed.'))
      setConfirming(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      key={`${kind}-${p.departingEmployeeId}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${SURFACE} overflow-hidden ${query.loading ? 'opacity-80' : ''}`}
    >
      {/* Departing person */}
      <header className="flex flex-wrap items-center gap-4 border-b border-slate-100 px-6 py-5 dark:border-white/6">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ${avatarGradient(p.departingId)} text-base font-bold text-white shadow-md`}
        >
          {initialsOf(first, rest.join(' '))}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-ink-500 uppercase dark:text-slate-500">Handing over from</p>
          <h2 className="truncate text-lg font-bold text-ink-900 dark:text-white">{p.departingName}</h2>
          <p className="truncate text-xs text-ink-500 dark:text-slate-400">
            {p.departingEmployeeId}
            {p.departingRole ? ` · ${p.departingRole}` : ''}
          </p>
        </div>
        {p.departingStatus && (
          <Badge tone={employmentTone(p.departingStatus)} dot>
            {humanize(p.departingStatus)}
          </Badge>
        )}
      </header>

      <div className="space-y-7 px-6 py-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-ink-500 dark:bg-white/6 dark:text-slate-400">
              <Inbox className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-ink-900 dark:text-white">Nothing to hand over</p>
            <p className="max-w-sm text-sm text-ink-500 dark:text-slate-400">
              {kind === 'manager' ? `${p.departingName} doesn’t manage any projects.` : `No one reports to ${p.departingName}.`}
            </p>
          </div>
        ) : (
          <>
            <Step
              n={1}
              title={kind === 'manager' ? 'Projects to hand over' : 'People to move'}
              hint={
                kind === 'manager'
                  ? 'Active projects are ticked. Their requirements and teams move with them; the new manager has to claim each project.'
                  : 'Everyone still working here is ticked. Only who they report to changes.'
              }
            >
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/8">
                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-3 py-2 dark:border-white/6 dark:bg-white/2">
                  <button type="button" onClick={toggleAll} className="flex items-center gap-2.5 text-xs font-semibold text-ink-700 dark:text-slate-300">
                    <Tick on={allOn} />
                    {allOn ? 'Untick all' : 'Tick all'}
                  </button>
                  <span className="ml-auto text-xs text-ink-500 dark:text-slate-400">
                    <span className="font-semibold text-ink-900 tabular-nums dark:text-white">{chosen.length}</span> of {items.length} selected
                  </span>
                </div>
                {items.length > 8 && (
                  <div className="relative border-b border-slate-100 dark:border-white/6">
                    <Search className="pointer-events-none absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-ink-500 dark:text-slate-500" />
                    <input
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      placeholder={`Filter ${noun[1]}…`}
                      aria-label={`Filter ${noun[1]}`}
                      className="w-full bg-transparent py-2.5 pr-3 pl-9 text-sm text-ink-900 outline-none placeholder:text-ink-500/70 dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>
                )}
                <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-white/6">
                  {visible.map((item) => {
                    const on = selected.has(item.key)
                    return (
                      <li key={item.key}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={on}
                          onClick={() => toggle(item.key)}
                          className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                            on ? 'bg-brand-500/5' : 'hover:bg-slate-50 dark:hover:bg-white/3'
                          }`}
                        >
                          <Tick on={on} />
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-ink-500 dark:bg-white/6 dark:text-slate-400">
                            {kind === 'manager' ? <FolderKanban className="h-4 w-4" /> : <UsersRound className="h-4 w-4" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-ink-900 dark:text-white">{item.title}</span>
                            <span className="block truncate text-xs text-ink-500 dark:text-slate-400">{item.subtitle}</span>
                          </span>
                          {item.badges && <span className="hidden shrink-0 gap-1.5 sm:flex">{item.badges}</span>}
                        </button>
                      </li>
                    )
                  })}
                  {visible.length === 0 && (
                    <li className="px-3 py-4 text-center text-sm text-ink-500 dark:text-slate-400">No {noun[1]} match “{filter}”.</li>
                  )}
                </ul>
              </div>

              {kind === 'manager' && ownResponsibilities.length > 0 && (
                <p className="mt-3 flex gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/8 p-3 text-xs text-amber-800 dark:text-amber-200">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {p.departingName} also holds {ownResponsibilities.length} requirement{' '}
                    {ownResponsibilities.length === 1 ? 'responsibility' : 'responsibilities'} (
                    {ownResponsibilities
                      .slice(0, 3)
                      .map((r) => `${humanize(r.responsibility).toLowerCase()} on ${r.requirementTitle.split(' - ')[0]}`)
                      .join(', ')}
                    {ownResponsibilities.length > 3 ? '…' : ''}). Those don’t move with projects; the project’s manager reassigns them.
                  </span>
                </p>
              )}
            </Step>

            <Step n={2} title={`New ${role.label}`} hint={`An active person with the ${role.label} role.`}>
              <PersonPicker
                id="handover-to"
                label={`Hand over to`}
                role={role.code}
                roleLabel={role.label}
                value={replacement}
                onChange={(person) => {
                  setReplacement(person)
                  setError(null)
                }}
                blocker={blocker}
              />
            </Step>
          </>
        )}

        <FormError message={error} />
      </div>

      {items.length > 0 && (
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-white/6 dark:bg-white/2">
          <p className="flex min-w-0 items-center gap-2 text-sm text-ink-500 dark:text-slate-400">
            <span className="font-semibold text-ink-900 dark:text-white">{count(chosen.length)}</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
            <span className="truncate font-semibold text-ink-900 dark:text-white">
              {replacement && !blocker(replacement) ? fullName(replacement) : `choose ${kind === 'rmg' ? 'an' : 'a'} ${role.label}`}
            </span>
          </p>
          <Button variant="primary" disabled={!ready} onClick={() => setConfirming(true)}>
            Hand over
          </Button>
        </footer>
      )}

      <Modal
        open={confirming && replacement !== null}
        onClose={() => !saving && setConfirming(false)}
        title="Confirm handover"
        subtitle={replacement ? `${p.departingName} → ${fullName(replacement)}` : undefined}
        footer={
          <>
            <Button variant="secondary" disabled={saving} onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={saving} onClick={() => void handOver()}>
              Hand over {count(chosen.length)}
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-ink-700 dark:text-slate-300">
          <p>
            {kind === 'manager' ? (
              <>
                <b className="text-ink-900 dark:text-white">{replacement && fullName(replacement)}</b> becomes the manager of these{' '}
                {count(chosen.length)} and gets a notification to claim each one.
              </>
            ) : (
              <>
                These {count(chosen.length)} will report to{' '}
                <b className="text-ink-900 dark:text-white">{replacement && fullName(replacement)}</b> instead of {p.departingName}.
              </>
            )}
          </p>
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-2xl border border-slate-200/80 p-2 dark:border-white/8">
            {chosen.map((i) => (
              <li key={i.key} className="truncate px-2 py-1 text-xs">
                <span className="font-medium text-ink-900 dark:text-white">{i.title}</span>{' '}
                <span className="text-ink-500 dark:text-slate-400">{i.key}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-500 dark:text-slate-400">Every change is written to the audit log. It all saves together, or nothing does.</p>
        </div>
      </Modal>
    </motion.div>
  )
}
