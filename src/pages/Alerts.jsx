import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, animate } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { timeAgo } from '../lib/timeAgo'
import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import PageTransition from '../components/PageTransition'
import { useAppStore } from '../store/useAppStore'
import { useToast } from '../hooks/useToast'
import { listVariants, cardVariants, fadeUpVariants } from '../hooks/useAnimVariants'

function AlertRow({ alert, onClick, onDelete }) {
  const { t, i18n } = useTranslation()
  const x = useMotionValue(0)
  const REVEAL = -80
  const isDown = alert.trend === 'down'
  const trendColor = isDown ? 'var(--color-secondary)' : 'var(--color-tertiary)'

  function handleDragEnd(_, info) {
    if (info.offset.x < REVEAL * 0.55) {
      animate(x, REVEAL, { type: 'spring', stiffness: 350, damping: 28 })
    } else {
      animate(x, 0, { type: 'spring', stiffness: 350, damping: 28 })
    }
  }

  function handleDelete() {
    animate(x, -500, { type: 'tween', duration: 0.22 }).then(onDelete)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <button
        onClick={handleDelete}
        className="absolute right-0 top-0 h-full w-20 flex flex-col items-center justify-center gap-1 rounded-r-2xl"
        style={{ background: 'var(--color-error)' }}
      >
        <span
          className="material-symbols-rounded text-white text-[22px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          delete
        </span>
        <span className="text-white text-[9px] font-bold font-['Inter'] uppercase tracking-wider">{t('alerts.delete')}</span>
      </button>

      <motion.div
        drag="x"
        dragConstraints={{ left: REVEAL, right: 0 }}
        dragElastic={0.04}
        style={{
          x,
          background: 'var(--color-surface-container-lowest)',
          opacity: alert.status === 'paused' ? 0.6 : 1,
        }}
        onDragEnd={handleDragEnd}
        onTap={() => { if (Math.abs(x.get()) < 8) onClick() }}
        className="flex items-center justify-between px-5 py-4 cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: isDown ? 'var(--color-secondary-container)' : 'rgba(91,37,0,0.10)' }}
          >
            <span
              className="material-symbols-rounded text-[20px]"
              style={{ color: trendColor, fontVariationSettings: "'FILL' 1" }}
            >
              {isDown ? 'trending_down' : alert.trend === 'up' ? 'trending_up' : 'trending_flat'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-['Manrope'] font-bold text-[var(--color-on-surface)]">
                {alert.origin}
              </span>
              <span className="material-symbols-rounded text-[var(--color-outline-variant)] text-sm">arrow_forward</span>
              <span className="font-['Manrope'] font-bold text-[var(--color-on-surface)]">
                {alert.destination}
              </span>
              {alert.status === 'paused' && (
                <span
                  className="ml-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider font-['Inter']"
                  style={{ background: 'var(--color-surface-container-highest)', color: 'var(--color-outline)' }}
                >
                  {t('alerts.paused')}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-on-surface-variant)] font-['Inter']">{alert.dates}</p>
            {alert.lastCheckedAt && (
              <p className="text-[9px] text-[var(--color-outline)] font-['Inter'] flex items-center gap-0.5 mt-0.5">
                <span className="material-symbols-rounded text-[11px]">schedule</span>
                {t('alerts.checkedAgo', { time: timeAgo(alert.lastCheckedAt, i18n.language) })}
              </p>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div
            className="font-['Manrope'] font-black text-lg"
            style={{ color: 'var(--color-primary)', letterSpacing: '-0.5px' }}
          >
            ${alert.currentBest}
          </div>
          <div className="text-[10px] font-bold font-['Inter']" style={{ color: trendColor }}>
            {isDown ? '-' : '+'}${Math.abs(alert.change)}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function Alerts({ direction }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const alerts = useAppStore((s) => s.alerts)
  const removeAlert = useAppStore((s) => s.removeAlert)
  const updateSetting = useAppStore((s) => s.updateSetting)
  const sortPref = useAppStore((s) => s.settings.sortAlerts ?? 'newest')
  const toast = useToast()

  const FILTERS = [
    { value: 'All', label: t('alerts.filterAll') },
    { value: 'Active', label: t('alerts.filterActive') },
    { value: 'Paused', label: t('alerts.filterPaused') },
  ]

  const SORT_OPTIONS = [
    { value: 'newest', label: t('alerts.sortNewest'), icon: 'schedule' },
    { value: 'lowest', label: t('alerts.sortLowest'), icon: 'price_check' },
    { value: 'biggest_drop', label: t('alerts.sortBiggestDrop'), icon: 'trending_down' },
  ]

  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [showSortSheet, setShowSortSheet] = useState(false)

  const currentSort = SORT_OPTIONS.find((o) => o.value === sortPref) ?? SORT_OPTIONS[0]

  const processed = alerts
    .filter((a) => {
      if (filter === 'Active') return a.status !== 'paused'
      if (filter === 'Paused') return a.status === 'paused'
      return true
    })
    .filter((a) => {
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return (
        a.origin.toLowerCase().includes(q) ||
        a.destination.toLowerCase().includes(q) ||
        `${a.origin} ${a.destination}`.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      if (sortPref === 'lowest') return (a.currentBest ?? 0) - (b.currentBest ?? 0)
      if (sortPref === 'biggest_drop') return Math.abs(b.change ?? 0) - Math.abs(a.change ?? 0)
      return b.id - a.id
    })

  const isSearching = query.trim().length > 0

  return (
    <PageTransition direction={direction}>
      <div className="min-h-dvh bg-[var(--color-surface)]">
        <AppHeader title="My Alerts" showBack onBack={() => navigate(-1)} />

        <main className="pt-28 pb-32 px-6">
          {/* Filter tabs */}
          <motion.div
            variants={fadeUpVariants} initial="hidden" animate="show"
            className="flex gap-2 mb-4"
          >
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className="px-4 py-2 rounded-full font-['Inter'] font-semibold text-sm transition-all"
                style={
                  filter === f.value
                    ? { background: 'var(--color-primary)', color: 'white' }
                    : { background: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }
                }
              >
                {f.label}
                <span className="ml-1.5 text-[10px] opacity-70">
                  {f.value === 'All' && alerts.length}
                  {f.value === 'Active' && alerts.filter((a) => a.status !== 'paused').length}
                  {f.value === 'Paused' && alerts.filter((a) => a.status === 'paused').length}
                </span>
              </button>
            ))}
          </motion.div>

          {/* Search + Sort row */}
          <motion.div
            variants={fadeUpVariants} initial="hidden" animate="show"
            className="flex gap-2 mb-6"
          >
            <div className="flex-1 relative">
              <span
                className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] text-[20px]"
              >
                search
              </span>
              <input
                type="text"
                placeholder={t('alerts.searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl font-['Inter'] text-sm outline-none"
                style={{
                  background: 'var(--color-surface-container)',
                  color: 'var(--color-on-surface)',
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <span className="material-symbols-rounded text-[var(--color-outline)] text-[18px]">close</span>
                </button>
              )}
            </div>
            <button
              onClick={() => setShowSortSheet(true)}
              className="flex items-center gap-1.5 px-3 py-3 rounded-2xl shrink-0 active:scale-95 transition-transform"
              style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }}
            >
              <span className="material-symbols-rounded text-[18px]">sort</span>
              <span className="text-xs font-semibold font-['Inter'] hidden sm:block">{currentSort.label}</span>
            </button>
          </motion.div>

          {/* Alert list */}
          {processed.length > 0 ? (
            <motion.div
              className="flex flex-col gap-2"
              variants={listVariants} initial="hidden" animate="show"
            >
              {processed.map((alert) => (
                <motion.div key={alert.id} variants={cardVariants}>
                  <AlertRow
                    alert={alert}
                    onClick={() => navigate(`/alert/${alert.id}`)}
                    onDelete={() => { removeAlert(alert.id); toast(t('alerts.alertDeleted'), 'default') }}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              variants={fadeUpVariants} initial="hidden" animate="show"
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <span
                className="material-symbols-rounded text-[56px] mb-4"
                style={{ color: 'var(--color-outline-variant)' }}
              >
                {isSearching ? 'search_off' : 'radar'}
              </span>
              <p className="font-['Manrope'] font-bold text-lg text-[var(--color-on-surface)] mb-2">
                {isSearching
                  ? t('alerts.noMatch', { query })
                  : filter !== 'All'
                  ? t('alerts.noFilter', { filter: filter.toLowerCase() })
                  : t('alerts.noAlerts')}
              </p>
              <p className="text-sm text-[var(--color-on-surface-variant)] font-['Inter'] mb-6">
                {isSearching
                  ? t('alerts.noMatchHint')
                  : filter === 'Paused'
                  ? t('alerts.allMonitoring')
                  : t('alerts.createFirst')}
              </p>
              {isSearching ? (
                <button
                  onClick={() => setQuery('')}
                  className="px-6 py-3 rounded-xl font-['Manrope'] font-bold text-sm"
                  style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}
                >
                  {t('alerts.clearSearch')}
                </button>
              ) : filter !== 'Paused' && (
                <button
                  onClick={() => navigate('/create-alert')}
                  className="px-6 py-3 rounded-xl font-['Manrope'] font-bold text-sm text-white"
                  style={{ background: 'var(--color-primary)' }}
                >
                  {t('alerts.createAlert')}
                </button>
              )}
            </motion.div>
          )}
        </main>

        <BottomNav />
      </div>

      {/* Sort sheet */}
      {showSortSheet && (
        <>
          <div
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
            onClick={() => setShowSortSheet(false)}
          />
          <div
            className="fixed bottom-0 left-0 w-full z-50 rounded-t-3xl px-6 pt-5 pb-10"
            style={{
              background: 'var(--color-surface-container-lowest)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
              maxWidth: 430,
              margin: '0 auto',
              right: 0,
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-['Manrope'] font-bold text-lg text-[var(--color-on-surface)]">{t('alerts.sortBy')}</h3>
              <button onClick={() => setShowSortSheet(false)}>
                <span className="material-symbols-rounded text-[var(--color-outline)]">close</span>
              </button>
            </div>
            <div className="space-y-2">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { updateSetting('sortAlerts', opt.value); setShowSortSheet(false) }}
                  className="w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all active:scale-[0.98]"
                  style={
                    sortPref === opt.value
                      ? { background: 'var(--color-primary-fixed)', color: 'var(--color-primary)' }
                      : { background: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }
                  }
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="material-symbols-rounded text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {opt.icon}
                    </span>
                    <span className="font-['Manrope'] font-semibold">{opt.label}</span>
                  </div>
                  {sortPref === opt.value && (
                    <span className="material-symbols-rounded text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </PageTransition>
  )
}
