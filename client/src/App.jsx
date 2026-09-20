import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Portfolio from './pages/Portfolio.jsx'
import RootRoute from './pages/RootRoute.jsx'
import ProjectDetail from './pages/ProjectDetail.jsx'
import Privacy from './pages/Privacy.jsx'
import NotFound from './pages/NotFound.jsx'
import './styles/portfolio.css'
import './styles/portfolio-polish.css'

const AdminSettings = lazy(() => import('./admin/pages/AdminSettings.jsx'))
const AdminLogin = lazy(() => import('./admin/pages/AdminLogin.jsx'))
const Dashboard = lazy(() => import('./admin/pages/Dashboard.jsx'))
const ManageContent = lazy(() => import('./admin/pages/ManageContent.jsx'))
const ManageSettings = lazy(() => import('./admin/pages/ManageSettings.jsx'))
const ManageSocialLinks = lazy(() => import('./admin/pages/ManageSocialLinks.jsx'))
const ProtectedRoute = lazy(() => import('./admin/components/ProtectedRoute.jsx'))
const AdminLayout = lazy(() => import('./admin/components/AdminLayout.jsx'))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<main className="route-loading"><p className="kicker">Loading…</p></main>}>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/projects" element={<Portfolio />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            {['profile', 'about', 'skills', 'projects', 'experience', 'education', 'certificates', 'services', 'messages'].map((path) => <Route key={path} path={path} element={<ManageContent key={path} />} />)}
            <Route path="social" element={<ManageSocialLinks />} />
            <Route path="resume" element={<ManageSettings mode="resume" />} />
            <Route path="seo" element={<ManageSettings mode="seo" />} />
            <Route path="account" element={<AdminSettings />} />
            <Route path="settings" element={<ManageSettings mode="website" />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
