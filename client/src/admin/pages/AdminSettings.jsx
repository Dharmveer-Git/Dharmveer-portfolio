import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../../api/api.js'

export default function AdminSettings() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', currentPassword: '', newPassword: '', confirmPassword: '' })
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let active = true
    apiRequest('/admin/me').then(({ admin }) => { if (active) setForm((current) => ({ ...current, email: admin.email })) }).catch((error) => { if (active) setStatus(error.message) })
    return () => { active = false }
  }, [])
  async function save(event) {
    event.preventDefault()
    if (form.newPassword !== form.confirmPassword) { setStatus('New passwords do not match.'); return }
    setBusy(true)
    try {
      await apiRequest('/admin/account', { method: 'PUT', body: JSON.stringify({ email: form.email, currentPassword: form.currentPassword, newPassword: form.newPassword }) })
      localStorage.removeItem('portfolio_token')
      navigate('/admin/login', { replace: true, state: { message: 'Account updated. Sign in with your updated credentials.' } })
    } catch (error) { setStatus(error.message) } finally { setBusy(false) }
  }
  return <form className="content-form" onSubmit={save}>
    <h2>Admin account</h2><p>Your current password is required. Leave the new password blank to change only your email.</p>
    {status ? <p className="admin-notice" role="status">{status}</p> : null}
    <fieldset disabled={busy} className="editor-fields"><div className="form-grid">
      <label>Email<input type="email" autoComplete="username" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
      <label>Current password<input type="password" autoComplete="current-password" required value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} /></label>
      <label>New password (12+ characters)<input type="password" autoComplete="new-password" minLength="12" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} /></label>
      <label>Confirm new password<input type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /></label>
    </div><div className="form-actions"><button>{busy ? 'Updating?' : 'Update account'}</button><button type="button" onClick={() => { localStorage.removeItem('portfolio_token'); navigate('/admin/login') }}>Logout</button></div></fieldset>
  </form>
}
