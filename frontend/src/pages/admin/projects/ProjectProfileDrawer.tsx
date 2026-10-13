import { Pencil, RotateCcw, UserCog, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/form'
import { Drawer } from '../../../components/ui/Overlay'
import type { ProjectDTO } from '../../../services/admin/project.service'
import { humanize, parseServerDate } from '../../../utils/format'
import { formatDay } from '../employees/employeeUi'
import ProjectTeam from './ProjectTeam'
import type { RowActions } from './ProjectTable'
import { claimBadge, managerInactive, projectGradient, projectInitials, statusTone } from './projectUi'

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-medium text-ink-500 dark:text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink-900 dark:text-white">{children || '—'}</dd>
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

function stamp(value?: string) {
  return value ? parseServerDate(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : undefined
}

export default function ProjectProfileDrawer({
  project,
  actions,
  onClose,
}: {
  project: ProjectDTO | null
  actions: Omit<RowActions, 'onOpen'>
  onClose: () => void
}) {
  const p = project
  const active = p?.status === 'ACTIVE'

  return (
    <Drawer
      open={p !== null}
      onClose={onClose}
      title={p?.projectName ?? ''}
      subtitle={p ? `${p.projectId}${p.clientName ? ` · ${p.clientName}` : ''}` : undefined}
      footer={
        p && (
          <>
            <Button variant="secondary" icon={<UserCog className="h-4 w-4" />} onClick={() => actions.onChangeManager(p)}>
              Change manager
            </Button>
            <Button variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={() => actions.onEdit(p)}>
              Edit
            </Button>
            <Button
              variant={active ? 'danger' : 'primary'}
              icon={active ? <XCircle className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
              onClick={() => actions.onToggleStatus(p)}
            >
              {active ? 'Close project' : 'Reopen project'}
            </Button>
          </>
        )
      }
    >
      {p && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ${projectGradient(p.id)} text-lg font-bold text-white shadow-md`}
            >
              {projectInitials(p.projectName)}
            </span>
            <div className="flex flex-wrap gap-1.5">
              <Badge tone={statusTone(p.status)} dot>
                {humanize(p.status)}
              </Badge>
              <Badge tone={claimBadge(p).tone}>{claimBadge(p).label}</Badge>
            </div>
          </div>

          {p.description && (
            <p className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 text-sm leading-relaxed whitespace-pre-line text-ink-700 dark:border-white/6 dark:bg-white/2 dark:text-slate-300">
              {p.description}
            </p>
          )}

          <Group title="Overview">
            <Item label="Client">{p.clientName}</Item>
            <Item label="Manager">
              <span className={managerInactive(p) ? 'text-rose-600 dark:text-rose-400' : undefined}>{p.managerName}</span>
              {p.managerEmployeeId && (
                <span className="block text-xs text-ink-500 dark:text-slate-400">
                  {p.managerEmployeeId}
                  {managerInactive(p) && ' · inactive — needs a new manager'}
                </span>
              )}
            </Item>
            <Item label="Start date">{formatDay(p.startDate)}</Item>
            <Item label="End date">{formatDay(p.endDate)}</Item>
            <Item label="Manager claim">
              {managerInactive(p)
                ? 'Not applicable — choose a new manager'
                : p.managerClaimed
                  ? stamp(p.claimedAt)
                    ? `Claimed ${stamp(p.claimedAt)}`
                    : 'Claimed'
                  : 'Waiting for the manager to claim'}
            </Item>
          </Group>

          <ProjectTeam key={p.projectId} projectId={p.projectId} />

          <Group title="Record">
            <Item label="Created">{stamp(p.createdAt)}</Item>
            <Item label="Created by">{p.createdBy ?? 'Not recorded'}</Item>
            <Item label="Updated">{stamp(p.updatedAt)}</Item>
            <Item label="Updated by">{p.updatedBy ?? 'Not recorded'}</Item>
          </Group>
        </div>
      )}
    </Drawer>
  )
}
