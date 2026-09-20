import AdminIcon from './AdminIcon.jsx'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const links = [
  ['dashboard', 'Overview'], ['profile', 'Hero'], ['about', 'About'],
  ['skills', 'Skills'], ['projects', 'Projects'], ['experience', 'Experience'],
  ['education', 'Education'], ['certificates', 'Certificates'], ['services', 'Services'],
  ['resume', 'Resume'], ['social', 'Social Links'], ['messages', 'Contact Messages'], ['seo', 'SEO Settings'], ['settings', 'Website Settings'], ['account', 'Admin Settings'],
]

export default function AdminSidebar() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  function logout() {
    localStorage.removeItem('portfolio_token')
    navigate('/admin/login')
  }
  return (
    <aside className="admin-sidebar" onKeyDown={(event) => { if (event.key === 'Escape' && open) { setOpen(false); event.currentTarget.querySelector('.admin-menu-toggle')?.focus() } }}>
      <a className="admin-brand" href="/">DK<span>.</span></a>
      <p>Portfolio Admin</p>
      <button className="admin-menu-toggle" aria-expanded={open} aria-controls="admin-navigation" onClick={() => setOpen(!open)}>Menu</button>
      <nav id="admin-navigation" className={open ? 'is-open' : ''}>{links.map(([path, label]) => <NavLink onClick={() => setOpen(false)} key={path} to={`/admin/${path}`}><AdminIcon name={path} /><span>{label}</span></NavLink>)}</nav>
      <button className="logout" onClick={logout}>Log out</button>
    </aside>
  )
}
