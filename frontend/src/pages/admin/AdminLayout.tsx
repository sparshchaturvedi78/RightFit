import AppShell from '../../components/layout/AppShell'
import { ADMIN_NAV } from '../../components/layout/adminNav'

export default function AdminLayout() {
  return <AppShell groups={ADMIN_NAV} roleLabel="Administrator" />
}
