import { motion } from 'motion/react'
import { ArrowRight, CircleCheck, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button, Input } from '../../../components/ui/form'
import type { HandoverKind, PendingHandoverItem } from '../../../services/admin/assignment.service'
import { initialsOf } from '../../../utils/format'
import { avatarGradient } from '../employees/employeeUi'

function nameParts(name: string): [string, string] {
  const [first, ...rest] = name.trim().split(/\s+/)
  return [first ?? '', rest.join(' ')]
}

/**
 * Left column: people who have left but still hold work (the ones that need a handover), plus a box to start a
 * handover for anyone by employee ID — e.g. before someone leaves.
 */
export default function HandoverQueue({
  kind,
  items,
  loading,
  selected,
  onSelect,
}: {
  kind: HandoverKind
  items: PendingHandoverItem[] | null
  loading: boolean
  selected: string
  onSelect: (employeeId: string) => void
}) {
  const [manual, setManual] = useState('')
  const unit = kind === 'manager' ? ['active project', 'active projects'] : ['person reporting', 'people reporting']

  function submit(ev: FormEvent) {
    ev.preventDefault()
    const id = manual.trim().toUpperCase()
    if (id) onSelect(id)
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-white/8 dark:bg-white/3 dark:shadow-none">
        <header className="border-b border-slate-100 px-5 py-4 dark:border-white/6">
          <h2 className="text-sm font-semibold text-ink-900 dark:text-white">Needs a handover</h2>
          <p className="mt-0.5 text-xs text-ink-500 dark:text-slate-400">
            {kind === 'manager' ? 'Inactive managers who still manage active projects.' : 'Inactive RMGs people still report to.'}
          </p>
        </header>

        {items === null ? (
          <div className="space-y-2 p-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/6" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <CircleCheck className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-ink-900 dark:text-white">All clear</p>
            <p className="max-w-60 text-xs text-ink-500 dark:text-slate-400">
              {kind === 'manager'
                ? 'Every active project has an active manager.'
                : 'Everyone reports to an active RMG.'}
            </p>
          </div>
        ) : (
          <ul className={`space-y-1 p-2 transition-opacity ${loading ? 'opacity-60' : ''}`}>
            {items.map((item, i) => {
              const [first, last] = nameParts(item.name)
              const on = item.employeeId === selected
              return (
                <motion.li key={item.employeeId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <button
                    type="button"
                    aria-current={on || undefined}
                    onClick={() => onSelect(item.employeeId)}
                    className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${
                      on ? 'bg-brand-500/10 ring-1 ring-brand-500/25' : 'hover:bg-slate-50 dark:hover:bg-white/4'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${avatarGradient(item.id)} text-xs font-bold text-white`}
                    >
                      {initialsOf(first, last)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink-900 dark:text-white">{item.name}</span>
                      <span className="block truncate text-xs text-ink-500 dark:text-slate-400">
                        {item.employeeId} · <span className="text-rose-600 dark:text-rose-400">inactive</span>
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-bold text-ink-900 tabular-nums dark:text-white">{item.count}</span>
                      <span className="block text-[10px] text-ink-500 dark:text-slate-500">{item.count === 1 ? unit[0] : unit[1]}</span>
                    </span>
                    <ArrowRight
                      className={`h-4 w-4 shrink-0 transition-all ${on ? 'text-brand-600 dark:text-brand-400' : 'text-ink-500/40 group-hover:translate-x-0.5 group-hover:text-ink-500'}`}
                    />
                  </button>
                </motion.li>
              )
            })}
          </ul>
        )}
      </section>

      <form
        onSubmit={submit}
        className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-white/3 dark:shadow-none"
      >
        <label htmlFor="handover-any" className="text-sm font-semibold text-ink-900 dark:text-white">
          Hand over for someone else
        </label>
        <p className="mt-0.5 mb-3 text-xs text-ink-500 dark:text-slate-400">
          {kind === 'manager'
            ? 'Any manager’s projects — for example before they leave.'
            : 'Any RMG’s people — for example to rebalance teams.'}
        </p>
        <div className="flex gap-2">
          <Input
            id="handover-any"
            autoComplete="off"
            value={manual}
            placeholder="Employee ID, e.g. EMP003"
            onChange={(e) => setManual(e.target.value)}
            className="uppercase placeholder:normal-case"
          />
          <Button type="submit" variant="secondary" icon={<Search className="h-4 w-4" />} className="shrink-0">
            Load
          </Button>
        </div>
      </form>
    </div>
  )
}
