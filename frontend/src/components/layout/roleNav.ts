import { BarChart3, LayoutDashboard } from 'lucide-react'
import type { NavGroup } from './adminNav'

/** Manager sidebar. The dashboard is still a placeholder, so it shows as "Soon" until it ships. */
export const MANAGER_NAV: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/manager/dashboard', icon: LayoutDashboard, ready: false },
      { label: 'Reports', to: '/manager/reports', icon: BarChart3, ready: true },
    ],
  },
]

/** RMG sidebar. Same shape as the Manager one; the dashboard is still a placeholder. */
export const RMG_NAV: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/rmg/dashboard', icon: LayoutDashboard, ready: false },
      { label: 'Reports', to: '/rmg/reports', icon: BarChart3, ready: true },
    ],
  },
]
