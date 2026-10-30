import { FolderKanban } from 'lucide-react'
import { useState } from 'react'
import PersonPicker from '../../../components/people/PersonPicker'
import { TILE_SURFACE } from '../../../components/dashboard/Panel'
import { Button } from '../../../components/ui/form'
import { useToast } from '../../../hooks/useToast'
import { adminAssignmentService } from '../../../services/admin/assignment.service'
import type { EmployeeDTO } from '../../../services/admin/employee.service'
import { getApiErrorMessage } from '../../../services/httpClient'
import { fullName } from '../employees/employeeUi'

type Project = { projectId: string; projectName: string; clientName?: string }

/** Active projects that have no manager yet: pick some, choose a manager, and they are asked to claim them. */
export default function UnassignedProjects({ projects, onAssigned }: { projects: Project[]; onAssigned: (text: string) => void }) {
  const toast = useToast()
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [manager, setManager] = useState<EmployeeDTO | null>(null)
  const [busy, setBusy] = useState(false)

  const toggle = (id: string) =>
    setPicked((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  async function assign() {
    if (!manager || picked.size === 0) return
    setBusy(true)
    try {
      await adminAssignmentService.assignManager({ newManagerEmployeeId: manager.employeeId, selectedProjectBusinessIds: [...picked] })
      onAssigned(`${picked.size} project${picked.size === 1 ? '' : 's'} given to ${fullName(manager)}. They have been asked to claim them.`)
      setPicked(new Set())
      setManager(null)
    } catch (err) {
      toast.error('Could not assign', getApiErrorMessage(err, 'Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={`${TILE_SURFACE} p-5`} aria-label="Projects without a manager">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/12 text-amber-600 dark:text-amber-400">
          <FolderKanban className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-ink-900 dark:text-white">Projects without a manager</h2>
          <p className="text-xs text-ink-500 dark:text-slate-400">Only admins can see these. Give them a manager to open them up.</p>
        </div>
      </div>
      <ul className="grid max-h-56 gap-1.5 overflow-y-auto">
        {projects.map((p) => (
          <li key={p.projectId}>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200/80 px-3 py-2 text-sm dark:border-white/8">
              <input type="checkbox" checked={picked.has(p.projectId)} onChange={() => toggle(p.projectId)} className="h-4 w-4 accent-emerald-600" />
              <span className="min-w-0 flex-1 truncate font-semibold text-ink-900 dark:text-white">{p.projectName}</span>
              <span className="shrink-0 text-xs text-ink-500 dark:text-slate-400">{[p.projectId, p.clientName].filter(Boolean).join(' · ')}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-4 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <PersonPicker
          id="unassigned-manager"
          label="New manager"
          role="MANAGER"
          roleLabel="Manager"
          value={manager}
          onChange={setManager}
          blocker={(person) => (person.employmentStatus !== 'ACTIVE' ? `${fullName(person)} is inactive.` : null)}
        />
        <Button variant="primary" loading={busy} disabled={!manager || picked.size === 0} onClick={() => void assign()}>
          Assign manager
        </Button>
      </div>
    </section>
  )
}
