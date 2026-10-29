import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeftRight, CircleCheck, FolderKanban, RefreshCw, UsersRound, X } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../../../components/ui/form'
import { useQuery } from '../../../hooks/useQuery'
import type { AssignmentPreviewDTO, HandoverKind, ReplacementResultDTO } from '../../../services/admin/assignment.service'
import type { EmployeeDTO } from '../../../services/admin/employee.service'
import { useAppDispatch } from '../../../store'
import { invalidateQueries } from '../../../store/queriesSlice'
import type { ResourceKey } from '../../../store/resourceRegistry'
import { loadResource } from '../../../store/resourcesSlice'
import { fullName } from '../employees/employeeUi'
import HandoverQueue from './HandoverQueue'
import HandoverWorkspace from './HandoverWorkspace'

/** Cached dashboard numbers that a handover changes. */
const STALE_AFTER_CHANGE: ResourceKey[] = ['admin/dashboard', 'admin/rmg-roster', 'admin/recent-activity']
/** Every stored list that shows a project's manager or someone's RMG. */
const STALE_QUERIES = ['pendingHandovers', 'handoverPreview', 'projects', 'projectTeam', 'employees', 'employeeProjects', 'rmgs', 'rmgTeam'] as const

const TABS: { kind: HandoverKind; label: string; icon: typeof FolderKanban }[] = [
  { kind: 'manager', label: 'Manager handover', icon: FolderKanban },
  { kind: 'rmg', label: 'RMG handover', icon: UsersRound },
]

export default function AssignmentsPage() {
  const dispatch = useAppDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const kind: HandoverKind = searchParams.get('type') === 'rmg' ? 'rmg' : 'manager'
  const who = (searchParams.get('who') ?? '').toUpperCase()
  const [done, setDone] = useState<{ text: string } | null>(null)
  // Bumped after a handover so the workspace starts fresh (selection and picker reset) on the reloaded preview.
  const [round, setRound] = useState(0)

  const pending = useQuery('pendingHandovers', {})
  const queue = pending.data ? (kind === 'manager' ? pending.data.managers : pending.data.rmgs) : null

  function go(patch: { type?: HandoverKind; who?: string }) {
    const next = new URLSearchParams()
    const type = patch.type ?? kind
    if (type === 'rmg') next.set('type', 'rmg')
    const person = 'who' in patch ? patch.who : patch.type && patch.type !== kind ? '' : who
    if (person) next.set('who', person)
    setSearchParams(next, { replace: true })
    setDone(null)
  }

  function refreshAll() {
    STALE_QUERIES.forEach((n) => dispatch(invalidateQueries(n)))
    STALE_AFTER_CHANGE.forEach((key) => void dispatch(loadResource({ key, force: true })))
  }

  function onDone(result: ReplacementResultDTO, to: EmployeeDTO, from: AssignmentPreviewDTO) {
    const c = result.affectedCounts ?? {}
    const text =
      kind === 'manager'
        ? `${c.projects ?? 0} project${c.projects === 1 ? '' : 's'} moved from ${from.departingName} to ${fullName(to)}` +
          (c.requirementsUnderNewManager ? `, with ${c.requirementsUnderNewManager} requirement${c.requirementsUnderNewManager === 1 ? '' : 's'}` : '') +
          `. ${to.firstName} has been asked to claim them.`
        : `${c.employees ?? 0} ${c.employees === 1 ? 'person now reports' : 'people now report'} to ${fullName(to)} instead of ${from.departingName}.`
    setDone({ text })
    setRound((r) => r + 1)
    refreshAll()
  }

  const managers = pending.data?.managers.length
  const rmgs = pending.data?.rmgs.length

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl dark:text-white">Assignments</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-slate-400">
            Hand a departing manager’s projects or an RMG’s people over to someone else.
          </p>
        </div>
        <Button
          variant="secondary"
          aria-label="Refresh assignments"
          disabled={pending.loading}
          onClick={refreshAll}
          icon={<RefreshCw className={`h-4 w-4 ${pending.loading ? 'animate-spin' : ''}`} />}
        >
          Refresh
        </Button>
      </motion.header>

      {/* Handover type */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.04 }}
        role="tablist"
        aria-label="Handover type"
        className="inline-flex w-full rounded-2xl border border-slate-200/80 bg-white p-1 shadow-sm sm:w-auto dark:border-white/8 dark:bg-white/4 dark:shadow-none"
      >
        {TABS.map((t) => {
          const on = t.kind === kind
          const waiting = t.kind === 'manager' ? managers : rmgs
          return (
            <button
              key={t.kind}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => !on && go({ type: t.kind })}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${
                on ? 'text-white dark:text-ink-900' : 'text-ink-500 hover:text-ink-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {on && (
                <motion.span
                  layoutId="handover-tab"
                  className="absolute inset-0 rounded-xl bg-ink-900 dark:bg-white"
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}
              <t.icon className="relative h-4 w-4" />
              <span className="relative">{t.label}</span>
              {!!waiting && (
                <span className="relative rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] leading-none font-bold text-white tabular-nums">
                  {waiting}
                </span>
              )}
            </button>
          )
        })}
      </motion.div>

      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-brand-500/25 bg-brand-500/8 p-4 text-sm text-brand-800 dark:text-brand-200"
          >
            <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
            <p className="flex-1">{done.text}</p>
            <button type="button" aria-label="Dismiss" onClick={() => setDone(null)} className="rounded-lg p-1 hover:bg-brand-500/10">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08 }}
        className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]"
      >
        <HandoverQueue
          key={kind}
          kind={kind}
          items={pending.error && !pending.data ? [] : queue}
          loading={pending.loading}
          selected={who}
          onSelect={(employeeId) => go({ who: employeeId })}
        />

        {who ? (
          <HandoverWorkspace key={`${kind}-${who}-${round}`} kind={kind} employeeId={who} onDone={onDone} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 px-6 py-20 text-center dark:border-white/10">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-ink-500 dark:bg-white/6 dark:text-slate-400">
              <ArrowLeftRight className="h-6 w-6" />
            </span>
            <p className="text-base font-semibold text-ink-900 dark:text-white">Choose who is handing over</p>
            <p className="max-w-sm text-sm text-ink-500 dark:text-slate-400">
              {kind === 'manager'
                ? 'Pick a manager on the left, or load anyone by employee ID, to see their projects and choose the new manager.'
                : 'Pick an RMG on the left, or load anyone by employee ID, to see who reports to them and choose the new RMG.'}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
