import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import DashboardPlaceholderPage from './pages/DashboardPlaceholderPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import EmployeesPage from './pages/admin/employees/EmployeesPage'
import ProjectsPage from './pages/admin/projects/ProjectsPage'
import RmgPage from './pages/admin/rmg/RmgPage'
import AssignmentsPage from './pages/admin/assignments/AssignmentsPage'
import UsersPage from './pages/admin/users/UsersPage'
import SkillsPage from './pages/admin/skills/SkillsPage'
import BenchPolicyPage from './pages/admin/bench/BenchPolicyPage'
import AuditPage from './pages/admin/audit/AuditPage'
import ReportsPage from './pages/admin/reports/ReportsPage'
import AdminLayout from './pages/admin/AdminLayout'
import AppShell from './components/layout/AppShell'
import { MANAGER_NAV, RMG_NAV } from './components/layout/roleNav'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="rmg" element={<RmgPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="skills" element={<SkillsPage />} />
        <Route path="bench-configuration" element={<BenchPolicyPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
      {/* Reports for Manager and RMG: the same page, narrowed to their own projects / associates by the server. */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <AppShell groups={MANAGER_NAV} roleLabel="Manager" />
          </ProtectedRoute>
        }
      >
        <Route path="reports" element={<ReportsPage narrowed />} />
      </Route>
      <Route
        path="/rmg"
        element={
          <ProtectedRoute allowedRoles={['RMG']}>
            <AppShell groups={RMG_NAV} roleLabel="RMG" />
          </ProtectedRoute>
        }
      >
        <Route path="reports" element={<ReportsPage narrowed />} />
      </Route>
      <Route
        path="/manager/dashboard"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <DashboardPlaceholderPage role="MANAGER" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rmg/dashboard"
        element={
          <ProtectedRoute allowedRoles={['RMG']}>
            <DashboardPlaceholderPage role="RMG" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/associate/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ASSOCIATE']}>
            <DashboardPlaceholderPage role="ASSOCIATE" />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
