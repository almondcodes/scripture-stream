import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Verses from './pages/Verses'
import Playlists from './pages/Playlists'
import OBS from './pages/OBS'
import Templates from './pages/Templates'
import Profile from './pages/Profile'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <SocketProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/dashboard" replace /> : <Register />} 
          />

          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              user ? (
                <Layout>
                  <Dashboard />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/verses" 
            element={
              user ? (
                <Layout>
                  <Verses />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/playlists" 
            element={
              user ? (
                <Layout>
                  <Playlists />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/obs" 
            element={
              user ? (
                <Layout>
                  <OBS />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/templates" 
            element={
              user ? (
                <Layout>
                  <Templates />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          <Route 
            path="/profile" 
            element={
              user ? (
                <Layout>
                  <Profile />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </SocketProvider>
  )
}

export default App
