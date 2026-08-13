import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function HomePage() {
  const { token } = useAuth()
  if (token) return <Navigate to="/home" replace />

  return (
    <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm font-medium text-primary">Taleem Alumni Network</p>
      <h1 className="text-4xl font-semibold tracking-tight">
        Stay connected with your institution.
      </h1>
      <p className="max-w-xl text-muted-foreground">
        Register as an alumnus, activate your account after admin approval, and
        manage your profile.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          to="/register"
        >
          Register
        </Link>
        <Link
          className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium"
          to="/login"
        >
          Sign in
        </Link>
      </div>
    </section>
  )
}
