import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Portfolio from './Portfolio.jsx'

export default function RootRoute() {
  const [hash, setHash] = useState(() => window.location.hash.toLowerCase())

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash.toLowerCase())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (hash === '#admin' || hash === '#admin/') {
    return <Navigate to="/admin/login" replace />
  }

  return <Portfolio />
}

