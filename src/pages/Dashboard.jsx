import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, animate } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { timeAgo } from '../lib/timeAgo'
import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import PageTransition from '../components/PageTransition'
import InstallPrompt from '../components/InstallPrompt'
import { bestDeals } from '../data/mockData'
import { useAppStore } from '../store/useAppStore'
import { useToast } from '../hooks/useToast'
import { AlertCardSkeleton } from '../components/Skeleton'
import { listVariants, cardVariants, fadeUpVariants } from '../hooks/useAnimVariants'

function Sparkline({ trend }) {
  const bars =
    trend === 'down'
      ? [{ h: 'h-3', muted: true }, { h: 'h-4', muted: true }, { h: 'h-5', muted: true }, { h: 'h-2', muted: false, color: 'bg-[var(--color-secondary)]', glow: '0 0 8px rgba(27,109,36,0.4)' }]
      : [{ h: 'h-5', muted: true }, { h: 'h-4', muted: true }, { h: 'h-3', muted: true }, { h: 'h-6', muted: false, color: 'bg-[var(--color-tertiary)]', glow: '0 0 8px rgba(91,37,0,0.4)' }]

  return (
    <div
      className="w-24 h-10 rounded-lg flex items-center justify-center"
      style={{ background: 'var(--color-surface-container-highest)', opacity: 0.5 }}
    >
      <div className="flex items-end gap-1 px-2 h-6">
        {bars.map((b, i) =>
          b.muted ? (
            <div key={i} className={`w-1 bg-[var(--color-outline-variant)] rounded-full ${b.h}`} />
          ) : (
            <div
              key={i}
              className={`w-1 rounded-full ${b.h} ${b.color}`}
              style={{ boxShadow: b.glow }}
            />
          )
        )}
      </div>
    </div>
  )
}

function AlertCard({ alert, onClick }) {
  const { t, i18n } = useTranslation()
  const isDown = alert.trend === 'down'
  const trendColor = isDown ? 'var(--color-secondary)' : 'var(--color-tertiary)'
  const trendBg = isDown ? 'var(--color-secondary-container)' : 'rgba(91,37,0,0.10)'
  const trendPrefix = isDown ? '-' : '+'
  const trendIcon = isDown ? 'trending_down' : alert.trend === 'up' ? 'trending_up' : 'trending_flat'
  const recentlyUpdatedId = useAppStore((s) => s.recentlyUpdatedId)
  const isUpdated = recentlyUpdatedId === alert.id

  return (
    <div
      onClick={onClick}
      className="bg-[var(--color-surface-container-lowest)] p-5 rounded-2xl relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
      style={{
        boxShadow: isUpdated
          ? '0 0 0 2px var(--color-secondary), 0 12px 32px rgba(26,27,33,0.04)'
          : '0 12px 32px rgba(26,27,33,0.04)',
        opacity: alert.status === 'paused' ? 0.6 : 1,
        transition: 'box-shadow 0.4s ease',
      }}
    >
      {alert.status === 'paused' && (
        <div
          className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest font-['Inter']"
          style={{ background: 'var(--color-surface-container-highest)', color: 'var(--color-outline)' }}
        >
          {t('dashboard.paused')}
        </div>
      )}
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-['Manrope'] font-extrabold text-lg text-[var(--color-on-surface)]">
              {alert.origin}
            </span>
            <span className="material-symbols-rounded text-[var(--color-outline-variant)] text-sm">
              sync_alt
            </span>
            <span className="font-['Manrope'] font-extrabold text-lg text-[var(--color-on-surface)]">
              {alert.destination}
            </span>
          </div>
          <p
            className="text-[var(--color-on-surface-variant)] text-xs font-semibold uppercase tracking-widest font-['Inter']"
          >
            {alert.dates}
          </p>
        </div>
        <div
          className="px-3 py-1 rounded-full flex items-center gap-1"
          style={{ background: trendBg }}
        >
          <span
            className="material-symbols-rounded text-sm"
            style={{ color: trendColor, fontSize: '16px' }}
          >
            {trendIcon}
          </span>
          <span
            className="text-xs font-bold font-['Inter']"
            style={{ color: isDown ? 'var(--color-on-secondary-container)' : 'var(--color-tertiary)' }}
          >
            {trendPrefix}${Math.abs(alert.change)}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <span className="text-[var(--color-on-surface-variant)] text-[10px] font-bold uppercase tracking-tighter font-['Inter']">
            {t('alerts.currentBest')}
          </span>
          <motion.div
            animate={isUpdated ? { scale: [1, 1.12, 1] } : {}}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            className="text-3xl font-['Manrope'] font-black text-[var(--color-primary)]"
            style={{ letterSpacing: '-1px' }}
          >
            ${alert.currentBest}
          </motion.div>
        </div>
        <Sparkline trend={alert.trend} />
      </div>
      {alert.lastCheckedAt && (
        <p className="mt-3 text-[9px] font-['Inter'] text-[var(--color-outline)] flex items-center gap-1">
          <span className="material-symbols-rounded text-[11px]">schedule</span>
          {t('alerts.checkedAgo', { time: timeAgo(alert.lastCheckedAt, i18n.language) })}
        </p>
      )}
    </div>
  )
}

function DealCard({ deal }) {
  return (
    <div
      className="group relative rounded-3xl overflow-hidden h-64 shadow-lg active:scale-95 transition-all cursor-pointer"
    >
      <img
        src={deal.image}
        alt={deal.destination}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,49,120,0.9) 0%, transparent 60%)' }}
      />
      <div className="absolute bottom-0 left-0 p-4 w-full">
        <h4 className="text-white font-['Manrope'] font-bold text-lg mb-1">{deal.destination}</h4>
        <div className="flex items-center justify-between">
          <span className="text-white/80 text-xs font-bold uppercase tracking-widest font-['Inter']">
            From
          </span>
          <span
            className="text-white font-['Manrope'] font-black text-xl"
            style={{ letterSpacing: '-0.5px' }}
          >
            ${deal.price}
          </span>
        </div>
      </div>
      <div
        className="absolute top-3 right-3 px-2 py-1 rounded-lg text-[10px] font-black text-white uppercase tracking-widest shadow-lg font-['Inter']"
        style={{ background: 'var(--color-secondary)' }}
      >
        -{deal.discount}% OFF
      </div>
    </div>
  )
}

function SwipeableAlertCard({ alert, onDelete, onClick }) {
  const x = useMotionValue(0)
  const REVEAL = -80

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
        <span className="text-white text-[9px] font-bold font-['Inter'] uppercase tracking-wider">Delete</span>
      </button>
      <motion.div
        drag="x"
        dragConstraints={{ left: REVEAL, right: 0 }}
        dragElastic={0.04}
        style={{ x }}
        onDragEnd={handleDragEnd}
        onTap={() => { if (Math.abs(x.get()) < 8) onClick() }}
      >
        <AlertCard alert={alert} onClick={() => {}} />
      </motion.div>
    </div>
  )
}

export default function Dashboard({ direction }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const alerts = useAppStore((s) => s.alerts)
  const removeAlert = useAppStore((s) => s.removeAlert)
  const toast = useToast()
  const [hydrated] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  function handleRefresh() {
    if (refreshing) return
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      toast(t('dashboard.pricesRefreshed'), 'success')
    }, 1400)
  }

  const totalSavings = alerts.reduce((sum, a) => {
    const diff = (a.targetPrice ?? 0) - (a.currentBest ?? 0)
    return diff > 0 ? sum + diff : sum
  }, 0)
  const dealsFound = alerts.filter((a) => a.currentBest <= (a.targetPrice ?? Infinity)).length

  return (
    <PageTransition direction={direction}>
      <div className="min-h-dvh bg-[var(--color-surface)]">
        <AppHeader />

        <main className="pt-28 pb-32 px-6">
          {/* Hero */}
          <motion.section className="mb-10" variants={listVariants} initial="hidden" animate="show">
            <motion.h2
              variants={fadeUpVariants}
              className="font-['Manrope'] text-3xl font-extrabold text-[var(--color-on-surface)] mb-2"
              style={{ letterSpacing: '-0.75px' }}
            >
              {t('dashboard.hero')}
            </motion.h2>
            <motion.p variants={fadeUpVariants} className="text-[var(--color-on-surface-variant)] font-medium leading-relaxed font-['Inter'] text-[15px]">
              {t('dashboard.heroTracking', { count: alerts.length })}
            </motion.p>
            <motion.button
              variants={fadeUpVariants}
              onClick={() => navigate('/create-alert')}
              className="mt-8 w-full text-white py-4 px-6 rounded-xl font-['Manrope'] font-bold text-lg flex items-center justify-center gap-3 active:scale-95 transition-transform"
              style={{
                background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-container))',
                boxShadow: '0 8px 24px rgba(0,49,120,0.20)',
              }}
            >
              <span className="material-symbols-rounded text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                add_circle
              </span>
              {t('dashboard.createNewAlert')}
            </motion.button>
          </motion.section>

          {/* Savings Summary */}
          {totalSavings > 0 && (
            <motion.div
              variants={fadeUpVariants} initial="hidden" animate="show"
              className="mb-6 flex items-center gap-3 px-4 py-3.5 rounded-2xl"
              style={{ background: 'var(--color-secondary-container)' }}
            >
              <span
                className="material-symbols-rounded text-[22px] shrink-0"
                style={{ color: 'var(--color-secondary)', fontVariationSettings: "'FILL' 1" }}
              >
                savings
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest font-['Inter']" style={{ color: 'var(--color-secondary)' }}>
                  {t('dashboard.potentialSavings')}
                </p>
                <p className="font-['Manrope'] font-black text-lg leading-tight" style={{ color: 'var(--color-on-secondary-container)', letterSpacing: '-0.3px' }}>
                  ${totalSavings} <span className="font-medium text-sm">{t('dashboard.heroSub', { count: dealsFound })}</span>
                </p>
              </div>
              <span className="material-symbols-rounded text-[var(--color-secondary)] opacity-50">chevron_right</span>
            </motion.div>
          )}

          {/* My Active Alerts */}
          <section className="mb-10">
            <motion.div
              className="flex justify-between items-end mb-6"
              variants={fadeUpVariants} initial="hidden" animate="show"
            >
              <div className="flex items-center gap-3">
                <h3 className="font-['Manrope'] text-xl font-bold text-[var(--color-on-surface)]">
                  {t('dashboard.myActiveAlerts')}
                </h3>
                <button
                  onClick={handleRefresh}
                  className="active:scale-90 transition-transform"
                  title="Refresh prices"
                >
                  <motion.span
                    className="material-symbols-rounded text-[18px] text-[var(--color-outline)]"
                    animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                    transition={refreshing ? { duration: 0.7, repeat: Infinity, ease: 'linear' } : {}}
                  >
                    sync
                  </motion.span>
                </button>
              </div>
              <span
                onClick={() => navigate('/alerts')}
                className="text-[var(--color-primary)] font-bold text-sm tracking-wide font-['Inter'] active:opacity-70 cursor-pointer"
              >
                {t('dashboard.viewAll')}
              </span>
            </motion.div>

            {!hydrated ? (
              <div className="space-y-4">
                <AlertCardSkeleton />
                <AlertCardSkeleton />
              </div>
            ) : alerts.length === 0 ? (
              <motion.div
                variants={fadeUpVariants} initial="hidden" animate="show"
                className="flex flex-col items-center py-10 text-center"
              >
                <span
                  className="material-symbols-rounded text-[48px] mb-3"
                  style={{ color: 'var(--color-outline-variant)' }}
                >
                  flight_takeoff
                </span>
                <p className="font-['Manrope'] font-bold text-[var(--color-on-surface)] mb-1">
                  {t('dashboard.noAlerts')}
                </p>
                <p className="text-sm text-[var(--color-on-surface-variant)] font-['Inter']">
                  {t('dashboard.noAlertsDesc')}
                </p>
              </motion.div>
            ) : (
              <motion.div
                className="space-y-4"
                variants={listVariants} initial="hidden" animate="show"
              >
                {alerts.map((alert) => (
                  <motion.div key={alert.id} variants={cardVariants}>
                    <SwipeableAlertCard
                      alert={alert}
                      onClick={() => navigate(`/alert/${alert.id}`)}
                      onDelete={() => { removeAlert(alert.id); toast(t('dashboard.alertDeleted'), 'default') }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </section>

          {/* Best Deals Today */}
          <section>
            <motion.div
              className="flex justify-between items-end mb-6"
              variants={fadeUpVariants} initial="hidden" animate="show"
            >
              <h3 className="font-['Manrope'] text-xl font-bold text-[var(--color-on-surface)]">
                {t('dashboard.bestDeals')}
              </h3>
              <span className="text-[var(--color-primary)] font-bold text-sm tracking-wide font-['Inter'] cursor-pointer">
                {t('dashboard.explore')}
              </span>
            </motion.div>
            <motion.div
              className="grid grid-cols-2 gap-4"
              variants={listVariants} initial="hidden" animate="show"
            >
              {bestDeals.map((deal) => (
                <motion.div key={deal.id} variants={cardVariants}>
                  <DealCard deal={deal} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        </main>

        <BottomNav />
        <InstallPrompt />
      </div>
    </PageTransition>
  )
}
