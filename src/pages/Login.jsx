import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'

export default function Login() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const setUser = useAppStore((s) => s.setUser)

  async function handleGoogleLogin() {
    if (!supabase) return
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (err) { setError(err.message); setLoading(false) }
  }

  async function handleEmailAuth(e) {
    e.preventDefault()
    if (!supabase || !email || !password) return
    setLoading(true)
    setError(null)

    if (tab === 'signup') {
      const { error: err } = await supabase.auth.signUp({ email, password })
      if (err) { setError(err.message) }
      else { setSuccess(t('login.checkEmail')) }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) { setError(err.message) }
    }
    setLoading(false)
  }

  function handleGuestMode() {
    // Bypass login — set a local guest user so the app proceeds
    setUser({ id: 'guest', email: 'demo@skytrack.app', name: 'Demo User', avatar: null, tier: 'Free Tier' })
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-y-auto py-10 px-6"
      style={{ background: 'var(--color-surface)' }}
    >
      {/* Background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--color-primary-fixed) 0%, transparent 70%)', filter: 'blur(60px)' }}
      />

      <motion.div
        className="w-full max-w-sm relative"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 shadow-lg"
            style={{ background: 'linear-gradient(160deg, var(--color-primary) 0%, var(--color-primary-container) 100%)' }}
          >
            <span
              className="material-symbols-rounded text-white"
              style={{ fontSize: 40, fontVariationSettings: "'FILL' 1" }}
            >
              flight
            </span>
          </div>
          <h1
            className="font-['Manrope'] font-black text-3xl text-[var(--color-primary)]"
            style={{ letterSpacing: '-1px' }}
          >
            SkyTrack
          </h1>
          <p className="font-['Inter'] text-sm text-[var(--color-on-surface-variant)] mt-1">
            {t('login.tagline')}
          </p>
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-['Inter'] font-semibold text-sm mb-6 active:scale-[0.98] transition-transform disabled:opacity-60"
          style={{
            background: 'var(--color-surface-container-lowest)',
            boxShadow: '0 2px 12px rgba(26,27,33,0.08), 0 0 0 1px var(--color-outline-variant)',
            color: 'var(--color-on-surface)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {t('login.continueWithGoogle')}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ background: 'var(--color-outline-variant)' }} />
          <span className="text-xs font-semibold font-['Inter'] text-[var(--color-outline)]">{t('login.or')}</span>
          <div className="flex-1 h-px" style={{ background: 'var(--color-outline-variant)' }} />
        </div>

        {/* Tab switcher */}
        <div
          className="p-1 flex rounded-2xl mb-5"
          style={{ background: 'var(--color-surface-container-high)' }}
        >
          {['signin', 'signup'].map((tabId) => (
            <button
              key={tabId}
              onClick={() => { setTab(tabId); setError(null); setSuccess(null) }}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm font-['Inter'] transition-all"
              style={
                tab === tabId
                  ? { background: 'var(--color-surface-container-lowest)', color: 'var(--color-primary)', boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }
                  : { color: 'var(--color-on-surface-variant)' }
              }
            >
              {tabId === 'signin' ? t('login.signIn') : t('login.createAccount')}
            </button>
          ))}
        </div>

        {/* Email / Password form */}
        <form onSubmit={handleEmailAuth} className="space-y-3 mb-4">
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              id="email"
              type="email"
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-4 rounded-2xl font-['Inter'] text-sm outline-none transition-shadow"
              style={{
                background: 'var(--color-surface-container-lowest)',
                color: 'var(--color-on-surface)',
                boxShadow: '0 0 0 1px var(--color-outline-variant)',
              }}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              type="password"
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-5 py-4 rounded-2xl font-['Inter'] text-sm outline-none transition-shadow"
              style={{
                background: 'var(--color-surface-container-lowest)',
                color: 'var(--color-on-surface)',
                boxShadow: '0 0 0 1px var(--color-outline-variant)',
              }}
            />
          </div>

          {error && (
            <p className="text-xs font-semibold font-['Inter'] text-center" style={{ color: 'var(--color-error)' }}>
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs font-semibold font-['Inter'] text-center" style={{ color: 'var(--color-secondary)' }}>
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || Boolean(success)}
            className="w-full py-4 rounded-2xl font-['Manrope'] font-bold text-base text-white active:scale-[0.98] transition-transform disabled:opacity-60"
            style={{
              background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-container))',
              boxShadow: '0 8px 24px rgba(0,49,120,0.20)',
            }}
          >
            {loading ? '…' : tab === 'signin' ? t('login.signIn') : t('login.createAccount')}
          </button>
        </form>

        {/* Guest mode */}
        <button
          onClick={handleGuestMode}
          className="w-full py-3 font-['Inter'] text-sm font-semibold text-center active:opacity-60 transition-opacity"
          style={{ color: 'var(--color-outline)' }}
        >
          {t('login.continueWithoutAccount')}
        </button>
      </motion.div>
    </div>
  )
}
