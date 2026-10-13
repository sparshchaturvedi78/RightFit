import { Mail, Pencil, Phone, Power, PowerOff, UserCog } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/form'
import { Drawer } from '../../../components/ui/Overlay'
import type { EmployeeDTO } from '../../../services/admin/employee.service'
import { humanize, initialsOf, parseServerDate } from '../../../utils/format'
import { allocationTone, availabilityTone, avatarGradient, employmentTone, formatDay, fullName } from './employeeUi'
import type { RowActions } from './EmployeeTable'

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

export default function EmployeeProfileDrawer({
  employee,
  actions,
  onClose,
}: {
  employee: EmployeeDTO | null
  actions: Omit<RowActions, 'onOpen'>
  onClose: () => void
}) {
  const e = employee
  const active = e?.employmentStatus === 'ACTIVE'

  return (
    <Drawer
      open={e !== null}
      onClose={onClose}
      title={e ? fullName(e) : ''}
      subtitle={e ? `${e.employeeId} · ${e.designation}` : undefined}
      footer={
        e && (
          <>
            <Button variant="secondary" icon={<UserCog className="h-4 w-4" />} onClick={() => actions.onAssignRmg(e)}>
              Assign RMG
            </Button>
            <Button variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={() => actions.onEdit(e)}>
              Edit
            </Button>
            <Button
              variant={active ? 'danger' : 'primary'}
              icon={active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
              onClick={() => actions.onToggleStatus(e)}
            >
              {active ? 'Deactivate' : 'Reactivate'}
            </Button>
          </>
        )
      }
    >
      {e && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ${avatarGradient(e.id)} text-lg font-bold text-white shadow-md`}
            >
              {initialsOf(e.firstName, e.lastName)}
            </span>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                <Badge tone={employmentTone(e.employmentStatus)} dot>
                  {humanize(e.employmentStatus)}
                </Badge>
                <Badge tone={allocationTone(e.allocationStatus)}>{humanize(e.allocationStatus)}</Badge>
                <Badge tone={availabilityTone(e.availabilityStatus)}>{humanize(e.availabilityStatus)}</Badge>
              </div>
              <p className="flex items-center gap-1.5 truncate text-sm text-ink-500 dark:text-slate-400">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <a href={`mailto:${e.email}`} className="truncate hover:text-brand-600 dark:hover:text-brand-400">
                  {e.email}
                </a>
              </p>
              {e.phone && (
                <p className="flex items-center gap-1.5 text-sm text-ink-500 dark:text-slate-400">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {e.phone}
                </p>
              )}
            </div>
          </div>

          {e.roles && e.roles.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-ink-500 dark:text-slate-500">Roles</span>
              {e.roles.map((role) => (
                <Badge key={role} tone="violet">
                  {role}
                </Badge>
              ))}
            </div>
          )}

          <Group title="Job">
            <Item label="Designation">{e.designation}</Item>
            <Item label="Grade">{e.grade}</Item>
            <Item label="Domain">{e.domain}</Item>
            <Item label="Experience">{e.yearsOfExperience != null ? `${e.yearsOfExperience} yrs` : undefined}</Item>
            <Item label="Joined">{formatDay(e.dateOfJoining)}</Item>
            <Item label="Hours / day">{e.workingHoursPerDay != null ? `${e.workingHoursPerDay} h` : undefined}</Item>
          </Group>

          <Group title="Placement">
            <Item label="Department">{e.departmentName}</Item>
            <Item label="Location">{e.locationName}</Item>
            <Item label="RMG">{e.rmgName}</Item>
            <Item label="Pool">{e.poolStatus ? humanize(e.poolStatus) : undefined}</Item>
            <Item label="Available from">
              {formatDay(e.availableFromDate) ?? (e.availabilityStatus === 'AVAILABLE' ? 'Available now' : 'Not set')}
            </Item>
          </Group>

          <Group title="Record">
            <Item label="Created">
              {e.createdAt ? parseServerDate(e.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : undefined}
            </Item>
            <Item label="Created by">{e.createdBy ?? 'Not recorded'}</Item>
            <Item label="Updated">
              {e.updatedAt ? parseServerDate(e.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : undefined}
            </Item>
            <Item label="Updated by">{e.updatedBy ?? 'Not recorded'}</Item>
          </Group>
        </div>
      )}
    </Drawer>
  )
}
