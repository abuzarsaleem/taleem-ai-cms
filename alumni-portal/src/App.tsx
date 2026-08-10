import { NavLink, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ThemeToggle } from './components/theme-toggle'
import {
  ActivatePage,
  HomePage,
  ProfilePage,
} from './pages/AlumniPages'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { ThemeProvider } from './theme/ThemeProvider'

function Shell() {
  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          Taleem Alumni
        </NavLink>
        <nav className="nav">
          <NavLink to="/register">Register</NavLink>
          <NavLink to="/activate">Activate</NavLink>
          <NavLink to="/login">Login</NavLink>
          <NavLink to="/profile">Profile</NavLink>
          <ThemeToggle />
        </nav>
      </header>
      <Outlet />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route element={<Shell />}>
            <Route index element={<HomePage />} />
            <Route path="activate" element={<ActivatePage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}
