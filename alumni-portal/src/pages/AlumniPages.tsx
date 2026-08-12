import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, apiRequest } from '../lib/api'

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

export function ActivatePage() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resetToken, setResetToken] = useState('')
  const params = new URLSearchParams(window.location.search)
  const tokenFromQuery = params.get('token') ?? ''

  async function onActivate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    const form = new FormData(event.currentTarget)
    try {
      const data = await apiRequest<{ reset_token: string }>('/auth/activate', {
        method: 'POST',
        body: JSON.stringify({
          token: form.get('token'),
        }),
      })
      setResetToken(data.reset_token)
      setSuccess('Account activated. Set your password to finish.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Activation failed')
    }
  }

  async function onSetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    const form = new FormData(event.currentTarget)
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: resetToken,
          password: form.get('password'),
        }),
      })
      setSuccess('Password set. You can sign in now.')
      setResetToken('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Password reset failed')
    }
  }

  return (
    <section className="panel" style={{ margin: '1.5rem 0 3rem', maxWidth: 480 }}>
      <h2>Activate account</h2>
      {!resetToken ? (
        <form className="form" onSubmit={onActivate} style={{ marginTop: '1rem' }}>
          <label>
            Activation token
            <input name="token" defaultValue={tokenFromQuery} required />
          </label>
          {error ? <p className="error">{error}</p> : null}
          {success ? <p className="success">{success}</p> : null}
          <button className="btn btn-primary">Activate</button>
        </form>
      ) : (
        <form className="form" onSubmit={onSetPassword} style={{ marginTop: '1rem' }}>
          <label>
            New password
            <input name="password" type="password" minLength={8} required />
          </label>
          {error ? <p className="error">{error}</p> : null}
          {success ? <p className="success">{success}</p> : null}
          <button className="btn btn-primary">Set password</button>
        </form>
      )}
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
