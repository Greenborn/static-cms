import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Pages from './pages/Pages'
import ContentTypes from './pages/ContentTypes'
import Views from './pages/Views'
import Media from './pages/Media'
import Formatters from './pages/Formatters'
import SiteBuilder from './pages/SiteBuilder'
import Settings from './pages/Settings'

function App() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pages" element={<Pages />} />
        <Route path="/content-types" element={<ContentTypes />} />
        <Route path="/views" element={<Views />} />
        <Route path="/media" element={<Media />} />
        <Route path="/formatters" element={<Formatters />} />
        <Route path="/site-builder" element={<SiteBuilder />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}

export default App 