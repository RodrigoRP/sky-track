import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from 'recharts'
import AppHeader from '../components/AppHeader'
import PageTransition from '../components/PageTransition'
import { useAppStore } from '../store/useAppStore'
import { useToast } from '../hooks/useToast'
import { refreshAlertPrice } from '../lib/alertsApi'
import { isSupabaseEnabled } from '../lib/supabase'
import { listVariants, cardVariants, fadeUpVariants } from '../hooks/useAnimVariants'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="px-3 py-2 rounded-xl font-['Inter']"
      style={{
        background: 'var(--color-inverse-surface)',
        color: 'var(--color-inverse-on-surface)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      }}
    >
      <div className="font-black text-base" style={{ letterSpacing: '-0.3px' }}>${payload[0].value}</div>
      <div className="text-[10px] opacity-60 mt-0.5">{label}</div>
    </div>
  )
}

function predictTrend(priceHistory) {
  if (!priceHistory || priceHistory.length < 3) return null
  const pts = priceHistory.slice(-5)
  const n = pts.length
  const xMean = (n - 1) / 2
  const yMean = pts.reduce((s, p) => s + p.price, 0) / n
  const num = pts.reduce((s, p, i) => s + (i - xMean) * (p.price - yMean), 0)
  const den = pts.reduce((s, _, i) => s + Math.pow(i - xMean, 2), 0)
  const slope = den !== 0 ? num / den : 0
  if (slope < -4) return { labelKey: 'alertDetail.forecastDown', icon: 'trending_down', color: 'var(--color-secondary)', bg: 'var(--color-secondary-container)', textColor: 'var(--color-on-secondary-container)' }
  if (slope > 4) return { labelKey: 'alertDetail.forecastUp', icon: 'trending_up', color: 'var(--color-tertiary)', bg: 'rgba(91,37,0,0.10)', textColor: 'var(--color-tertiary)' }
  return { labelKey: 'alertDetail.forecastFlat', icon: 'trending_flat', color: 'var(--color-outline)', bg: 'var(--color-surface-container)', textColor: 'var(--color-on-surface-variant)' }
}

export default function AlertDetail({ direction }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { id } = useParams()
  const alerts = useAppStore((s) => s.alerts)
  const removeAlert = useAppStore((s) => s.removeAlert)
  const toggleAlertStatus = useAppStore((s) => s.toggleAlertStatus)
  const updateAlert = useAppStore((s) => s.updateAlert)
  const d = alerts.find((a) => String(a.id) === id) ?? alerts[0]
  const trendDown = d?.trend === 'down'
  const isBestPriceEver = d && d.currentPrice <= d.lowPrice
  const lowestPoint = d?.priceHistory?.reduce((min, p) => p.price < min.price ? p : min, d.priceHistory[0])
  const prediction = d ? predictTrend(d.priceHistory) : null
  const [refreshing, setRefreshing] = useState(false)
  const [showDeleteSheet, setShowDeleteSheet] = useState(false)
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [editTargetPrice, setEditTargetPrice] = useState(0)
  const [editDeparture, setEditDeparture] = useState('')
  const [editReturn, setEditReturn] = useState('')
  const toast = useToast()

  async function handleRefresh() {
    if (!isSupabaseEnabled || refreshing) return
    setRefreshing(true)
    vibrate([10])
    try {
      const update = await refreshAlertPrice(d.id)
      if (update) {
        updateAlert(d.id, update)
        toast(t('alertDetail.pricesUpdated'), 'success')
      }
    } catch {
      toast(t('alertDetail.refreshError'), 'error')
    } finally {
      setRefreshing(false)
    }
  }

  function vibrate(pattern = [10]) {
    navigator.vibrate?.(pattern)
  }

  async function handleShare() {
    vibrate([10, 50, 10])
    const url = `https://www.google.com/flights?q=flights+from+${d.origin}+to+${d.destination}`
    const shareData = {
      title: `${d.origin} → ${d.destination} — $${d.currentPrice}`,
      text: `Flight alert: ${d.origin} → ${d.destination} is now $${d.currentPrice}. Target: $${d.targetPrice}.`,
      url,
    }
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData)
      } catch {
        // user cancelled — no-op
      }
    } else {
      await navigator.clipboard?.writeText(url).catch(() => {})
      toast(t('alertDetail.linkCopied'), 'success')
    }
  }

  function openEditSheet() {
    setEditTargetPrice(d.targetPrice ?? d.currentPrice)
    setEditDeparture(d.departureMonth ?? '')
    setEditReturn(d.returnMonth ?? '')
    setShowEditSheet(true)
  }

  function handleSaveEdit() {
    if (!editTargetPrice || editTargetPrice <= 0) {
      toast(t('alertDetail.errTargetPrice'), 'error')
      return
    }
    if (editDeparture && editReturn && editReturn < editDeparture) {
      toast(t('alertDetail.errReturnAfterDeparture'), 'error')
      return
    }
    const changes = { targetPrice: Number(editTargetPrice) }
    if (editDeparture) {
      changes.departureMonth = editDeparture
      const [year, month] = editDeparture.split('-')
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      const depLabel = `${monthNames[Number(month) - 1]} ${year}`
      if (editReturn) {
        changes.returnMonth = editReturn
        const [ryear, rmonth] = editReturn.split('-')
        const retLabel = `${monthNames[Number(rmonth) - 1]} ${ryear}`
        changes.dates = `${depLabel} – ${retLabel}`
      } else {
        changes.dates = depLabel
      }
    }
    updateAlert(d.id, changes)
    setShowEditSheet(false)
    toast(t('alertDetail.alertUpdated'), 'success')
  }

  if (!d) {
    return (
      <div className="min-h-dvh bg-[var(--color-surface)] flex items-center justify-center">
        <div className="text-center px-8">
          <span className="material-symbols-rounded text-[48px] text-[var(--color-outline)] mb-4 block">search_off</span>
          <p className="font-['Manrope'] font-bold text-[var(--color-on-surface)] mb-2">{t('alertDetail.notFound')}</p>
          <button onClick={() => navigate('/dashboard')} className="text-[var(--color-primary)] font-semibold font-['Inter']">
            {t('alertDetail.backToDashboard')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <PageTransition direction={direction}>
    <div className="min-h-dvh bg-[var(--color-surface)]">
      <AppHeader
        title={`${d.origin} → ${d.destination}`}
        showBack
        onBack={() => navigate(-1)}
        action={
          <div className="flex items-center gap-1">
            {isSupabaseEnabled && (
              <button onClick={handleRefresh} disabled={refreshing} aria-label="Refresh prices" className="active:scale-90 transition-transform p-1 disabled:opacity-50">
                <span className={`material-symbols-rounded text-[var(--color-on-surface-variant)] text-[22px] ${refreshing ? 'animate-spin' : ''}`}>
                  refresh
                </span>
              </button>
            )}
            <button onClick={handleShare} aria-label="Share this deal" className="active:scale-90 transition-transform p-1">
              <span className="material-symbols-rounded text-[var(--color-on-surface-variant)] text-[22px]">
                share
              </span>
            </button>
          </div>
        }
      />

      <motion.main
        className="pt-28 pb-32 px-6"
        variants={listVariants} initial="hidden" animate="show"
      >
        {/* Hero Price */}
        <motion.section variants={fadeUpVariants} className="mt-4 mb-8">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)] font-['Inter']">
              {t('alertDetail.currentLowest')}
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className="font-['Manrope'] text-5xl font-extrabold text-[var(--color-secondary)]"
                style={{ letterSpacing: '-2px' }}
              >
                ${d.currentPrice}
              </span>
              <span className="text-[var(--color-secondary)] font-medium font-['Inter']">USD</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                background: trendDown ? 'var(--color-secondary-container)' : 'var(--color-tertiary-container)',
                color: trendDown ? 'var(--color-on-secondary-container)' : 'var(--color-on-tertiary-container)',
              }}
            >
              <span
                className="material-symbols-rounded text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {trendDown ? 'trending_down' : 'trending_up'}
              </span>
              <span className="text-sm font-bold tracking-tight font-['Inter']">{d.trendLabel}</span>
            </div>
            {isBestPriceEver && (
              <div
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full"
                style={{ background: 'var(--color-secondary)', color: 'white' }}
              >
                <span className="material-symbols-rounded text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  military_tech
                </span>
                <span className="text-sm font-bold font-['Inter']">{t('alertDetail.bestPriceEver')}</span>
              </div>
            )}
          </div>

          {/* Trend prediction */}
          {prediction && (
            <div
              className="mt-4 flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: prediction.bg }}
            >
              <span
                className="material-symbols-rounded text-[20px]"
                style={{ color: prediction.color, fontVariationSettings: "'FILL' 1" }}
              >
                {prediction.icon}
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest font-['Inter'] opacity-60" style={{ color: prediction.textColor }}>
                  {t('alertDetail.aiForecast')}
                </p>
                <p className="text-sm font-semibold font-['Inter']" style={{ color: prediction.textColor }}>
                  {t(prediction.labelKey)}
                </p>
              </div>
            </div>
          )}
        </motion.section>

        {/* Price History */}
        <motion.section variants={cardVariants} className="mb-10">
          <div
            className="rounded-3xl p-6 relative overflow-hidden"
            style={{ background: 'var(--color-surface-container-lowest)', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}
          >
            <div className="flex justify-between items-end mb-8">
              <div>
                <h3 className="font-['Manrope'] font-bold text-lg text-[var(--color-on-surface)]">
                  {t('alertDetail.priceHistory')}
                </h3>
                <p className="text-sm text-[var(--color-on-surface-variant)] font-['Inter']">{t('alertDetail.last30Days')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-[var(--color-tertiary)] font-['Inter']">
                  {t('alertDetail.peak', { value: d.peakPrice })}
                </p>
              </div>
            </div>

            <div
              className="rounded-xl overflow-hidden p-3"
              style={{ background: 'var(--color-surface-container)' }}
            >
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={d.priceHistory} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1b6d24" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#1b6d24" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 9, fill: 'var(--color-outline)', fontFamily: 'Inter' }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={['dataMin - 50', 'dataMax + 50']}
                    tick={{ fontSize: 9, fill: 'var(--color-outline)', fontFamily: 'Inter' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={d.currentPrice}
                    stroke="#1b6d24"
                    strokeDasharray="4 3"
                    strokeWidth={1.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#1b6d24"
                    strokeWidth={3}
                    fill="url(#priceGrad)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#1b6d24', stroke: 'white', strokeWidth: 2 }}
                  />
                  {lowestPoint && (
                    <ReferenceDot
                      x={lowestPoint.day}
                      y={lowestPoint.price}
                      r={6}
                      fill="var(--color-secondary)"
                      stroke="white"
                      strokeWidth={2}
                      label={{ value: t('alertDetail.low'), position: 'top', fontSize: 8, fill: 'var(--color-secondary)', fontFamily: 'Inter', fontWeight: 700 }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div
              className="flex justify-between mt-4 pt-4"
              style={{ borderTop: '1px solid var(--color-surface-variant)' }}
            >
              <div className="flex flex-col">
                <span className="text-[10px] uppercase text-[var(--color-on-surface-variant)] font-['Inter']">{t('alertDetail.low')}</span>
                <span className="font-['Manrope'] font-bold text-[var(--color-secondary)]">${d.lowPrice}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] uppercase text-[var(--color-on-surface-variant)] font-['Inter']">{t('alertDetail.current')}</span>
                <span className="font-['Manrope'] font-bold text-[var(--color-primary)]">${d.currentPrice}</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Smart Alternatives */}
        {d.alternatives?.length > 0 && <motion.section variants={cardVariants} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-['Manrope'] font-bold text-xl text-[var(--color-on-surface)]">
              {t('alertDetail.smartAlternatives')}
            </h3>
            <span className="text-[var(--color-secondary)] font-bold text-sm font-['Inter']">{t('alertDetail.savePlus')}</span>
          </div>
          <div className="flex flex-col gap-4">
            {d.alternatives.map((alt) => (
              <div
                key={alt.id}
                className="rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-all"
                style={{ background: 'var(--color-surface-container-low)' }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                    style={{ background: 'var(--color-surface-container-lowest)' }}
                  >
                    <span className="material-symbols-rounded text-[var(--color-primary)]">
                      {alt.type === 'airport' ? 'flight_takeoff' : 'calendar_month'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-['Manrope'] font-bold text-[var(--color-on-surface)]">{alt.label}</h4>
                    <p className="text-sm text-[var(--color-on-surface-variant)] font-['Inter']">{alt.sublabel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-['Manrope'] font-extrabold text-[var(--color-secondary)]">
                    ${alt.price}
                  </div>
                  <div className="text-[10px] font-bold text-[var(--color-secondary)] uppercase tracking-tighter font-['Inter']">
                    {t('alertDetail.savings', { value: alt.savings })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>}

        {/* Alert Actions */}
        <motion.section variants={cardVariants} className="mb-8 flex gap-3">
          <button
            onClick={() => { vibrate(); openEditSheet() }}
            className="flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-['Manrope'] font-bold text-sm transition-all active:scale-[0.98]"
            style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-primary)' }}
          >
            <span className="material-symbols-rounded text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              edit
            </span>
            {t('alerts.edit')}
          </button>
          <button
            onClick={() => { toggleAlertStatus(d.id); toast(d.status === 'active' ? t('alertDetail.alertPaused') : t('alertDetail.alertResumed'), d.status === 'active' ? 'default' : 'success') }}
            className="flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-['Manrope'] font-bold text-sm transition-all active:scale-[0.98]"
            style={
              d.status === 'active'
                ? { background: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }
                : { background: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' }
            }
          >
            <span className="material-symbols-rounded text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {d.status === 'active' ? 'pause_circle' : 'play_circle'}
            </span>
            {d.status === 'active' ? t('alerts.pause') : t('alerts.resume')}
          </button>
          <button
            onClick={() => setShowDeleteSheet(true)}
            className="flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-['Manrope'] font-bold text-sm transition-all active:scale-[0.98]"
            style={{ background: 'var(--color-error-container)', color: 'var(--color-on-error-container)' }}
          >
            <span className="material-symbols-rounded text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              delete
            </span>
            {t('alerts.delete')}
          </button>
        </motion.section>

        {/* Destination Image */}
        <motion.section variants={cardVariants} className="mb-12">
          <div className="relative h-48 rounded-3xl overflow-hidden">
            <img
              src={d.image}
              alt={d.destinationFull}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 flex items-end p-6"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }}
            >
              <div className="text-white">
                <p className="text-xs font-['Inter'] uppercase tracking-widest opacity-80 mb-1">
                  {t('alertDetail.destinationHighlight')}
                </p>
                <h4
                  className="text-2xl font-['Manrope'] font-black"
                  style={{ letterSpacing: '-0.5px' }}
                >
                  {d.destinationFull}
                </h4>
              </div>
            </div>
          </div>
        </motion.section>
      </motion.main>

      {/* Edit sheet */}
      {showEditSheet && (
        <>
          <div
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
            onClick={() => setShowEditSheet(false)}
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
              <h3 className="font-['Manrope'] font-bold text-lg text-[var(--color-on-surface)]">
                {t('alertDetail.editAlert')}
              </h3>
              <button onClick={() => setShowEditSheet(false)}>
                <span className="material-symbols-rounded text-[var(--color-outline)]">close</span>
              </button>
            </div>

            {/* Target Price slider */}
            <div className="mb-6">
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-sm font-bold text-[var(--color-on-surface-variant)] font-['Inter'] uppercase tracking-widest text-[10px]">
                  {t('createAlert.targetPrice')}
                </span>
                <span className="font-['Manrope'] font-black text-2xl text-[var(--color-primary)]" style={{ letterSpacing: '-0.5px' }}>
                  ${editTargetPrice}
                </span>
              </div>
              <input
                type="range"
                min={Math.round((d.lowPrice ?? 100) * 0.8)}
                max={d.peakPrice ?? 2000}
                step={10}
                value={editTargetPrice}
                onChange={(e) => setEditTargetPrice(Number(e.target.value))}
                className="w-full accent-[var(--color-primary)] h-2 rounded-full"
                style={{ accentColor: 'var(--color-primary)' }}
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-[var(--color-outline)] font-['Inter']">
                  ${Math.round((d.lowPrice ?? 100) * 0.8)}
                </span>
                <span className="text-[10px] text-[var(--color-outline)] font-['Inter']">
                  ${d.peakPrice ?? 2000}
                </span>
              </div>
            </div>

            {/* Dates */}
            <div className="mb-8 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-on-surface-variant)] font-['Inter']">
                {t('alertDetail.travelDatesOptional')}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[var(--color-outline)] font-['Inter'] mb-1 block">{t('createAlert.departure')}</label>
                  <input
                    type="month"
                    value={editDeparture}
                    onChange={(e) => setEditDeparture(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm font-['Inter'] outline-none"
                    style={{
                      background: 'var(--color-surface-container)',
                      color: 'var(--color-on-surface)',
                      border: '1.5px solid var(--color-outline-variant)',
                    }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--color-outline)] font-['Inter'] mb-1 block">{t('createAlert.return')}</label>
                  <input
                    type="month"
                    value={editReturn}
                    onChange={(e) => setEditReturn(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm font-['Inter'] outline-none"
                    style={{
                      background: 'var(--color-surface-container)',
                      color: 'var(--color-on-surface)',
                      border: '1.5px solid var(--color-outline-variant)',
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSaveEdit}
                className="w-full py-4 rounded-2xl font-['Manrope'] font-bold text-sm text-white"
                style={{ background: 'var(--color-primary)', boxShadow: '0 8px 24px rgba(0,49,120,0.20)' }}
              >
                {t('alertDetail.saveChanges')}
              </button>
              <button
                onClick={() => setShowEditSheet(false)}
                className="w-full py-4 rounded-2xl font-['Manrope'] font-bold text-sm"
                style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface)' }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation sheet */}
      {showDeleteSheet && (
        <>
          <div
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
            onClick={() => setShowDeleteSheet(false)}
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
            <h3 className="font-['Manrope'] font-bold text-lg text-[var(--color-on-surface)] mb-2">
              {t('alertDetail.deleteTitle')}
            </h3>
            <p className="text-sm text-[var(--color-on-surface-variant)] font-['Inter'] mb-6 leading-relaxed">
              {t('alertDetail.deleteDesc', { origin: d.origin, destination: d.destination })}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setShowDeleteSheet(false)}
                className="w-full py-4 rounded-2xl font-['Manrope'] font-bold text-sm"
                style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface)' }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => { vibrate([10, 80, 10]); removeAlert(d.id); toast(t('alerts.alertDeleted'), 'default'); navigate('/dashboard') }}
                className="w-full py-4 rounded-2xl font-['Manrope'] font-bold text-sm"
                style={{ background: 'var(--color-error)', color: 'white' }}
              >
                {t('alertDetail.deleteConfirm')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Fixed bottom action bar */}
      <div
        className="fixed bottom-0 left-0 w-full p-6 flex items-center justify-between z-40"
        style={{
          background: 'var(--color-glass)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--color-glass-nav-border)',
        }}
      >
        <div className="flex flex-col">
          <span
            className="font-['Manrope'] font-black text-2xl text-[var(--color-on-surface)]"
            style={{ letterSpacing: '-0.75px' }}
          >
            ${d.currentPrice}
          </span>
          <span className="text-[10px] uppercase text-[var(--color-on-surface-variant)] font-['Inter']">
            {t('alertDetail.totalPerTraveler')}
          </span>
        </div>
        <a
          href={`https://www.google.com/flights?q=flights+from+${d.origin}+to+${d.destination}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => vibrate([10, 30, 10])}
          className="text-white px-10 py-4 rounded-xl font-['Manrope'] font-bold active:scale-95 transition-all inline-flex items-center gap-2"
          style={{
            background: 'var(--color-primary)',
            boxShadow: '0 8px 24px rgba(0,49,120,0.2)',
          }}
        >
          {t('alerts.bookNow')}
          <span className="material-symbols-rounded text-[18px]">open_in_new</span>
        </a>
      </div>
    </div>
    </PageTransition>
  )
}
