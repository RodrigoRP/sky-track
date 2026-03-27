import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import PageTransition from '../components/PageTransition'
import { useAppStore } from '../store/useAppStore'
import { useToast } from '../hooks/useToast'
import { searchAirports, getFlag } from '../data/airports'
import { listVariants, fadeUpVariants } from '../hooks/useAnimVariants'

// ── Airport autocomplete input ────────────────────────────────────────────────
function AirportInput({ icon, label, placeholder, value, onChange, error }) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  // Keep internal query in sync when parent swaps values
  useEffect(() => { setQuery(value) }, [value])

  function handleChange(val) {
    setQuery(val)
    const results = searchAirports(val)
    setSuggestions(results)
    setOpen(results.length > 0)
    // If the typed text exactly matches a code already selected, keep it valid
    if (!val) onChange('')
  }

  function pick(airport) {
    const label = `${airport.code} — ${airport.city}`
    setQuery(label)
    onChange(airport.code)
    setSuggestions([])
    setOpen(false)
  }

  // Close dropdown on outside click
  useEffect(() => {
    function onOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-outline)] mb-2 ml-1 font-['Inter']">
        {label}
      </label>
      <div
        className="flex items-center rounded-2xl px-5 py-4 transition-all"
        style={{
          background: 'var(--color-surface-container-high)',
          boxShadow: error ? '0 0 0 1.5px var(--color-error)' : 'none',
        }}
      >
        <span className="material-symbols-rounded text-[var(--color-primary)] mr-3">{icon}</span>
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => query && setSuggestions(searchAirports(query)) && setOpen(true)}
          className="bg-transparent border-none p-0 w-full text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)]/60 outline-none font-medium font-['Inter'] text-sm"
          autoComplete="off"
        />
        {query ? (
          <button
            onClick={() => { setQuery(''); onChange(''); setSuggestions([]); setOpen(false) }}
            className="ml-2 text-[var(--color-outline)] active:scale-90 transition-transform"
          >
            <span className="material-symbols-rounded text-[18px]">close</span>
          </button>
        ) : null}
      </div>
      {error && (
        <p className="text-[10px] text-[var(--color-error)] font-semibold font-['Inter'] mt-1 ml-1">{error}</p>
      )}
      {open && suggestions.length > 0 && (
        <ul
          className="absolute left-0 right-0 top-full mt-1 rounded-2xl overflow-hidden z-30"
          style={{ background: 'var(--color-surface-container-lowest)', boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}
        >
          {suggestions.map((a) => (
            <li key={a.code}>
              <button
                onMouseDown={(e) => { e.preventDefault(); pick(a) }}
                className="w-full text-left px-5 py-3.5 flex items-center gap-3 active:bg-[var(--color-surface-container-low)] transition-colors"
              >
                <span
                  className="text-xs font-black font-['Manrope'] w-10 shrink-0"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {a.code}
                </span>
                <span className="text-sm font-medium font-['Inter'] text-[var(--color-on-surface)] truncate">
                  {a.city}
                </span>
                <span className="text-base ml-auto shrink-0" title={a.country}>
                  {getFlag(a.country)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Notification channel toggle card ─────────────────────────────────────────
function NotificationChannel({ icon, label, active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="flex flex-col items-center justify-center min-w-[100px] aspect-square rounded-3xl gap-2 active:scale-95 transition-all"
      style={{
        background: active ? 'var(--color-primary-container)' : 'var(--color-surface-container-low)',
        color: active ? 'white' : 'var(--color-outline)',
        boxShadow: active ? '0 8px 24px rgba(0,49,120,0.2)' : 'none',
      }}
    >
      <span
        className="material-symbols-rounded text-[24px]"
        style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
      >
        {icon}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-tighter font-['Inter']">{label}</span>
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CreateAlert({ direction }) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const addAlert = useAppStore((s) => s.addAlert)
  const toast = useToast()

  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [dateMode, setDateMode] = useState('fixed')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [targetPrice, setTargetPrice] = useState(450)
  const [directOnly, setDirectOnly] = useState(false)
  const [channels, setChannels] = useState({ push: true, whatsapp: false, email: false })
  const [errors, setErrors] = useState({})

  function swapRoutes() {
    const tmp = origin
    setOrigin(destination)
    setDestination(tmp)
  }

  function toggleChannel(ch) {
    setChannels((prev) => ({ ...prev, [ch]: !prev[ch] }))
  }

  function validate() {
    const errs = {}
    if (!origin) errs.origin = t('createAlert.errOrigin')
    if (!destination) errs.destination = t('createAlert.errDestination')
    if (origin && destination && origin === destination)
      errs.destination = t('createAlert.errSameRoute')
    if (dateMode === 'fixed') {
      if (!dateFrom) errs.dateFrom = t('createAlert.errDepartureMonth')
      if (!dateTo) errs.dateTo = t('createAlert.errReturnMonth')
      if (dateFrom && dateTo && dateFrom > dateTo)
        errs.dateTo = t('createAlert.errReturnAfterDeparture')
    }
    return errs
  }

  function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})

    const formatMonth = (ym) => {
      if (!ym) return t('createAlert.flexibleDates')
      const [y, m] = ym.split('-')
      return new Date(y, m - 1).toLocaleString(i18n.language, { month: 'short', year: 'numeric' })
    }

    const dates =
      dateMode === 'flexible'
        ? t('createAlert.flexibleDates')
        : `${formatMonth(dateFrom)} – ${formatMonth(dateTo)}`

    navigator.vibrate?.([10, 50, 10])
    const id = addAlert({ origin, destination, dates, currency: 'USD', targetPrice })
    if (id === null) {
      toast(t('createAlert.toastLimitReached'), 'error')
      return
    }
    toast(t('createAlert.toastCreated'), 'success')
    navigate(`/alert/${id}`)
  }

  const sliderPct = ((targetPrice - 100) / 1100) * 100

  return (
    <PageTransition direction={direction}>
    <div className="min-h-dvh bg-[var(--color-surface)]">
      <AppHeader title={t('createAlert.title')} showBack onBack={() => navigate(-1)} />

      <motion.main
        className="mt-28 px-6 pb-48 max-w-md mx-auto"
        variants={listVariants} initial="hidden" animate="show"
      >
        {/* Hero visual */}
        <motion.section variants={fadeUpVariants} className="mt-8 mb-10">
          <div className="relative w-full h-40 rounded-3xl overflow-hidden shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80"
              alt="Flight view"
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 flex items-end p-6"
              style={{ background: 'linear-gradient(to top, rgba(0,49,120,0.6) 0%, transparent 60%)' }}
            >
              <p className="text-white font-['Manrope'] font-bold text-xl leading-tight">
                {t('createAlert.hero')}
              </p>
            </div>
          </div>
        </motion.section>

        <div className="space-y-8">
          {/* Origin & Destination */}
          <div className="space-y-4">
            <AirportInput
              icon="flight_takeoff"
              label={t('createAlert.origin')}
              placeholder={t('createAlert.originPlaceholder')}
              value={origin}
              onChange={setOrigin}
              error={errors.origin}
            />
            <div className="flex justify-center -my-2 relative z-10">
              <button
                onClick={swapRoutes}
                aria-label="Swap origin and destination"
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform text-white"
                style={{ background: 'var(--color-primary-container)' }}
              >
                <span className="material-symbols-rounded text-lg">swap_vert</span>
              </button>
            </div>
            <AirportInput
              icon="flight_land"
              label={t('createAlert.destination')}
              placeholder={t('createAlert.destinationPlaceholder')}
              value={destination}
              onChange={setDestination}
              error={errors.destination}
            />
          </div>

          {/* Travel Dates */}
          <div className="space-y-4">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-outline)] ml-1 font-['Inter']">
              {t('createAlert.travelDates')}
            </label>
            <div
              className="p-1 rounded-2xl flex items-center"
              style={{ background: 'var(--color-surface-container-low)' }}
            >
              {[
                { label: t('createAlert.fixedMonths'), value: 'fixed' },
                { label: t('createAlert.flexibleDates'), value: 'flexible' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDateMode(opt.value)}
                  className="flex-1 py-3 text-sm font-semibold rounded-xl transition-colors font-['Inter']"
                  style={
                    dateMode === opt.value
                      ? {
                          background: 'var(--color-surface-container-lowest)',
                          color: 'var(--color-primary)',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                        }
                      : { color: 'var(--color-outline-variant)' }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {dateMode === 'fixed' ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'dateFrom', value: dateFrom, setter: setDateFrom, label: t('createAlert.departure'), error: errors.dateFrom },
                  { key: 'dateTo', value: dateTo, setter: setDateTo, label: t('createAlert.return'), error: errors.dateTo },
                ].map(({ key, value, setter, label, error }) => (
                  <div key={key}>
                    <label htmlFor={key} className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-outline)] mb-2 ml-1 font-['Inter']">
                      {label}
                    </label>
                    <div
                      className="relative rounded-2xl px-4 py-3.5 flex items-center gap-2"
                      style={{
                        background: 'var(--color-surface-container-high)',
                        boxShadow: error ? '0 0 0 1.5px var(--color-error)' : 'none',
                      }}
                    >
                      <span className="material-symbols-rounded text-[var(--color-primary)] text-[18px]">calendar_today</span>
                      <input
                        id={key}
                        type="month"
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        className="bg-transparent border-none outline-none w-full text-sm font-medium font-['Inter'] text-[var(--color-on-surface)] cursor-pointer"
                        style={{ colorScheme: 'light' }}
                      />
                    </div>
                    {error && (
                      <p className="text-[10px] text-[var(--color-error)] font-semibold font-['Inter'] mt-1 ml-1">{error}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="rounded-2xl px-5 py-4 flex items-center gap-3"
                style={{ background: 'var(--color-surface-container-high)' }}
              >
                <span className="material-symbols-rounded text-[var(--color-primary)]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  event_available
                </span>
                <div>
                  <p className="text-sm font-medium font-['Inter'] text-[var(--color-on-surface)]">{t('createAlert.anyDates')}</p>
                  <p className="text-[10px] text-[var(--color-outline)] font-['Inter']">{t('createAlert.anyDatesDesc')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Target Price */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-outline)] ml-1 font-['Inter']">
                {t('createAlert.targetPrice')}
              </label>
              <div className="text-right">
                <span className="text-[10px] font-bold text-[var(--color-secondary)] uppercase block mb-1 font-['Inter']">
                  {t('createAlert.greatDeal')}
                </span>
                <span
                  className="text-2xl font-['Manrope'] font-extrabold text-[var(--color-primary)]"
                  style={{ letterSpacing: '-0.5px' }}
                >
                  ${targetPrice}
                </span>
              </div>
            </div>
            <div className="relative py-2">
              <div
                className="h-1.5 w-full rounded-full overflow-hidden"
                style={{ background: 'var(--color-surface-container-high)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${sliderPct}%`,
                    background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-container))',
                  }}
                />
              </div>
              <input
                type="range"
                min={100}
                max={1200}
                step={10}
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                style={{ height: '100%' }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow-md border-4 pointer-events-none"
                style={{
                  left: `${sliderPct}%`,
                  borderColor: 'var(--color-primary)',
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-[var(--color-outline-variant)] uppercase font-['Inter']">
              <span>$100</span>
              <span>$1,200+</span>
            </div>
          </div>

          {/* Passengers & Direct */}
          <div className="grid grid-cols-1 gap-4">
            <div
              className="flex items-center justify-between rounded-3xl px-6 py-5"
              style={{ background: 'var(--color-surface-container-low)' }}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-rounded text-[var(--color-primary)]">person</span>
                <div>
                  <p className="text-sm font-bold font-['Inter'] text-[var(--color-on-surface)]">{t('createAlert.passengers')}</p>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase font-semibold font-['Inter']">
                    {t('createAlert.passengersDesc')}
                  </p>
                </div>
              </div>
              <span className="material-symbols-rounded text-[var(--color-outline)]">expand_more</span>
            </div>

            <div
              className="flex items-center justify-between rounded-3xl px-6 py-5"
              style={{ background: 'var(--color-surface-container-low)' }}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-rounded text-[var(--color-primary)]">directions_run</span>
                <div>
                  <p className="text-sm font-bold font-['Inter'] text-[var(--color-on-surface)]">{t('createAlert.directOnly')}</p>
                  <p className="text-[10px] text-[var(--color-outline-variant)] uppercase font-semibold font-['Inter']">
                    {t('createAlert.directOnlyDesc')}
                  </p>
                </div>
              </div>
              <div
                onClick={() => setDirectOnly((v) => !v)}
                className="relative cursor-pointer"
                style={{ width: 48, height: 24 }}
              >
                <div
                  className="absolute inset-0 rounded-full transition-colors"
                  style={{
                    background: directOnly ? 'var(--color-secondary-container)' : 'var(--color-surface-container-high)',
                  }}
                />
                <div
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform"
                  style={{ transform: directOnly ? 'translateX(24px)' : 'translateX(2px)' }}
                />
              </div>
            </div>
          </div>

          {/* Notification Channels */}
          <div className="space-y-4 pb-4">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-outline)] ml-1 font-['Inter']">
              {t('createAlert.notificationChannels')}
            </label>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
              <NotificationChannel
                icon="notifications_active"
                label="Push"
                active={channels.push}
                onToggle={() => toggleChannel('push')}
              />
              <NotificationChannel
                icon="chat_bubble"
                label="WhatsApp"
                active={channels.whatsapp}
                onToggle={() => toggleChannel('whatsapp')}
              />
              <NotificationChannel
                icon="mail"
                label="Email"
                active={channels.email}
                onToggle={() => toggleChannel('email')}
              />
            </div>
          </div>
        </div>
      </motion.main>

      {/* Fixed CTA */}
      <div className="fixed bottom-[72px] left-0 w-full z-40 px-6 py-3" style={{ background: 'linear-gradient(to top, white 60%, rgba(255,255,255,0))' }}>
        <button
          onClick={handleSubmit}
          className="w-full text-white font-['Manrope'] font-bold py-5 rounded-3xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-base"
          style={{
            background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-container))',
            boxShadow: '0 8px 24px rgba(0,49,120,0.2)',
          }}
        >
          <span>{t('createAlert.startMonitoring')}</span>
          <span className="material-symbols-rounded">rocket_launch</span>
        </button>
      </div>

      <BottomNav />
    </div>
    </PageTransition>
  )
}
