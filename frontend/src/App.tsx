import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import DashboardPlaceholderPage from './pages/DashboardPlaceholderPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminLayout from './pages/admin/AdminLayout'

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
