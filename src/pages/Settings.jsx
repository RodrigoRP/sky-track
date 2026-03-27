import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import PageTransition from '../components/PageTransition'
import { useAppStore } from '../store/useAppStore'
import { user as mockUser } from '../data/mockData'
import { supabase, isSupabaseEnabled } from '../lib/supabase'
import { subscribeToPush, unsubscribeFromPush, isPushSupported } from '../lib/pushNotifications'
import { useToast } from '../hooks/useToast'

// ── Reusable bottom sheet ─────────────────────────────────────────────────────
function BottomSheet({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <>
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 w-full z-50 rounded-t-3xl"
        style={{
          background: 'var(--color-surface-container-lowest)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
          maxWidth: 430,
          margin: '0 auto',
          right: 0,
        }}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h3 className="font-['Manrope'] font-bold text-lg text-[var(--color-on-surface)]">{title}</h3>
          <button onClick={onClose} className="active:scale-90 transition-transform">
            <span className="material-symbols-rounded text-[var(--color-outline)]">close</span>
          </button>
        </div>
        <div className="px-6 pb-8">{children}</div>
      </div>
    </>
  )
}

function SectionHeader({ children }) {
  return (
    <h3 className="font-['Manrope'] font-extrabold text-sm uppercase tracking-[0.15em] text-[var(--color-outline)] ml-1">
      {children}
    </h3>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={onChange}
      className="relative cursor-pointer shrink-0"
      style={{ width: 48, height: 24 }}
    >
      <div
        className="absolute inset-0 rounded-full transition-colors"
        style={{ background: checked ? 'var(--color-primary)' : 'var(--color-surface-container-highest)' }}
      />
      <div
        className="absolute top-[2px] w-5 h-5 bg-white rounded-full transition-transform"
        style={{ transform: checked ? 'translateX(24px)' : 'translateX(2px)' }}
      />
    </div>
  )
}

const CURRENCIES = ['USD ($)', 'EUR (€)', 'GBP (£)', 'JPY (¥)', 'BRL (R$)', 'CAD (C$)', 'AUD (A$)', 'SGD (S$)']
const LANGUAGES = ['English', 'Português']
const LANGUAGE_CODES = { 'English': 'en', 'Português': 'pt' }
const CABINS = ['Economy', 'Premium Economy', 'Business Class', 'First Class']

function SelectSheet({ open, onClose, title, options, current, onSelect }) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="space-y-1">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => { onSelect(opt); onClose() }}
            className="w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-colors active:bg-[var(--color-surface-container-low)]"
            style={{ background: current === opt ? 'var(--color-primary-fixed)' : 'transparent' }}
          >
            <span
              className="font-['Inter'] font-medium text-sm"
              style={{ color: current === opt ? 'var(--color-primary)' : 'var(--color-on-surface)' }}
            >
              {opt}
            </span>
            {current === opt && (
              <span className="material-symbols-rounded text-[var(--color-primary)] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            )}
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}

const BADGES = [
  { id: 'first_alert',   icon: 'radar',          labelKey: 'settings.badges.firstAlert',     check: (a) => a.length >= 1 },
  { id: 'five_alerts',   icon: 'auto_awesome',   labelKey: 'settings.badges.monitoringPro',  check: (a) => a.length >= 5 },
  { id: 'first_saving',  icon: 'savings',        labelKey: 'settings.badges.firstSaving',    check: (a, s) => s > 0 },
  { id: 'big_saver',     icon: 'military_tech',  labelKey: 'settings.badges.bigSaver',       check: (a, s) => s >= 500 },
]

export default function Settings({ direction }) {
  const settings = useAppStore((s) => s.settings)
  const toggleNotificationChannel = useAppStore((s) => s.toggleNotificationChannel)
  const updateSetting = useAppStore((s) => s.updateSetting)
  const alerts = useAppStore((s) => s.alerts)
  const storeUser = useAppStore((s) => s.user)
  const setUser = useAppStore((s) => s.setUser)
  const clearUser = useAppStore((s) => s.clearUser)
  const isRealtime = settings.alertFrequency === 'realtime'
  const toast = useToast()
  const { t, i18n } = useTranslation()

  // Use real user when logged in, fall back to mock for prototype mode
  const user = storeUser ?? mockUser

  const totalSavings = alerts.reduce((sum, a) => {
    const diff = (a.targetPrice ?? 0) - (a.currentBest ?? 0)
    return diff > 0 ? sum + diff : sum
  }, 0)
  const activeCount = alerts.filter((a) => a.status === 'active').length
  const badges = BADGES.map((b) => ({ ...b, unlocked: b.check(alerts, totalSavings) }))

  const [sheet, setSheet] = useState(null)
  const [editName, setEditName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef(null)

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !user?.id || !supabase) return
    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
      setUser({ ...user, avatar: publicUrl })
      toast(t('settings.toasts.photoUpdated'), 'success')
    } catch {
      toast(t('settings.toasts.photoError'), 'error')
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  async function handleSignOut() {
    if (isSupabaseEnabled && supabase) {
      await supabase.auth.signOut()
    }
    clearUser()
    setSheet(null)
  }

  const isPremium = user.tier === 'premium'
  const atAlertLimit = !isPremium && alerts.length >= 5

  async function handleUpgrade() {
    if (!isSupabaseEnabled || !supabase) return
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { origin: window.location.origin },
      })
      if (!error && data?.url) window.location.href = data.url
      else toast(t('settings.toasts.checkoutError'), 'error')
    } catch {
      toast(t('settings.toasts.checkoutError'), 'error')
    }
  }

  async function handleSaveName() {
    if (!editName.trim() || !isSupabaseEnabled || !supabase) return
    setSaving(true)
    await supabase.from('profiles').update({ name: editName.trim() }).eq('id', user.id)
    setUser({ ...user, name: editName.trim() })
    setSaving(false)
    setSheet(null)
    toast(t('settings.toasts.nameUpdated'), 'success')
  }

  async function handleChangePassword() {
    if (!newPassword || newPassword.length < 6) {
      toast(t('settings.toasts.passwordShort'), 'error')
      return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)
    if (error) toast(error.message, 'error')
    else { setNewPassword(''); setSheet(null); toast(t('settings.toasts.passwordUpdated'), 'success') }
  }

  function handleExportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      user: { name: user.name, email: user.email },
      alerts: alerts.map((a) => ({
        origin: a.origin,
        destination: a.destination,
        dates: a.dates,
        targetPrice: a.targetPrice,
        currentPrice: a.currentPrice,
        status: a.status,
        trend: a.trend,
        trendLabel: a.trendLabel,
      })),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `skytrack-data-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast(t('settings.toasts.dataExported'), 'success')
  }

  async function handleDeleteAccount() {
    if (!isSupabaseEnabled || !supabase) return
    setSaving(true)
    await supabase.rpc('delete_user').catch(() => {})
    await supabase.auth.signOut()
    clearUser()
    setSaving(false)
  }

  async function handlePushToggle() {
    if (!isPushSupported()) {
      toast(t('settings.toasts.pushNotSupported'), 'error')
      return
    }
    if (!settings.notifications.push) {
      const sub = await subscribeToPush()
      if (sub) {
        toggleNotificationChannel('push')
        toast(t('settings.toasts.pushEnabled'), 'success')
      } else if (Notification.permission === 'denied') {
        toast(t('settings.toasts.pushBlocked'), 'error')
      }
    } else {
      await unsubscribeFromPush()
      toggleNotificationChannel('push')
    }
  }

  return (
    <PageTransition direction={direction}>
    <div className="min-h-dvh bg-[var(--color-surface)]">
      <AppHeader />

      <main className="pt-28 pb-32 px-6 space-y-8">

        {/* Upgrade banner */}
        {isSupabaseEnabled && atAlertLimit && (
          <section
            className="rounded-3xl p-5 flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%)' }}
          >
            <span className="material-symbols-rounded text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              workspace_premium
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-['Manrope'] font-bold text-white text-sm">{t('settings.upgrade.limitTitle')}</p>
              <p className="text-white/80 text-xs font-['Inter']">{t('settings.upgrade.limitDesc')}</p>
            </div>
            <button
              onClick={handleUpgrade}
              className="px-4 py-2 rounded-2xl font-['Manrope'] font-bold text-xs shrink-0"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
            >
              {t('common.upgrade')}
            </button>
          </section>
        )}

        {/* Premium badge for premium users */}
        {isSupabaseEnabled && isPremium && (
          <section
            className="rounded-3xl p-4 flex items-center gap-3"
            style={{ background: 'var(--color-secondary-container)' }}
          >
            <span className="material-symbols-rounded text-[var(--color-secondary)]" style={{ fontVariationSettings: "'FILL' 1" }}>
              workspace_premium
            </span>
            <p className="font-['Inter'] font-semibold text-sm text-[var(--color-on-secondary-container)] flex-1">
              {t('settings.upgrade.premiumActive')}
            </p>
            <button
              onClick={handleUpgrade}
              className="text-xs font-bold font-['Inter'] text-[var(--color-secondary)]"
            >
              {t('common.manage')}
            </button>
          </section>
        )}

        {/* Profile Card */}
        <section
          className="relative rounded-3xl p-6 overflow-hidden"
          style={{ background: 'var(--color-surface-container-lowest)', boxShadow: '0 12px 32px rgba(26,27,33,0.04)' }}
        >
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-10 -mt-10 opacity-20"
            style={{ background: 'var(--color-primary-fixed)', filter: 'blur(48px)' }}
          />
          <div
            className="flex items-center gap-5 cursor-pointer"
            onClick={() => { setEditName(user.name); setSheet('edit-name') }}
          >
            <div
              className="relative shrink-0"
              onClick={(e) => { if (isSupabaseEnabled) { e.stopPropagation(); avatarInputRef.current?.click() } }}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-2xl object-cover shadow-lg" />
              ) : (
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: 'var(--color-primary-container)' }}
                >
                  <span className="font-['Manrope'] font-black text-3xl text-white">
                    {user.name?.[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>
              )}
              {isSupabaseEnabled && (
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/0 active:bg-black/25 transition-colors cursor-pointer">
                  {uploadingAvatar && (
                    <span className="material-symbols-rounded text-white text-[20px] animate-spin">progress_activity</span>
                  )}
                </div>
              )}
              <div
                className="absolute -bottom-2 -right-2 p-1.5 rounded-lg shadow-md flex items-center justify-center"
                style={{ background: isSupabaseEnabled ? 'var(--color-primary)' : 'var(--color-secondary)' }}
              >
                <span
                  className="material-symbols-rounded text-white text-xs"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {isSupabaseEnabled ? 'photo_camera' : 'verified'}
                </span>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2
                className="font-['Manrope'] font-bold text-xl text-[var(--color-on-surface)]"
                style={{ letterSpacing: '-0.3px' }}
              >
                {user.name}
              </h2>
              <p className="text-[var(--color-on-surface-variant)] text-sm font-medium font-['Inter'] truncate">
                {user.email}
              </p>
              <div
                className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-['Inter']"
                style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-fixed-variant)' }}
              >
                {user.tier}
              </div>
            </div>
            <span className="material-symbols-rounded text-[var(--color-outline-variant)]">chevron_right</span>
          </div>

          {/* Badges row */}
          <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--color-surface-container)' }}>
            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-outline)] mb-3 font-['Inter']">
              {t('settings.achievements')}
            </p>
            <div className="flex gap-2 flex-wrap">
              {badges.map((b) => (
                <motion.div
                  key={b.id}
                  initial={b.unlocked ? { scale: 0.6, opacity: 0 } : false}
                  animate={b.unlocked ? { scale: 1, opacity: 1 } : {}}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl"
                  style={{
                    background: b.unlocked ? 'var(--color-primary-fixed)' : 'var(--color-surface-container)',
                    opacity: b.unlocked ? 1 : 0.45,
                  }}
                >
                  <span
                    className="material-symbols-rounded text-[20px]"
                    style={{
                      color: b.unlocked ? 'var(--color-primary)' : 'var(--color-outline)',
                      fontVariationSettings: b.unlocked ? "'FILL' 1" : "'FILL' 0",
                    }}
                  >
                    {b.unlocked ? b.icon : 'lock'}
                  </span>
                  <span
                    className="text-[8px] font-bold font-['Inter'] text-center leading-tight"
                    style={{ color: b.unlocked ? 'var(--color-primary)' : 'var(--color-outline)' }}
                  >
                    {t(b.labelKey)}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="space-y-4">
          <SectionHeader>{t('settings.sections.stats')}</SectionHeader>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t('settings.stats.tracked'), value: alerts.length, icon: 'radar', color: 'var(--color-primary)' },
              { label: t('settings.stats.saved'), value: `$${totalSavings}`, icon: 'savings', color: 'var(--color-secondary)' },
              { label: t('settings.stats.active'), value: activeCount, icon: 'bolt', color: 'var(--color-tertiary)' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-4 flex flex-col items-center gap-1"
                style={{ background: 'var(--color-surface-container-lowest)', boxShadow: '0 2px 8px rgba(26,27,33,0.04)' }}
              >
                <span
                  className="material-symbols-rounded text-[20px] mb-1"
                  style={{ color: stat.color, fontVariationSettings: "'FILL' 1" }}
                >
                  {stat.icon}
                </span>
                <span
                  className="font-['Manrope'] font-black text-xl"
                  style={{ color: stat.color, letterSpacing: '-0.5px' }}
                >
                  {stat.value}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-outline)] font-['Inter']">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Notification Channels */}
        <section className="space-y-4">
          <SectionHeader>{t('settings.sections.notifications')}</SectionHeader>
          <div className="rounded-3xl overflow-hidden">
            {[
              { key: 'push', icon: 'notifications', label: t('settings.notifications.push'), desc: t('settings.notifications.pushDesc'), bg: 'var(--color-surface-container-lowest)', iconColor: 'var(--color-primary)', iconBg: 'rgba(0,49,120,0.05)', onToggle: handlePushToggle },
              { key: 'whatsapp', icon: 'chat', label: t('settings.notifications.whatsapp'), desc: t('settings.notifications.whatsappDesc'), bg: 'transparent', iconColor: 'var(--color-secondary)', iconBg: 'rgba(27,109,36,0.05)' },
              { key: 'email', icon: 'alternate_email', label: t('settings.notifications.email'), desc: t('settings.notifications.emailDesc'), bg: 'var(--color-surface-container-lowest)', iconColor: 'var(--color-tertiary)', iconBg: 'rgba(91,37,0,0.05)' },
            ].map((row) => (
              <div
                key={row.key}
                className="p-5 flex items-center justify-between"
                style={{ background: row.bg }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: row.iconBg }}
                  >
                    <span
                      className="material-symbols-rounded"
                      style={{ color: row.iconColor, fontVariationSettings: "'FILL' 1" }}
                    >
                      {row.icon}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--color-on-surface)] font-['Inter']">{row.label}</p>
                    <p className="text-xs text-[var(--color-outline)] font-['Inter']">{row.desc}</p>
                  </div>
                </div>
                <Toggle
                  checked={settings.notifications[row.key]}
                  onChange={() => row.onToggle ? row.onToggle() : toggleNotificationChannel(row.key)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Configuration */}
        <section className="space-y-4">
          <SectionHeader>{t('settings.sections.configuration')}</SectionHeader>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: t('settings.configuration.currency'), value: settings.currency, key: 'currency' },
              { label: t('settings.configuration.language'), value: settings.language, key: 'language' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => setSheet(item.key)}
                className="p-5 rounded-3xl border text-left active:scale-[0.97] transition-transform"
                style={{
                  background: 'var(--color-surface-container-lowest)',
                  borderColor: 'var(--color-surface-container)',
                  boxShadow: '0 2px 8px rgba(26,27,33,0.04)',
                }}
              >
                <p className="text-[10px] font-bold text-[var(--color-outline)] uppercase tracking-wider mb-3 font-['Inter']">
                  {item.label}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-['Manrope'] font-bold text-[var(--color-primary)]">{item.value}</span>
                  <span className="material-symbols-rounded text-[var(--color-outline-variant)] text-sm">
                    unfold_more
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Appearance */}
        <section className="space-y-4">
          <SectionHeader>{t('settings.sections.appearance')}</SectionHeader>
          <div
            className="p-1 flex items-center"
            style={{ background: 'var(--color-surface-container-high)', borderRadius: '2rem' }}
          >
            {[
              { value: 'system', label: t('settings.appearance.system') },
              { value: 'light', label: t('settings.appearance.light') },
              { value: 'dark', label: t('settings.appearance.dark') },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateSetting('theme', opt.value)}
                className="flex-1 py-3 px-4 rounded-full font-semibold transition-all font-['Inter'] text-sm"
                style={
                  settings.theme === opt.value
                    ? { background: 'var(--color-surface-container-lowest)', color: 'var(--color-primary)', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }
                    : { color: 'var(--color-on-surface-variant)' }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Alert Frequency */}
        <section className="space-y-4">
          <SectionHeader>{t('settings.sections.alertFrequency')}</SectionHeader>
          <div
            className="p-1 flex items-center"
            style={{ background: 'var(--color-surface-container-high)', borderRadius: '2rem' }}
          >
            {[
              { value: 'realtime', label: t('settings.frequency.realtime') },
              { value: 'daily', label: t('settings.frequency.daily') },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateSetting('alertFrequency', opt.value)}
                className="flex-1 py-3 px-6 rounded-full font-semibold transition-all font-['Inter'] text-sm"
                style={
                  settings.alertFrequency === opt.value
                    ? { background: 'white', color: 'var(--color-primary)', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                    : { color: 'rgba(67,70,82,0.7)' }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-center text-[var(--color-outline-variant)] px-6 italic font-['Inter']">
            {isRealtime
              ? t('settings.frequency.realtimeDesc')
              : t('settings.frequency.dailyDesc')}
          </p>
        </section>

        {/* Travel Preferences */}
        <section className="space-y-4">
          <SectionHeader>{t('settings.sections.travelPreferences')}</SectionHeader>
          <div
            className="rounded-3xl overflow-hidden border"
            style={{
              background: 'var(--color-surface-container-lowest)',
              borderColor: 'var(--color-surface-container-low)',
            }}
          >
            {[
              { icon: 'airline_seat_recline_extra', label: t('settings.preferences.cabin'), value: settings.preferences.cabin, sheetKey: 'cabin', valueColor: 'var(--color-secondary)' },
              { icon: 'loyalty', label: t('settings.preferences.frequentFlyer'), value: settings.preferences.frequentFlyer, sheetKey: null, valueColor: 'var(--color-outline)' },
              { icon: 'restaurant', label: t('settings.preferences.dietary'), value: settings.preferences.dietary, sheetKey: null, valueColor: 'var(--color-outline)' },
            ].map((row, i, arr) => (
              <button
                key={row.label}
                onClick={() => row.sheetKey && setSheet(row.sheetKey)}
                className="w-full p-5 flex items-center justify-between transition-colors active:bg-[var(--color-surface-container-low)]"
                style={i < arr.length - 1 ? { borderBottom: '1px solid var(--color-surface-container-low)' } : {}}
              >
                <div className="flex items-center gap-4">
                  <span className="material-symbols-rounded text-[var(--color-primary)]">{row.icon}</span>
                  <div className="text-left">
                    <p className="font-semibold text-[var(--color-on-surface)] font-['Inter']">{row.label}</p>
                    <p className="text-xs font-semibold font-['Inter']" style={{ color: row.valueColor }}>
                      {row.value}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-rounded text-[var(--color-outline-variant)]">chevron_right</span>
              </button>
            ))}
          </div>
        </section>

        {/* Account */}
        {isSupabaseEnabled && (
          <section className="space-y-4">
            <SectionHeader>{t('settings.sections.account')}</SectionHeader>
            <div
              className="rounded-3xl overflow-hidden border"
              style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-surface-container-low)' }}
            >
              {[
                { icon: 'badge', label: t('settings.account.editName'), desc: user.name, action: () => { setEditName(user.name); setSheet('edit-name') } },
                ...(user.provider === 'email' ? [{ icon: 'lock_reset', label: t('settings.account.changePassword'), desc: '••••••••', action: () => { setNewPassword(''); setSheet('change-password') } }] : []),
                { icon: 'download', label: t('settings.account.exportData'), desc: t('settings.account.exportDesc'), action: handleExportData },
                { icon: 'delete_forever', label: t('settings.account.deleteAccount'), desc: t('settings.account.deleteDesc'), action: () => setSheet('delete-account'), danger: true },
              ].map((row, i, arr) => (
                <button
                  key={row.label}
                  onClick={row.action}
                  className="w-full p-5 flex items-center justify-between transition-colors active:bg-[var(--color-surface-container-low)]"
                  style={i < arr.length - 1 ? { borderBottom: '1px solid var(--color-surface-container-low)' } : {}}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="material-symbols-rounded"
                      style={{ color: row.danger ? 'var(--color-error)' : 'var(--color-primary)' }}
                    >
                      {row.icon}
                    </span>
                    <div className="text-left">
                      <p
                        className="font-semibold font-['Inter']"
                        style={{ color: row.danger ? 'var(--color-error)' : 'var(--color-on-surface)' }}
                      >
                        {row.label}
                      </p>
                      <p className="text-xs text-[var(--color-outline)] font-['Inter'] truncate max-w-[200px]">{row.desc}</p>
                    </div>
                  </div>
                  {!row.danger && (
                    <span className="material-symbols-rounded text-[var(--color-outline-variant)]">chevron_right</span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Sign Out */}
        <button
          onClick={() => setSheet('signout')}
          className="w-full py-5 rounded-2xl font-['Manrope'] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          style={{ background: 'var(--color-error-container)', color: 'var(--color-on-error-container)' }}
        >
          <span className="material-symbols-rounded">logout</span>
          {t('settings.signOutButton')}
        </button>

        <p className="text-center text-[10px] font-bold text-[var(--color-outline-variant)] uppercase tracking-widest font-['Inter'] pb-2">
          {t('settings.version', { version: '4.2.0', build: '882' })}
        </p>
      </main>

      <BottomNav />

      {/* Bottom sheets */}
      <SelectSheet
        open={sheet === 'currency'} onClose={() => setSheet(null)}
        title={t('settings.configuration.currency')} options={CURRENCIES} current={settings.currency}
        onSelect={(v) => updateSetting('currency', v)}
      />
      <SelectSheet
        open={sheet === 'language'} onClose={() => setSheet(null)}
        title={t('settings.configuration.language')} options={LANGUAGES} current={settings.language}
        onSelect={(v) => { updateSetting('language', v); i18n.changeLanguage(LANGUAGE_CODES[v] ?? 'en') }}
      />
      <SelectSheet
        open={sheet === 'cabin'} onClose={() => setSheet(null)}
        title={t('settings.preferences.cabin')} options={CABINS} current={settings.preferences.cabin}
        onSelect={(v) => updateSetting('preferences', { ...settings.preferences, cabin: v })}
      />

      {/* Edit Name */}
      <BottomSheet open={sheet === 'edit-name'} onClose={() => setSheet(null)} title={t('settings.account.editName')}>
        <div className="space-y-4">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder={t('settings.namePlaceholder')}
            className="w-full px-5 py-4 rounded-2xl font-['Inter'] text-sm outline-none"
            style={{ background: 'var(--color-surface-container-high)', color: 'var(--color-on-surface)' }}
            autoFocus
          />
          <button
            onClick={handleSaveName}
            disabled={saving || !editName.trim()}
            className="w-full py-4 rounded-2xl font-['Manrope'] font-bold text-sm text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-container))' }}
          >
            {saving ? t('settings.saving') : t('settings.saveName')}
          </button>
        </div>
      </BottomSheet>

      {/* Change Password */}
      <BottomSheet open={sheet === 'change-password'} onClose={() => setSheet(null)} title={t('settings.account.changePassword')}>
        <div className="space-y-4">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t('settings.passwordPlaceholder')}
            className="w-full px-5 py-4 rounded-2xl font-['Inter'] text-sm outline-none"
            style={{ background: 'var(--color-surface-container-high)', color: 'var(--color-on-surface)' }}
            autoFocus
          />
          <button
            onClick={handleChangePassword}
            disabled={saving || newPassword.length < 6}
            className="w-full py-4 rounded-2xl font-['Manrope'] font-bold text-sm text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-container))' }}
          >
            {saving ? t('settings.updating') : t('settings.updatePassword')}
          </button>
        </div>
      </BottomSheet>

      {/* Delete Account */}
      <BottomSheet open={sheet === 'delete-account'} onClose={() => setSheet(null)} title={t('settings.account.deleteAccount')}>
        <p className="text-sm text-[var(--color-on-surface-variant)] font-['Inter'] mb-6 leading-relaxed">
          {t('settings.deleteConfirm')}
        </p>
        <div className="space-y-3">
          <button
            onClick={() => setSheet(null)}
            className="w-full py-4 rounded-2xl font-['Manrope'] font-bold text-sm"
            style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface)' }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={saving}
            className="w-full py-4 rounded-2xl font-['Manrope'] font-bold text-sm disabled:opacity-50"
            style={{ background: 'var(--color-error-container)', color: 'var(--color-on-error-container)' }}
          >
            {saving ? t('settings.deleting') : t('settings.deleteMyAccount')}
          </button>
        </div>
      </BottomSheet>

      {/* Sign Out confirmation */}
      <BottomSheet open={sheet === 'signout'} onClose={() => setSheet(null)} title={t('settings.signOut')}>
        <p className="text-sm text-[var(--color-on-surface-variant)] font-['Inter'] mb-6 leading-relaxed">
          {t('settings.signOutConfirm')}
        </p>
        <div className="space-y-3">
          <button
            onClick={() => setSheet(null)}
            className="w-full py-4 rounded-2xl font-['Manrope'] font-bold text-sm"
            style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface)' }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSignOut}
            className="w-full py-4 rounded-2xl font-['Manrope'] font-bold text-sm"
            style={{ background: 'var(--color-error-container)', color: 'var(--color-on-error-container)' }}
          >
            {t('settings.signOut')}
          </button>
        </div>
      </BottomSheet>
    </div>
    </PageTransition>
  )
}
