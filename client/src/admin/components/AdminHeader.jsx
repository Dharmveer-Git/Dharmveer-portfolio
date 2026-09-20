import { useLocation } from 'react-router-dom'

const titles = { dashboard: 'Overview', profile: 'Profile / Hero', about: 'About', projects: 'Projects Management', skills: 'Skills Management', experience: 'Experience', education: 'Education', certificates: 'Certificates', resume: 'Resume', messages: 'Contact Messages', social: 'Social Links', settings: 'Website Settings', seo: 'SEO Settings', account: 'Admin Settings', services: 'Services' }

export default function AdminHeader() {
  const page = useLocation().pathname.split('/').pop()
  return (
    <header className="admin-header">
      <div><p className="admin-label">Content management</p><h1>{titles[page] || page}</h1></div>
      <a href="/" target="_blank" rel="noopener noreferrer">View website ↗</a>
    </header>
  )
}
