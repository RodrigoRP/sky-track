import { useEffect } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import CreateAlert from './pages/CreateAlert'
import AlertDetail from './pages/AlertDetail'
import Alerts from './pages/Alerts'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import { useNavDirection } from './hooks/useNavDirection'
import { useAppStore } from './store/useAppStore'
import Toaster from './components/Toaster'
import Onboarding from './components/Onboarding'
import DesktopSidebar from './components/DesktopSidebar'
import Login from './pages/Login'
import { useAuth } from './hooks/useAuth'
import { isSupabaseEnabled } from './lib/supabase'

export default function App() {
  const location = useLocation()
  const direction = useNavDirection()
  const theme = useAppStore((s) => s.settings.theme)
  const onboardingDone = useAppStore((s) => s.settings.onboardingDone)
  const setOnboardingDone = useAppStore((s) => s.setOnboardingDone)
  const { user, loading } = useAuth()

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.dataset.theme = 'dark'
    else if (theme === 'light') root.dataset.theme = 'light'
    else delete root.dataset.theme
  }, [theme])

  // Supabase-gated: show loading spinner while session resolves
  if (isSupabaseEnabled && loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
        <span className="material-symbols-rounded text-[var(--color-primary)] text-[40px] animate-spin">
          progress_activity
        </span>
      </div>
    )
  }

  // Supabase-gated: require login (guest user set via Login page bypasses this)
  if (isSupabaseEnabled && !user) {
    return <Login />
  }

  if (!onboardingDone) {
    return <Onboarding onComplete={setOnboardingDone} />
  }

  return (
    <ErrorBoundary>
      <DesktopSidebar />
      <Toaster />
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard direction={direction} />} />
        <Route path="/create-alert" element={<CreateAlert direction={direction} />} />
        <Route path="/alert/:id" element={<AlertDetail direction={direction} />} />
        <Route path="/alerts" element={<Alerts direction={direction} />} />
        <Route path="/notifications" element={<Notifications direction={direction} />} />
        <Route path="/settings" element={<Settings direction={direction} />} />
      </Routes>
    </ErrorBoundary>
  )
}
