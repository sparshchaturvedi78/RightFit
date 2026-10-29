import type { AuditLogDTO } from '../../../services/admin/audit.service'
import { actionLabel, actionTone, initials, TONE_CLASS } from './auditUi'

/** One entry in full: a sentence, why, what changed, and where it came from. */
export default function AuditDetail({ entry }: { entry: AuditLogDTO }) {
  const tone = actionTone(entry.action)
  const email = entry.performedByEmail && entry.performedByEmail !== 'system' ? entry.performedByEmail : undefined
  const who = entry.performedByName ?? email ?? 'The system'
  const doneBy = entry.performedByName
    ? `${entry.performedByName}${entry.performedByEmployeeId ? ` · ${entry.performedByEmployeeId}` : ''}`
    : who
  const when = new Date(entry.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' })
  return (
    <div className="grid content-start gap-5 p-6">
      <div>
        <h2 className="flex items-center gap-3 text-xl font-bold tracking-tight text-ink-900 dark:text-white">
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-bold ${TONE_CLASS[tone]}`}>{initials(entry.action)}</span>
          {actionLabel(entry.action)}
        </h2>
        <p className="mt-1 text-sm text-ink-500 dark:text-slate-400">
          {when} · entry {entry.auditId} · {entry.status === 'SUCCESS' ? 'succeeded' : entry.status.toLowerCase()}
        </p>
      </div>

      <p className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-[15px] leading-relaxed text-ink-900 dark:border-white/8 dark:bg-white/3 dark:text-white">
        <b>{who}</b> {entry.changeSummary ?? `${actionLabel(entry.action).toLowerCase()} on ${entry.entityType.toLowerCase()}`}
        {entry.entityId != null && <span className="text-ink-500 dark:text-slate-400"> (#{entry.entityId})</span>}.
      </p>

      <section>
        <h3 className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-500">Why</h3>
        <p className="rounded-xl border-l-[3px] border-brand-500 bg-slate-50 px-3.5 py-2.5 text-sm dark:bg-white/3">
          {entry.changeSummary ?? 'No reason was recorded.'}
        </p>
      </section>

      {(entry.oldValue || entry.newValue) && (
        <section>
          <h3 className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-500">What changed</h3>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="rounded-xl bg-rose-500/8 px-3.5 py-3">
              <p className="text-[10px] font-bold tracking-[0.08em] text-ink-500 uppercase dark:text-slate-500">Before</p>
              <code className="mt-1 block break-all font-mono text-sm text-ink-900 dark:text-white">{entry.oldValue ?? '—'}</code>
            </div>
            <div className="rounded-xl bg-brand-500/8 px-3.5 py-3">
              <p className="text-[10px] font-bold tracking-[0.08em] text-ink-500 uppercase dark:text-slate-500">After</p>
              <code className="mt-1 block break-all font-mono text-sm text-ink-900 dark:text-white">{entry.newValue ?? '—'}</code>
            </div>
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-500">Who did it</h3>
        <dl className="grid gap-2.5 sm:grid-cols-2">
          <Cell label="Done by" value={doneBy} />
          <Cell label="Email" value={email ?? '—'} />
        </dl>
      </section>
    </div>
  )
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200/80 px-3 py-2.5 dark:border-white/8">
      <dt className="text-[11px] font-semibold text-ink-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-ink-900 dark:text-white" title={value}>{value}</dd>
    </div>
  )
}
