import AdminIcon from '../components/AdminIcon.jsx'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../api/api.js'

const cards = [['projects', 'Projects'], ['skills', 'Skills'], ['certificates', 'Certificates'], ['messages', 'Messages'], ['experience', 'Experience']]
export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    apiRequest('/admin/overview').then((result) => { if (active) setData(result) }).catch((error) => { if (active) setError(error.message) })
    return () => { active = false }
  }, [])
  if (!data) return <p className="admin-notice" role="status">{error || 'Loading dashboard...'}</p>
  return <>
    <section className="dashboard-welcome"><div><p className="admin-eyebrow">YOUR WORKSPACE</p><h2>Make your next great impression.</h2><p>Keep your work, experience and profile up to date.</p></div><Link to="/admin/projects">+ Add a project</Link></section>
    <section className="overview-grid">{cards.map(([key, label]) => <article key={key}><div className="stat-heading"><span>Total {label}</span><span className="stat-icon"><AdminIcon name={key} /></span></div><strong>{key === 'messages' ? data.messages : data.counts?.[key] || 0}</strong><Link to={`/admin/${key}`}>Manage {label}</Link></article>)}</section>
    <div className="dashboard-panels"><section className="content-form"><h2>Quick actions</h2><div className="dashboard-actions">{[['profile', 'Hero & profile'], ['about', 'About'], ['projects', 'Projects'], ['experience', 'Experience'], ['education', 'Education'], ['skills', 'Skills'], ['resume', 'Resume'], ['certificates', 'Certificates'], ['social', 'Social links'], ['messages', 'Contact messages'], ['settings', 'Website & footer'], ['seo', 'SEO settings']].map(([path, label]) => <Link key={path} to={`/admin/${path}`}>{label}<span aria-hidden="true">&rarr;</span></Link>)}</div></section>
    <section className="content-form"><h2>Recent messages</h2><p>{data.unread} unread messages</p>{data.recentMessages?.length ? <ul className="recent-messages">{data.recentMessages.map((item) => <li key={item._id}><Link to="/admin/messages">{item.subject}</Link><span>{item.name} / {item.read ? 'Read' : 'Unread'}</span></li>)}</ul> : <p>No messages yet.</p>}</section></div>
  </>
}
