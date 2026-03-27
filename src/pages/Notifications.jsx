import { useMotionValue, animate, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import PageTransition from '../components/PageTransition'
import { useAppStore } from '../store/useAppStore'
import { useToast } from '../hooks/useToast'
import { listVariants, cardVariants, fadeUpVariants } from '../hooks/useAnimVariants'

function UnreadDot() {
  return (
    <span
      className="w-2 h-2 rounded-full shrink-0 mt-1"
      style={{ background: 'var(--color-primary)' }}
    />
  )
}

function PriceDropCard({ n, onRead, onViewDeal }) {
  const { t } = useTranslation()
  return (
    <div
      onClick={onRead}
      className="rounded-3xl p-6 active:scale-[0.98] transition-all cursor-pointer"
      style={{
        background: n.read ? 'var(--color-surface-container-lowest)' : 'var(--color-primary-fixed)',
        boxShadow: '0 12px 32px rgba(26,27,33,0.04)',
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-secondary-container)' }}
          >
            <span
              className="material-symbols-rounded text-[var(--color-on-secondary-container)]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              trending_down
            </span>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-secondary)] mb-1 block font-['Inter']">
              Price Drop
            </span>
            <h3 className="font-['Manrope'] text-lg font-bold text-[var(--color-on-surface)]">
              {n.title}
            </h3>
          </div>
        </div>
        <div className="flex items-start gap-2 shrink-0 ml-2">
          {!n.read && <UnreadDot />}
          <span className="text-xs text-[var(--color-outline)] font-['Inter'] whitespace-nowrap">{n.timestamp}</span>
        </div>
      </div>

      <div className="mb-5 relative rounded-2xl overflow-hidden h-32">
        <img src={n.image} alt={n.destination} className="w-full h-full object-cover" />
        <div
          className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)' }}
        >
          <span className="font-['Manrope'] font-extrabold text-[var(--color-secondary)] text-lg">
            {n.currency}{n.price}
          </span>
          <span className="text-[10px] text-[var(--color-outline)] line-through ml-1 font-['Inter']">
            {n.currency}{n.originalPrice}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {n.airlines.map((a) => (
            <div
              key={a}
              className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold font-['Inter']"
              style={{ background: 'var(--color-surface-container-high)' }}
            >
              {a}
            </div>
          ))}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onViewDeal(n) }}
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-primary)] font-['Inter'] active:opacity-70 transition-opacity"
          aria-label="View deal"
        >
          {t('notifications.viewDeal')}
          <span className="material-symbols-rounded text-sm">arrow_forward</span>
        </button>
      </div>
    </div>
  )
}

function TargetReachedCard({ n, onRead, onViewDeal }) {
  const { t } = useTranslation()
  return (
    <div
      onClick={onRead}
      className="rounded-3xl p-6 active:scale-[0.98] transition-all cursor-pointer"
      style={{
        background: n.read ? 'var(--color-surface-container-lowest)' : 'var(--color-primary-fixed)',
        boxShadow: '0 12px 32px rgba(26,27,33,0.04)',
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--color-primary-fixed)' }}
          >
            <span
              className="material-symbols-rounded text-[var(--color-primary)]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              stars
            </span>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] mb-1 block font-['Inter']">
              Target Reached
            </span>
            <h3 className="font-['Manrope'] text-lg font-bold text-[var(--color-on-surface)]">
              {n.title}
            </h3>
          </div>
        </div>
        <div className="flex items-start gap-2 shrink-0 ml-2">
          {!n.read && <UnreadDot />}
          <span className="text-xs text-[var(--color-outline)] font-['Inter'] whitespace-nowrap">{n.timestamp}</span>
        </div>
      </div>

      <div
        className="rounded-2xl p-4 mb-5 flex items-center justify-between"
        style={{ background: 'var(--color-surface-container-low)' }}
      >
        <div>
          <p className="text-xs text-[var(--color-outline-variant)] font-medium font-['Inter']">New Low</p>
          <p className="font-['Manrope'] text-2xl font-black text-[var(--color-on-surface)]">
            ${n.price}{' '}
            <span className="text-sm font-medium text-[var(--color-outline)]">/ round trip</span>
          </p>
        </div>
        <div className="text-right">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1 font-['Inter']"
            style={{ background: 'var(--color-secondary-container)', color: 'var(--color-secondary)' }}
          >
            -{n.currency}{n.savings} Savings
          </span>
          <p className="text-[10px] text-[var(--color-outline)] block font-['Inter']">
            Expires in {n.expiresIn}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-rounded text-[var(--color-outline)] text-lg">calendar_today</span>
          <span className="text-xs text-[var(--color-on-surface-variant)] font-['Inter']">{n.dates}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onViewDeal(n) }}
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-primary)] font-['Inter'] active:opacity-70 transition-opacity"
          aria-label="View deal"
        >
          {t('notifications.viewDeal')}
          <span className="material-symbols-rounded text-sm">arrow_forward</span>
        </button>
      </div>
    </div>
  )
}

function FlashSaleCard({ n, onRead, onCopyCode, onViewDeal }) {
  const { t } = useTranslation()
  return (
    <div
      onClick={onRead}
      className="rounded-3xl p-6 relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer"
      style={{
        background: 'var(--color-tertiary-container)',
        boxShadow: '0 12px 32px rgba(127,54,0,0.15)',
      }}
    >
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -mr-16 -mt-16"
        style={{ background: 'var(--color-on-tertiary-container)', filter: 'blur(48px)' }}
      />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}
          >
            <span className="material-symbols-rounded text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
              bolt
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-on-tertiary-container)] mb-1 block font-['Inter']">
              Limited Time
            </span>
            <h3 className="font-['Manrope'] text-lg font-bold text-white">{n.title}</h3>
          </div>
        </div>
        <div className="flex items-start gap-2 shrink-0 ml-2">
          {!n.read && <span className="w-2 h-2 rounded-full shrink-0 mt-1 bg-white opacity-80" />}
          <span className="text-xs text-white/60 font-['Inter'] whitespace-nowrap">{n.timestamp}</span>
        </div>
      </div>

      <p className="text-white/90 text-sm mb-5 leading-relaxed relative z-10 font-['Inter']">
        {n.description}
      </p>

      <div className="flex items-center justify-between relative z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onCopyCode(n.promoCode) }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
          style={{ background: 'var(--color-tertiary-fixed)' }}
        >
          <span className="text-xs font-bold font-['Inter']" style={{ color: 'var(--color-on-tertiary-fixed)' }}>
            CODE: {n.promoCode}
          </span>
          <span className="material-symbols-rounded text-[14px]" style={{ color: 'var(--color-on-tertiary-fixed)' }}>
            content_copy
          </span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onViewDeal(n) }}
          className="inline-flex items-center gap-2 text-sm font-bold text-white font-['Inter'] active:opacity-70 transition-opacity"
          aria-label="View deal"
        >
          {t('notifications.viewDeal')}
          <span className="material-symbols-rounded text-sm">arrow_forward</span>
        </button>
      </div>
    </div>
  )
}

const cardMap = {
  price_drop: PriceDropCard,
  target_reached: TargetReachedCard,
  flash_sale: FlashSaleCard,
}

const DATE_GROUPS = ['Today', 'Yesterday', 'This Week']

function SwipeableDismissCard({ onDismiss, children }) {
  const { t } = useTranslation()
  const x = useMotionValue(0)
  const REVEAL = -80

  function handleDragEnd(_, info) {
    if (info.offset.x < REVEAL * 0.55) {
      animate(x, REVEAL, { type: 'spring', stiffness: 350, damping: 28 })
    } else {
      animate(x, 0, { type: 'spring', stiffness: 350, damping: 28 })
    }
  }

  function handleDismiss() {
    animate(x, -500, { type: 'tween', duration: 0.22 }).then(onDismiss)
  }

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <button
        onClick={handleDismiss}
        className="absolute right-0 top-0 h-full w-20 flex flex-col items-center justify-center gap-1 rounded-r-3xl"
        style={{ background: 'var(--color-outline-variant)' }}
      >
        <span
          className="material-symbols-rounded text-[var(--color-on-surface-variant)] text-[22px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          close
        </span>
        <span className="text-[var(--color-on-surface-variant)] text-[9px] font-bold font-['Inter'] uppercase tracking-wider">
          {t('notifications.dismiss')}
        </span>
      </button>
      <motion.div
        drag="x"
        dragConstraints={{ left: REVEAL, right: 0 }}
        dragElastic={0.04}
        style={{ x }}
        onDragEnd={handleDragEnd}
      >
        {children}
      </motion.div>
    </div>
  )
}

export default function Notifications({ direction }) {
  const { t } = useTranslation()
  const notifications = useAppStore((s) => s.notifications)
  const markAsRead = useAppStore((s) => s.markAsRead)
  const markAllAsRead = useAppStore((s) => s.markAllAsRead)
  const dismissNotification = useAppStore((s) => s.dismissNotification)
  const toast = useToast()
  const navigate = useNavigate()

  const unreadCount = notifications.filter((n) => !n.read).length

  function handleViewDeal(n) {
    if (!n.read) markAsRead(n.id)
    // Navigate to the specific alert if we have the ID, otherwise show the alerts list
    if (n.alertId) navigate(`/alert/${n.alertId}`)
    else navigate('/alerts')
  }

  const grouped = DATE_GROUPS.map((label) => ({
    label,
    items: notifications.filter((n) => n.dateGroup === label),
  })).filter((g) => g.items.length > 0)

  function handleCopyCode(code) {
    navigator.vibrate?.([10, 30, 10])
    navigator.clipboard?.writeText(code).catch(() => {})
    toast(`Code ${code} copied!`, 'success')
  }

  return (
    <PageTransition direction={direction}>
      <div className="min-h-dvh bg-[var(--color-surface)]">
        <AppHeader />

        <main className="pt-28 pb-32 px-6">
          {/* Header */}
          <motion.section className="mb-8" variants={listVariants} initial="hidden" animate="show">
            <motion.span variants={fadeUpVariants} className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-outline)] font-bold mb-2 block font-['Inter']">
              {t('notifications.intelligentMonitoring')}
            </motion.span>
            <motion.div variants={fadeUpVariants} className="flex items-end justify-between">
              <div>
                <h2
                  className="font-['Manrope'] text-4xl font-extrabold text-[var(--color-on-background)] leading-tight"
                  style={{ letterSpacing: '-1px' }}
                >
                  {t('notifications.heading')}
                </h2>
                {unreadCount > 0 && (
                  <p className="text-[var(--color-primary)] text-sm font-bold font-['Inter'] mt-1">
                    {t('notifications.unread', { count: unreadCount })}
                  </p>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[var(--color-primary)] text-sm font-bold font-['Inter'] active:opacity-70 transition-opacity"
                >
                  {t('notifications.markRead')}
                </button>
              )}
            </motion.div>
          </motion.section>

          {notifications.length === 0 ? (
            <motion.div
              variants={fadeUpVariants} initial="hidden" animate="show"
              className="flex flex-col items-center py-16 text-center"
            >
              <span className="material-symbols-rounded text-[48px] mb-3" style={{ color: 'var(--color-outline-variant)' }}>
                notifications_off
              </span>
              <p className="font-['Manrope'] font-bold text-[var(--color-on-surface)] mb-1">{t('notifications.noNotifications')}</p>
              <p className="text-sm text-[var(--color-on-surface-variant)] font-['Inter']">
                {t('notifications.noNotificationsDesc')}
              </p>
            </motion.div>
          ) : (
            grouped.map((group) => (
              <motion.section
                key={group.label}
                className="mb-8"
                variants={listVariants} initial="hidden" animate="show"
              >
                <motion.p
                  variants={fadeUpVariants}
                  className="text-[11px] font-black uppercase tracking-widest text-[var(--color-outline)] mb-4 font-['Inter']"
                >
                  {group.label}
                </motion.p>
                <div className="space-y-4">
                  {group.items.map((n) => {
                    const CardComponent = cardMap[n.type]
                    if (!CardComponent) return null
                    return (
                      <motion.div key={n.id} variants={cardVariants}>
                        <SwipeableDismissCard
                          n={n}
                          onDismiss={() => dismissNotification(n.id)}
                        >
                          <CardComponent
                            n={n}
                            onRead={() => !n.read && markAsRead(n.id)}
                            onCopyCode={handleCopyCode}
                            onViewDeal={handleViewDeal}
                          />
                        </SwipeableDismissCard>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.section>
            ))
          )}

          {notifications.length > 0 && (
            <motion.div
              className="py-12 flex flex-col items-center justify-center opacity-40"
              initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: 0.5 }}
            >
              <span className="material-symbols-rounded text-[36px] mb-2 text-[var(--color-outline)]">
                notifications_paused
              </span>
              <p className="text-sm font-semibold tracking-wide font-['Inter'] text-[var(--color-outline)]">
                {t('notifications.endOfUpdates')}
              </p>
            </motion.div>
          )}
        </main>

        <BottomNav />
      </div>
    </PageTransition>
  )
}
