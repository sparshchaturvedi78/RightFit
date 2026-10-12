import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import DashboardPlaceholderPage from './pages/DashboardPlaceholderPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardPlaceholderPage role="ADMIN" />
          </ProtectedRoute>
        }
      />
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
