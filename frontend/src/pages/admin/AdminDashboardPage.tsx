import { ClipboardList, FolderKanban, Hourglass, Users } from 'lucide-react'
import { useState } from 'react'
import { KpiCard } from '../../components/dashboard/KpiCard'
import Reveal from '../../components/ui/Reveal'
import { useAuth } from '../../contexts/auth'
import { useResource } from '../../hooks/useResource'
import { percent } from '../../utils/format'
import ActivityPanel from './dashboard/ActivityPanel'
import AttentionPanel from './dashboard/AttentionPanel'
import BenchAgingPanel from './dashboard/BenchAgingPanel'
import HeroTile from './dashboard/HeroTile'
import InterviewsPanel from './dashboard/InterviewsPanel'
import RmgRosterPanel from './dashboard/RmgRosterPanel'
import WorkforcePanel from './dashboard/WorkforcePanel'

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [now] = useState(() => new Date())
  const dashboard = useResource('admin/dashboard')
  const roster = useResource('admin/rmg-roster')
  const activity = useResource('admin/recent-activity')

  const refreshing = dashboard.loading || roster.loading || activity.loading
  const d = dashboard.data
  const kpiLoading = d === null && !dashboard.error
  const activeTotal = d ? d.activeEmployees : 0

  function refreshAll() {
    dashboard.reload()
    roster.reload()
    activity.reload()
  }

  return (
    <div className="mx-auto grid max-w-350 grid-cols-12 gap-4 lg:gap-5">
      <div className="col-span-12 xl:col-span-8">
        <HeroTile
          firstName={user?.firstName}
          now={now}
          dashboard={dashboard}
          activity={activity}
          refreshing={refreshing}
          onRefresh={refreshAll}
        />
      </div>
      <Reveal delay={0.1} className="col-span-12 h-full xl:col-span-4">
        <AttentionPanel state={dashboard} />
      </Reveal>

      {dashboard.error && !d && (
        <p className="col-span-12 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          {dashboard.status === 403
            ? "Your account doesn't have permission to view the dashboard summary."
            : dashboard.error}
        </p>
      )}

      <div className="col-span-12 sm:col-span-6 xl:col-span-3">
        <KpiCard
          label="Total employees"
          value={d?.totalEmployees}
          loading={kpiLoading}
          accent="brand"
          icon={<Users className="h-4 w-4" />}
          caption={
            d && d.totalEmployees > 0 ? `${percent(d.activeEmployees, d.totalEmployees)}% currently active` : 'No employees yet'
          }
          progress={d ? percent(d.activeEmployees, d.totalEmployees) : undefined}
          delay={0.05}
        />
      </div>
      <div className="col-span-12 sm:col-span-6 xl:col-span-3">
        <KpiCard
          label="In projects"
          value={d ? (d.inProjectEmployees ?? 0) : undefined}
          loading={kpiLoading}
          accent="sky"
          icon={<FolderKanban className="h-4 w-4" />}
          caption={d ? `across ${d.activeProjects} active project${d.activeProjects === 1 ? '' : 's'}` : undefined}
          progress={d ? percent(d.inProjectEmployees ?? 0, activeTotal) : undefined}
          delay={0.1}
        />
      </div>
      <div className="col-span-12 sm:col-span-6 xl:col-span-3">
        <KpiCard
          label="On bench"
          value={d ? (d.onBenchEmployees ?? 0) : undefined}
          loading={kpiLoading}
          accent="amber"
          icon={<Hourglass className="h-4 w-4" />}
          caption={d ? `${d.benchRed ?? 0} in the red zone` : undefined}
          progress={d ? percent(d.onBenchEmployees ?? 0, activeTotal) : undefined}
          delay={0.15}
        />
      </div>
      <div className="col-span-12 sm:col-span-6 xl:col-span-3">
        <KpiCard
          label="Open requirements"
          value={d ? (d.openRequirements ?? 0) : undefined}
          loading={kpiLoading}
          accent="violet"
          icon={<ClipboardList className="h-4 w-4" />}
          caption={d ? `${d.upcomingInterviews?.length ?? 0} interview${d.upcomingInterviews?.length === 1 ? '' : 's'} coming up` : undefined}
          delay={0.2}
        />
      </div>

      <Reveal delay={0.05} className="col-span-12 h-full md:col-span-6 xl:col-span-4">
        <WorkforcePanel state={dashboard} />
      </Reveal>
      <Reveal delay={0.1} className="col-span-12 h-full md:col-span-6 xl:col-span-4">
        <BenchAgingPanel state={dashboard} />
      </Reveal>
      <Reveal delay={0.15} className="col-span-12 h-full xl:col-span-4">
        <InterviewsPanel state={dashboard} now={now} />
      </Reveal>

      <Reveal delay={0.05} className="col-span-12 h-full lg:col-span-5">
        <RmgRosterPanel state={roster} />
      </Reveal>
      <Reveal delay={0.1} className="col-span-12 h-full lg:col-span-7">
        <ActivityPanel state={activity} now={now} />
      </Reveal>
    </div>
  )
}
