import { ArrowRightLeft, ExternalLink, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/form'
import { Drawer } from '../../../components/ui/Overlay'
import type { RmgDetailDTO, RmgTeamMember } from '../../../services/admin/rmg.service'
import { initialsOf } from '../../../utils/format'
import { avatarGradient } from '../employees/employeeUi'
import RmgTeam from './RmgTeam'
import { StatusBadges } from './RmgTable'
import { needsReplacement, rmgNameParts, utilisation } from './rmgUi'

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-ink-500 dark:text-slate-500">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-ink-900 dark:text-white">{children || '—'}</dd>
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-white/6 dark:bg-white/2">
      <h3 className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-ink-500 uppercase dark:text-slate-500">{title}</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</dl>
    </section>
  )
}

function Metric({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 dark:border-white/8 dark:bg-white/3">
      <p className={`text-xl font-extrabold tabular-nums ${tone ?? 'text-ink-900 dark:text-white'}`}>{value}</p>
      <p className="text-[11px] text-ink-500 dark:text-slate-400">{label}</p>
    </div>
  )
}

export default function RmgProfileDrawer({
  rmg,
  onMove,
  onClose,
}: {
  rmg: RmgDetailDTO | null
  onMove: (member: RmgTeamMember, rmg: RmgDetailDTO) => void
  onClose: () => void
}) {
  const navigate = useNavigate()
  const r = rmg
  const [first, last] = r ? rmgNameParts(r.rmgName) : ['', '']
  const util = r ? utilisation(r.workforce, r.associateCount) : null

  return (
    <Drawer
      open={r !== null}
      onClose={onClose}
      title={r?.rmgName ?? ''}
      subtitle={r ? `${r.employeeId}${r.designation ? ` · ${r.designation}` : ''}` : undefined}
      footer={
        r && (
          <Button
            variant="secondary"
            icon={<ExternalLink className="h-4 w-4" />}
            onClick={() => navigate(`/admin/employees?q=${encodeURIComponent(r.employeeId)}`)}
          >
            Open in Employees
          </Button>
        )
      }
    >
      {r && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ${avatarGradient(r.rmgId)} text-lg font-bold text-white shadow-md`}
            >
              {initialsOf(first, last)}
            </span>
            <StatusBadges r={r} />
          </div>

          {needsReplacement(r) && (
            <p className="flex gap-2.5 rounded-2xl border border-rose-500/25 bg-rose-500/8 p-3.5 text-sm text-rose-700 dark:text-rose-300">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {r.rmgName} is inactive, but {r.associateCount} {r.associateCount === 1 ? 'person still reports' : 'people still report'} to
                them.{' '}
                <button
                  type="button"
                  onClick={() => navigate(`/admin/assignments?type=rmg&who=${encodeURIComponent(r.employeeId)}`)}
                  className="font-semibold underline underline-offset-2 hover:no-underline"
                >
                  Hand them all over
                </button>{' '}
                or move one at a time with the <ArrowHint /> button below.
              </span>
            </p>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Metric label="Associates" value={r.associateCount} />
            <Metric
              label="In a project"
              value={util === null ? '—' : `${util}%`}
              tone={util === null ? undefined : 'text-brand-600 dark:text-brand-400'}
            />
            <Metric label="On bench" value={r.workforce?.ON_BENCH ?? 0} tone="text-sky-600 dark:text-sky-400" />
          </div>

          <Group title="Overview">
            <Item label="Email">{r.email}</Item>
            <Item label="Department">{r.department}</Item>
            <Item label="Location">{r.location}</Item>
            <Item label="Grade">{r.grade}</Item>
            <Item label="Reports to">
              {r.reportsToName && (
                <>
                  {r.reportsToName}
                  {r.reportsToEmployeeId && (
                    <span className="block text-xs text-ink-500 dark:text-slate-400">{r.reportsToEmployeeId}</span>
                  )}
                </>
              )}
            </Item>
          </Group>

          <RmgTeam key={r.employeeId} rmgId={r.employeeId} onMove={(m) => onMove(m, r)} />
        </div>
      )}
    </Drawer>
  )
}

/** The move icon, inline in the hint text. */
function ArrowHint() {
  return (
    <span aria-label="move" className="mx-0.5 inline-flex rounded-md bg-rose-500/15 p-0.5 align-middle">
      <ArrowRightLeft className="h-3.5 w-3.5" />
    </span>
  )
}
