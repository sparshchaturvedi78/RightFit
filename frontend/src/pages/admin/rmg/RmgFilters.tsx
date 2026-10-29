import { FilterX } from 'lucide-react'
import { Dropdown } from '../../../components/ui/Dropdown'
import { SearchInput } from '../../../components/ui/SearchInput'
import { STATUS_OPTIONS, TEAM_OPTIONS } from './rmgUi'

export interface RmgFilterValues {
  q: string
  status: string
  team: string
}

export default function RmgFilters({
  values,
  onChange,
  onClear,
}: {
  values: RmgFilterValues
  onChange: (patch: Partial<RmgFilterValues>) => void
  onClear: () => void
}) {
  const active = Object.values(values).some(Boolean)

  return (
    <div className="flex flex-col gap-3 p-4 sm:p-5 xl:flex-row xl:items-center">
      <SearchInput value={values.q} onSearch={(q) => onChange({ q })} placeholder="Search RMG by name, ID or email…" />
      <div className="grid grid-cols-2 gap-3 xl:flex xl:shrink-0">
        <div className="xl:w-40">
          <Dropdown
            ariaLabel="Status"
            value={values.status}
            onChange={(status) => onChange({ status })}
            options={[{ value: '', label: 'All statuses' }, ...STATUS_OPTIONS]}
          />
        </div>
        <div className="xl:w-48">
          <Dropdown
            ariaLabel="Team"
            value={values.team}
            onChange={(team) => onChange({ team })}
            options={[{ value: '', label: 'Any team size' }, ...TEAM_OPTIONS]}
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
