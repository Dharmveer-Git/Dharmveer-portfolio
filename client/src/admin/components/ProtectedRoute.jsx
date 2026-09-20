import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { apiRequest } from '../../api/api.js'

export default function ProtectedRoute() {
  const token = localStorage.getItem('portfolio_token')
  const [authorized, setAuthorized] = useState(null)

  useEffect(() => {
    if (!token) return
    let ignore = false
    apiRequest('/admin/me').then(() => { if (!ignore) setAuthorized(true) }).catch(() => {
      localStorage.removeItem('portfolio_token')
      if (!ignore) setAuthorized(false)
    })
    return () => { ignore = true }
  }, [token])

  if (!token || authorized === false) return <Navigate to="/admin/login" replace />
  if (authorized === null) return <main className="admin-login"><p>Checking secure session…</p></main>
  return <Outlet />
}
