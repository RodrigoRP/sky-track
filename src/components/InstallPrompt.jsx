import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DISMISSED_KEY = 'skytrack-install-dismissed'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem(DISMISSED_KEY)) return

    function onBeforeInstall(e) {
      e.preventDefault()
      setDeferredPrompt(e)
      // Short delay so it doesn't pop up instantly on load
      setTimeout(() => setVisible(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setDeferredPrompt(null)
    dismiss()
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
          />
          <motion.div
            className="fixed bottom-0 left-0 w-full z-50 rounded-t-3xl px-6 pt-6 pb-10"
            style={{
              background: 'var(--color-surface-container-lowest)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
              maxWidth: 430,
              margin: '0 auto',
              right: 0,
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0, transition: { type: 'spring', damping: 28, stiffness: 300 } }}
            exit={{ y: '100%', transition: { duration: 0.22 } }}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ background: 'var(--color-outline-variant)' }} />

            <div className="flex items-center gap-4 mb-5">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #0d47a1, #003178)' }}
              >
                <span className="material-symbols-rounded text-white text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  flight
                </span>
              </div>
              <div>
                <h3 className="font-['Manrope'] font-bold text-lg text-[var(--color-on-surface)]" style={{ letterSpacing: '-0.3px' }}>
                  Add SkyTrack to Home Screen
                </h3>
                <p className="text-xs text-[var(--color-outline)] font-['Inter'] mt-0.5">
                  Instant access, works offline
                </p>
              </div>
            </div>

            <ul className="space-y-2 mb-7">
              {[
                { icon: 'bolt', text: 'Launches in 0.3s — no browser UI' },
                { icon: 'wifi_off', text: 'Works offline — your alerts stay available' },
                { icon: 'notifications_active', text: 'Ready for push notifications' },
              ].map(({ icon, text }) => (
                <li key={icon} className="flex items-center gap-3">
                  <span className="material-symbols-rounded text-[var(--color-primary)] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {icon}
                  </span>
                  <span className="text-sm text-[var(--color-on-surface-variant)] font-['Inter']">{text}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-3">
              <button
                onClick={install}
                className="w-full py-4 rounded-2xl font-['Manrope'] font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                style={{
                  background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-container))',
                  boxShadow: '0 8px 24px rgba(0,49,120,0.2)',
                }}
              >
                <span className="material-symbols-rounded text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_to_home_screen</span>
                Install App
              </button>
              <button
                onClick={dismiss}
                className="w-full py-3 text-sm font-semibold font-['Inter'] text-[var(--color-outline)] active:opacity-60 transition-opacity"
              >
                Not now
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
