import { useState } from 'react'
import { Navigate, useNavigate, useLocation } from 'react-router-dom'
import { loginAdmin } from '../../api/api.js'
import '../styles/admin.css'

const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds))

async function loginWithDatabaseRetry(form) {
  let lastError
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await loginAdmin(form)
    } catch (error) {
      lastError = error
      if (error.status !== 503 || attempt === 2) throw error
      await wait(2000)
    }
  }
  throw lastError
}

export default function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState({ loading: false, error: '' })
  if (localStorage.getItem('portfolio_token')) return <Navigate to="/admin/dashboard" replace />

  async function submit(event) {
    event.preventDefault()
    setStatus({ loading: true, error: '' })
    try {
      const data = await loginWithDatabaseRetry(form)
      localStorage.setItem('portfolio_token', data.token)
      navigate('/admin/dashboard')
    } catch (error) {
      setStatus({ loading: false, error: error.message })
    }
  }

  return (
    <main className="admin-login">
      <form onSubmit={submit}>
        <a href="/" className="admin-brand">DK<span>.</span></a>
        <p className="admin-label">Secure administration</p>
        <h1>Welcome back.</h1>
        {location.state?.message ? <p role="status">{location.state.message}</p> : null}
        <label>Email<input type="email" autoComplete="username" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength="8" /></label>
        {status.error ? <p className="admin-error" role="alert">{status.error}</p> : null}
        <button disabled={status.loading}>{status.loading ? 'Signing in…' : 'Sign in securely'}</button>
        <a href="/">← Return to portfolio</a>
      </form>
    </main>
  )
}
