import { Outlet } from 'react-router-dom'
import AdminHeader from './AdminHeader.jsx'
import AdminSidebar from './AdminSidebar.jsx'
import '../styles/admin.css'
import '../styles/admin-responsive.css'
import '../styles/admin-ui.css'
import '../styles/admin-polish.css'

export default function AdminLayout() {
  return <div className="admin-layout"><AdminSidebar /><div className="admin-content"><AdminHeader /><main className="admin-page"><Outlet /></main></div></div>
}
