import { NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import {
  DashboardPage,
  LoginPage,
  RegistrationDetailPage,
  RegistrationsPage,
} from './pages/AdminPages'

function RequireAuth() {
  const { token, clearSession, role } = useAuth()
  if (!token) return <Navigate to="/login" replace />

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">Taleem Admin</div>
        <nav>
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/registrations">Registrations</NavLink>
          <button className="linkish" onClick={clearSession}>
            Sign out ({role})
          </button>
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route index element={<DashboardPage />} />
          <Route path="registrations" element={<RegistrationsPage />} />
          <Route
            path="registrations/:id"
            element={<RegistrationDetailPage />}
          />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
