import AppShell from '../../components/layout/AppShell'
import { MANAGER_NAV } from '../../components/layout/roleNav'

/** The Manager's pages inside the same shell (sidebar, top bar, theme switch) the Admin uses. */
export default function ManagerLayout() {
  return <AppShell groups={MANAGER_NAV} roleLabel="Manager" />
}
