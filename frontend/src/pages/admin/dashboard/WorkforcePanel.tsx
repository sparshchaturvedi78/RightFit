import { ChevronRight, PieChart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DonutChart } from '../../../components/dashboard/DonutChart'
import { AsyncBody, Panel, Skeleton } from '../../../components/dashboard/Panel'
import type { AsyncResult } from '../../../hooks/useAsyncData'
import type { AdminDashboardDTO } from '../../../services/admin/dashboard.service'
import { percent } from '../../../utils/format'

/** Where active employees are right now — the same "Workforce Distribution" as the home-page preview. */
export default function WorkforcePanel({ state }: { state: AsyncResult<AdminDashboardDTO> }) {
  return (
    <Panel
      title="Workforce distribution"
      subtitle="Active employees right now"
      icon={<PieChart className="h-4 w-4" />}
      className="h-full"
      centered
    >
      <AsyncBody
        state={state}
        skeleton={
          <div className="flex items-center gap-6">
            <Skeleton className="h-36 w-36 shrink-0 rounded-full" />
            <div className="flex-1 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-5" />
              ))}
            </div>
          </div>
        }
      >
        {(d) => {
          const segments = [
            { key: 'IN_PROJECT', label: 'In project', value: d.inProjectEmployees ?? 0, color: '#22c55e' },
            { key: 'ON_BENCH', label: 'On bench', value: d.onBenchEmployees ?? 0, color: '#38bdf8' },
            { key: 'IN_TRAINING', label: 'In training', value: d.inTrainingEmployees ?? 0, color: '#f59e0b' },
            { key: 'UNASSIGNED', label: 'Unassigned', value: d.unassignedEmployees ?? 0, color: '#94a3b8' },
          ]
          const total = segments.reduce((sum, s) => sum + s.value, 0)
          return (
            <div className="flex flex-col items-center gap-6 sm:flex-row xl:flex-col 2xl:flex-row">
              <DonutChart
                size="h-40 w-40"
                segments={segments}
                center={
                  <>
                    <span className="text-3xl font-bold tracking-tight text-ink-900 tabular-nums dark:text-white">
                      {percent(segments[0].value, total)}%
                    </span>
                    <span className="text-[11px] text-ink-500 dark:text-slate-400">in projects</span>
                  </>
                }
              />
              <ul className="w-full min-w-0 flex-1 space-y-2 sm:w-auto xl:w-full 2xl:w-auto">
                {segments.map((s) => (
                  <li key={s.key}>
                    {/* Each bucket opens the Employees list filtered to exactly those people. */}
                    <Link
                      to={`/admin/employees?wf=${s.key}`}
                      title={`See employees ${s.label.toLowerCase()}`}
                      className="group flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-white/3"
                    >
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="min-w-0 truncate text-ink-700 group-hover:text-ink-900 dark:text-slate-300 dark:group-hover:text-white">{s.label}</span>
                      <span className="ml-auto font-semibold text-ink-900 tabular-nums dark:text-white">{s.value}</span>
                      <span className="w-9 shrink-0 text-right text-xs text-ink-500 tabular-nums dark:text-slate-400">
                        {percent(s.value, total)}%
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-500/50 transition-transform group-hover:translate-x-0.5 dark:text-slate-500" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )
        }}
      </AsyncBody>
    </Panel>
  )
}
