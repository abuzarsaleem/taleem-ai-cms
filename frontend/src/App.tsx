import { NavLink, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import {
  ActivatePage,
  HomePage,
  LoginPage,
  ProfilePage,
  RegisterPage,
} from './pages/AlumniPages'

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
        </nav>
      </header>
      <Outlet />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<HomePage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="activate" element={<ActivatePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
