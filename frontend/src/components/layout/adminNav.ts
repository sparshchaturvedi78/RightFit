import {
  ArrowLeftRight,
  BarChart3,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  ScrollText,
  Sparkles,
  UserCog,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Flip to true when the page ships; unbuilt pages render as "Soon" instead of a dead link. */
  ready: boolean
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const ADMIN_NAV: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard, ready: true }],
  },
  {
    title: 'People & projects',
    items: [
      { label: 'Employees', to: '/admin/employees', icon: Users, ready: true },
      { label: 'Projects', to: '/admin/projects', icon: FolderKanban, ready: true },
      { label: 'RMG', to: '/admin/rmg', icon: UsersRound, ready: true },
    ],
  },
  {
    title: 'Access control',
    items: [
      { label: 'Users', to: '/admin/users', icon: UserCog, ready: true },
      { label: 'Assignments', to: '/admin/assignments', icon: ArrowLeftRight, ready: true },
    ],
  },
  {
    title: 'Catalogs & policy',
    items: [
      { label: 'Skills', to: '/admin/skills', icon: Sparkles, ready: true },
      { label: 'Bench policy', to: '/admin/bench-configuration', icon: Gauge, ready: true },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Audit log', to: '/admin/audit', icon: ScrollText, ready: true },
      { label: 'Reports', to: '/admin/reports', icon: BarChart3, ready: true },
    ],
  },
]
