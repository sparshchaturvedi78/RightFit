import { FilterX } from 'lucide-react'
import { Dropdown } from '../../../components/ui/Dropdown'
import { SearchInput } from '../../../components/ui/SearchInput'
import type { LookupsDTO } from '../../../services/admin/lookup.service'
import { ROLE_OPTIONS, STATUS_OPTIONS, WORKFORCE_OPTIONS } from './employeeUi'

export interface EmployeeFilterValues {
  q: string
  status: string
  dept: string
  loc: string
  role: string
  wf: string
}

export default function EmployeeFilters({
  values,
  lookups,
  onChange,
  onClear,
}: {
  values: EmployeeFilterValues
  lookups: LookupsDTO | null
  onChange: (patch: Partial<EmployeeFilterValues>) => void
  onClear: () => void
}) {
  const active = Object.values(values).some(Boolean)
  const departments = Array.isArray(lookups?.departments) ? lookups.departments : []
  const locations = Array.isArray(lookups?.locations) ? lookups.locations : []

  return (
    <div className="flex flex-col gap-3 p-4 sm:p-5 xl:flex-row xl:items-center">
      <SearchInput value={values.q} onSearch={(q) => onChange({ q })} placeholder="Search name, ID or email…" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:flex xl:shrink-0">
        <div className="xl:w-36">
          <Dropdown
            ariaLabel="Status"
            value={values.status}
            onChange={(status) => onChange({ status })}
            options={[{ value: '', label: 'All statuses' }, ...STATUS_OPTIONS]}
          />
        </div>
        <div className="xl:w-40">
          <Dropdown
            ariaLabel="Workforce"
            value={values.wf}
            onChange={(wf) => onChange({ wf })}
            options={[{ value: '', label: 'All workforce' }, ...WORKFORCE_OPTIONS]}
          />
        </div>
        <div className="xl:w-36">
          <Dropdown
            ariaLabel="Role"
            value={values.role}
            onChange={(role) => onChange({ role })}
            options={[{ value: '', label: 'All roles' }, ...ROLE_OPTIONS]}
          />
        </div>
        <div className="xl:w-44">
          <Dropdown
            ariaLabel="Department"
            value={values.dept}
            onChange={(dept) => onChange({ dept })}
            options={[{ value: '', label: 'All departments' }, ...departments.map((d) => ({ value: String(d.id), label: d.name }))]}
          />
        </div>
        <div className="xl:w-40">
          <Dropdown
            ariaLabel="Location"
            value={values.loc}
            onChange={(loc) => onChange({ loc })}
            options={[{ value: '', label: 'All locations' }, ...locations.map((l) => ({ value: String(l.id), label: l.name }))]}
          />
        </div>
      </div>
      {active && (
        <button
          type="button"
          onClick={onClear}
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-ink-500 transition-colors hover:bg-slate-100 hover:text-ink-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <FilterX className="h-4 w-4" />
          Clear
        </button>
      )}
    </div>
  )
}
