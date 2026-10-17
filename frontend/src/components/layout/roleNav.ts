import { BarChart3, CalendarClock, ClipboardCheck, ClipboardList, FolderKanban, LayoutDashboard, Users, UsersRound } from 'lucide-react'
import type { NavGroup } from './adminNav'

/** Manager sidebar. Pages that aren't built yet show as "Soon" (flip `ready` when each ships). */
export const MANAGER_NAV: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', to: '/manager/dashboard', icon: LayoutDashboard, ready: true }],
  },
  {
    title: 'Projects & people',
    items: [
      { label: 'Projects', to: '/manager/projects', icon: FolderKanban, ready: true },
      { label: 'My people', to: '/manager/people', icon: UsersRound, ready: true },
      { label: 'Employee directory', to: '/manager/employees', icon: Users, ready: true },
    ],
  },
  {
    title: 'Hiring',
    items: [
      { label: 'Requirements', to: '/manager/requirements', icon: ClipboardList, ready: true },
      { label: 'Interviews', to: '/manager/interviews', icon: CalendarClock, ready: true },
      { label: 'Allocation requests', to: '/manager/allocation-requests', icon: ClipboardCheck, ready: true },
    ],
  },
  {
    title: 'Insights',
    items: [{ label: 'Reports', to: '/manager/reports', icon: BarChart3, ready: true }],
  },
]

/** RMG sidebar. The dashboard is still a placeholder, so it shows as "Soon". */
export const RMG_NAV: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/rmg/dashboard', icon: LayoutDashboard, ready: false },
      { label: 'Reports', to: '/rmg/reports', icon: BarChart3, ready: true },
    ],
  },
]
