import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiError, apiRequest } from '../lib/api'

type DashboardData = {
  pending_count: number
  approved_count: number
  rejected_count: number
  alumni_count: number
}

type RegistrationItem = {
  registration_id: string
  full_name: string
  email: string
  status: string
  campus: string
  degree: string
  submitted_at: string
  rejection_reason?: string | null
  alumni?: {
    alumni_id: string
    registration_ref: string
    status: string
  } | null
}

export function LoginPage() {
  const { setSession, token } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (token) return <Navigate to="/" replace />

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
      }>('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
        }),
      })
      setSession({
        token: data.access_token,
        userId: data.user_id,
        role: data.role,
      })
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-panel">
        <h1>Admin Portal</h1>
        <p className="muted">Sign in to review alumni registrations.</p>
        <form className="form" onSubmit={onSubmit} style={{ marginTop: '1rem' }}>
          <label>
            Email
            <input
              name="email"
              type="email"
              defaultValue="admin@taleem.local"
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              defaultValue="Admin@123"
              required
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { token } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const result = await apiRequest<DashboardData>('/admin/dashboard', {
          token,
        })
        setData(result)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load')
      }
    })()
  }, [token])

  return (
    <div>
      <div className="top">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Registration overview</p>
        </div>
        <Link className="btn secondary" to="/registrations">
          View registrations
        </Link>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <div className="cards">
        <div className="card">
          <span className="muted">Pending</span>
          <strong>{data?.pending_count ?? '—'}</strong>
        </div>
        <div className="card">
          <span className="muted">Approved</span>
          <strong>{data?.approved_count ?? '—'}</strong>
        </div>
        <div className="card">
          <span className="muted">Rejected</span>
          <strong>{data?.rejected_count ?? '—'}</strong>
        </div>
        <div className="card">
          <span className="muted">Alumni</span>
          <strong>{data?.alumni_count ?? '—'}</strong>
        </div>
      </div>
    </div>
  )
}

export function RegistrationsPage() {
  const { token } = useAuth()
  const [status, setStatus] = useState('')
  const [items, setItems] = useState<RegistrationItem[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const query = status ? `?status=${status}` : ''
        const result = await apiRequest<RegistrationItem[]>(
          `/admin/registrations${query}`,
          { token },
        )
        setItems(result)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load')
      }
    })()
  }, [token, status])

  return (
    <div>
      <div className="top">
        <div>
          <h1>Registrations</h1>
          <p className="muted">Review and decide on applications</p>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
      {error ? <p className="error">{error}</p> : null}
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Campus / Degree</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.registration_id}>
                <td>{item.full_name}</td>
                <td>{item.email}</td>
                <td>
                  {item.campus}
                  <br />
                  <span className="muted">{item.degree}</span>
                </td>
                <td>
                  <span className="badge">{item.status}</span>
                </td>
                <td>
                  <Link to={`/registrations/${item.registration_id}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td colSpan={5} className="muted">
                  No registrations found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function RegistrationDetailPage() {
  const { id } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [item, setItem] = useState<RegistrationItem | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      const result = await apiRequest<RegistrationItem>(
        `/admin/registrations/${id}`,
        { token },
      )
      setItem(result)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load')
    }
  }

  useEffect(() => {
    void load()
  }, [id, token])

  async function approve() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await apiRequest(`/admin/registrations/${id}/approve`, {
        method: 'POST',
        token,
      })
      setMessage('Approved. Activation email queued.')
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Approve failed')
    } finally {
      setBusy(false)
    }
  }

  async function reject() {
    if (!reason.trim()) {
      setError('Rejection reason is required')
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await apiRequest(`/admin/registrations/${id}/reject`, {
        method: 'POST',
        token,
        body: JSON.stringify({ reason }),
      })
      setMessage('Rejected.')
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Reject failed')
    } finally {
      setBusy(false)
    }
  }

  async function generateCard() {
    if (!item?.alumni?.alumni_id) return
    setBusy(true)
    setError('')
    try {
      const card = await apiRequest<{ alumniQrCode: string }>(
        `/admin/alumni/${item.alumni.alumni_id}/card`,
        { method: 'POST', token, body: JSON.stringify({}) },
      )
      setMessage(`Card generated: ${card.alumniQrCode}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Card generation failed')
    } finally {
      setBusy(false)
    }
  }

  if (!item && !error) return <p className="muted">Loading…</p>

  return (
    <div>
      <div className="top">
        <div>
          <button className="btn secondary" onClick={() => navigate(-1)}>
            Back
          </button>
          <h1 style={{ marginTop: '0.75rem' }}>{item?.full_name}</h1>
          <p className="muted">{item?.email}</p>
        </div>
        <span className="badge">{item?.status}</span>
      </div>

      <div className="panel" style={{ display: 'grid', gap: '0.75rem' }}>
        <div>
          <strong>Campus:</strong> {item?.campus}
        </div>
        <div>
          <strong>Degree:</strong> {item?.degree}
        </div>
        {item?.alumni ? (
          <div>
            <strong>Alumni ref:</strong> {item.alumni.registration_ref}
          </div>
        ) : null}
        {item?.rejection_reason ? (
          <div>
            <strong>Rejection reason:</strong> {item.rejection_reason}
          </div>
        ) : null}

        {item?.status === 'PENDING' ? (
          <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button className="btn" disabled={busy} onClick={() => void approve()}>
              Approve
            </button>
            <label>
              Rejection reason
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </label>
            <button
              className="btn danger"
              disabled={busy}
              onClick={() => void reject()}
            >
              Reject
            </button>
          </div>
        ) : null}

        {item?.status === 'APPROVED' && item.alumni?.alumni_id ? (
          <button
            className="btn secondary"
            disabled={busy}
            onClick={() => void generateCard()}
          >
            Generate alumni card QR
          </button>
        ) : null}

        {error ? <p className="error">{error}</p> : null}
        {message ? <p style={{ color: 'var(--ok)' }}>{message}</p> : null}
      </div>
    </div>
  )
}
