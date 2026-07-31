import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, apiRequest } from '../lib/api'

type RegisterResponse = {
  registration_id: string
  status: string
  message: string
}

export function HomePage() {
  return (
    <section className="hero">
      <p className="muted">Taleem Alumni Network</p>
      <h1>Stay connected with your institution.</h1>
      <p>
        Register as an alumnus, activate your account after admin approval, and
        manage your profile.
      </p>
      <div className="nav">
        <Link className="btn btn-primary" to="/register">
          Register
        </Link>
        <Link className="btn btn-ghost" to="/login">
          Sign in
        </Link>
      </div>
    </section>
  )
}

export function RegisterPage() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const form = new FormData(event.currentTarget)
    try {
      const data = await apiRequest<RegisterResponse>('/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: form.get('full_name'),
          email: form.get('email'),
          phone_number: form.get('phone_number') || undefined,
          campus: form.get('campus'),
          degree: form.get('degree'),
          roll_number: form.get('roll_number'),
          graduation_year: Number(form.get('graduation_year')),
          cgpa: form.get('cgpa') ? Number(form.get('cgpa')) : undefined,
        }),
      })
      setSuccess(
        `${data.message}. Reference: ${data.registration_id} (${data.status})`,
      )
      event.currentTarget.reset()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="panel" style={{ margin: '1.5rem 0 3rem' }}>
      <h2>Alumni registration</h2>
      <p className="muted">Submit your details for institutional verification.</p>
      <form className="form" onSubmit={onSubmit} style={{ marginTop: '1rem' }}>
        <div className="form-grid">
          <label>
            Full name
            <input name="full_name" required />
          </label>
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Phone
            <input name="phone_number" />
          </label>
          <label>
            Campus
            <input name="campus" required />
          </label>
          <label>
            Degree
            <input name="degree" required />
          </label>
          <label>
            Roll number
            <input name="roll_number" required />
          </label>
          <label>
            Graduation year
            <input name="graduation_year" type="number" required />
          </label>
          <label>
            CGPA
            <input name="cgpa" type="number" step="0.01" min="0" max="4" />
          </label>
        </div>
        {error ? <p className="error">{error}</p> : null}
        {success ? <p className="success">{success}</p> : null}
        <button className="btn btn-primary" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit registration'}
        </button>
      </form>
    </section>
  )
}

export function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const form = new FormData(event.currentTarget)
    try {
      const data = await apiRequest<{
        access_token: string
        user_id: string
        role: string
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
        }),
      })
      localStorage.setItem(
        'taleem_alumni_auth',
        JSON.stringify({
          token: data.access_token,
          userId: data.user_id,
          role: data.role,
        }),
      )
      window.location.href = '/profile'
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="panel" style={{ margin: '1.5rem 0 3rem', maxWidth: 480 }}>
      <h2>Alumni sign in</h2>
      <form className="form" onSubmit={onSubmit} style={{ marginTop: '1rem' }}>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" required />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn btn-primary" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </section>
  )
}

export function ActivatePage() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const params = new URLSearchParams(window.location.search)
  const tokenFromQuery = params.get('token') ?? ''

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    const form = new FormData(event.currentTarget)
    try {
      await apiRequest('/activate', {
        method: 'POST',
        body: JSON.stringify({
          token: form.get('token'),
          password: form.get('password'),
        }),
      })
      setSuccess('Account activated. You can sign in now.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Activation failed')
    }
  }

  return (
    <section className="panel" style={{ margin: '1.5rem 0 3rem', maxWidth: 480 }}>
      <h2>Activate account</h2>
      <form className="form" onSubmit={onSubmit} style={{ marginTop: '1rem' }}>
        <label>
          Activation token
          <input name="token" defaultValue={tokenFromQuery} required />
        </label>
        <label>
          New password
          <input name="password" type="password" minLength={8} required />
        </label>
        {error ? <p className="error">{error}</p> : null}
        {success ? <p className="success">{success}</p> : null}
        <button className="btn btn-primary">Activate</button>
      </form>
    </section>
  )
}

export function ProfilePage() {
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)

  async function load() {
    try {
      const raw = localStorage.getItem('taleem_alumni_auth')
      const session = raw ? JSON.parse(raw) : null
      if (!session?.token) {
        window.location.href = '/login'
        return
      }
      const data = await apiRequest<Record<string, unknown>>('/me/profile', {
        token: session.token,
      })
      setProfile(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load profile')
    }
  }

  if (!profile && !error) {
    void load()
  }

  return (
    <section className="panel" style={{ margin: '1.5rem 0 3rem' }}>
      <h2>My profile</h2>
      {error ? <p className="error">{error}</p> : null}
      {profile ? (
        <pre style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
          {JSON.stringify(profile, null, 2)}
        </pre>
      ) : (
        <p className="muted">Loading profile…</p>
      )}
    </section>
  )
}
