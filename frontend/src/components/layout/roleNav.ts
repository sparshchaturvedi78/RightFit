import {
  BadgeCheck,
  BarChart3,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FolderKanban,
  FolderSearch,
  Gavel,
  GraduationCap,
  LayoutDashboard,
  Mail,
  UserRound,
  Users,
  UsersRound,
} from 'lucide-react'
import type { NavGroup } from './adminNav'

/**
 * Associate sidebar. It follows the person's situation: on a project they see My team; in the pool they see
 * Projects, Invitations, Interviews and Training. Hiring duties appear only for SOURCER / COORDINATOR / INTERVIEWER holders.
 */
export function associateNav({ allocated, duties }: { allocated: boolean; duties: string[] }): NavGroup[] {
  const groups: NavGroup[] = [{ title: 'Overview', items: [{ label: 'Dashboard', to: '/associate/dashboard', icon: LayoutDashboard, ready: true }] }]
  if (allocated) {
    groups.push({ title: 'My work', items: [{ label: 'My team', to: '/associate/team', icon: UsersRound, ready: true }] })
  } else {
    groups.push({
      title: 'Find work',
      items: [
        { label: 'Projects', to: '/associate/projects', icon: FolderSearch, ready: true },
        { label: 'Invitations', to: '/associate/invitations', icon: Mail, ready: true },
        { label: 'Interviews', to: '/associate/interviews', icon: CalendarClock, ready: true },
      ],
    })
    groups.push({ title: 'Learning', items: [{ label: 'Training', to: '/associate/training', icon: GraduationCap, ready: true }] })
  }
  // Hiring duties are shown to allocated associates only; an unallocated associate has no hiring screens here.
  const hiring = []
  if (allocated && (duties.includes('SOURCER') || duties.includes('COORDINATOR'))) {
    hiring.push({ label: 'My duties', to: '/associate/duties', icon: ClipboardList, ready: true })
  }
  if (allocated && (duties.includes('SOURCER') || duties.includes('COORDINATOR'))) {
    hiring.push({ label: 'Employee directory', to: '/associate/directory', icon: Users, ready: true })
  }
  if (allocated && (duties.includes('INTERVIEWER') || duties.includes('COORDINATOR'))) {
    hiring.push({ label: 'Interviews on my duties', to: '/associate/interviews-to-take', icon: Gavel, ready: true })
  }
  if (hiring.length) groups.push({ title: 'Hiring duties', items: hiring })
  groups.push({
    title: 'Me',
    items: [
      { label: 'Profile and skills', to: '/associate/profile', icon: UserRound, ready: true },
      { label: 'Certifications', to: '/associate/certifications', icon: BadgeCheck, ready: true },
      { label: 'Availability', to: '/associate/availability', icon: Clock, ready: true },
    ],
  })
  return groups
}

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
