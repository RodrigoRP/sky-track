import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { isPushSupported, getPushPermission, subscribeToPush } from '../lib/pushNotifications'

const BASE_SLIDES = [
  {
    icon: 'radar',
    gradient: 'linear-gradient(160deg, #003178 0%, #1565c0 100%)',
    title: 'Track Any Route',
    subtitle: 'Set price alerts for your dream destinations and let SkyTrack monitor 24/7 — so you never miss a deal.',
    stat: { value: '60+', label: 'airports tracked worldwide' },
  },
  {
    icon: 'notifications_active',
    gradient: 'linear-gradient(160deg, #1b6d24 0%, #388e3c 100%)',
    title: 'Get Notified Instantly',
    subtitle: 'Receive alerts via push, WhatsApp, or email the moment prices drop to your target price.',
    stat: { value: '<5 min', label: 'average alert delivery time' },
  },
  {
    icon: 'savings',
    gradient: 'linear-gradient(160deg, #5b2500 0%, #8d4200 100%)',
    title: 'Save on Every Flight',
    subtitle: 'Our users save an average of $340 per trip. Start monitoring today and never overpay again.',
    stat: { value: '$340', label: 'average savings per trip' },
  },
]

const PUSH_SLIDE = {
  icon: 'circle_notifications',
  gradient: 'linear-gradient(160deg, #003178 0%, #0d47a1 100%)',
  title: 'Never Miss a Deal',
  subtitle: 'Enable push notifications to get price drop alerts instantly — even when the app is closed.',
  stat: { value: 'Instant', label: 'alerts to your device' },
  isPushSlide: true,
}

function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center z-[200]"
      style={{ background: 'linear-gradient(160deg, #003178 0%, #0d47a1 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Glow rings */}
      <div
        className="absolute w-72 h-72 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(176,198,255,0.4) 0%, transparent 70%)' }}
      />

      {/* Icon */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 22 }}
        className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8"
        style={{ background: 'rgba(255,255,255,0.15)', boxShadow: '0 16px 48px rgba(0,0,0,0.25)' }}
      >
        <span
          className="material-symbols-rounded text-white"
          style={{ fontSize: 48, fontVariationSettings: "'FILL' 1" }}
        >
          flight
        </span>
      </motion.div>

      {/* Wordmark */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="font-['Manrope'] font-black text-white text-4xl mb-3"
        style={{ letterSpacing: '-1px' }}
      >
        SkyTrack
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="font-['Inter'] font-medium text-white/70 text-base tracking-wide"
      >
        Your Personal Flight Concierge
      </motion.p>

      {/* Loading dots */}
      <motion.div
        className="absolute bottom-16 flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.div>
    </motion.div>
  )
}

function SlidesScreen({ onComplete }) {
  const slides = useMemo(() => {
    const showPush = isPushSupported() && getPushPermission() !== 'granted'
    return showPush ? [...BASE_SLIDES, PUSH_SLIDE] : BASE_SLIDES
  }, [])

  const [current, setCurrent] = useState(0)
  const isLast = current === slides.length - 1
  const currentSlide = slides[current]

  function next() {
    if (isLast) onComplete()
    else setCurrent((c) => c + 1)
  }

  async function handleAllowPush() {
    await subscribeToPush().catch(() => {})
    next()
  }

  function handleDragEnd(_, info) {
    if (info.offset.x < -60 && !isLast) setCurrent((c) => c + 1)
    else if (info.offset.x > 60 && current > 0) setCurrent((c) => c - 1)
  }

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: 'var(--color-surface)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Skip */}
      <div className="absolute top-0 right-0 p-6 z-10">
        <button
          onClick={onComplete}
          className="font-['Inter'] font-semibold text-sm active:opacity-60 transition-opacity"
          style={{ color: 'var(--color-outline)' }}
        >
          Skip
        </button>
      </div>

      {/* Slides container */}
      <div className="flex-1 overflow-hidden">
        <motion.div
          className="flex h-full"
          style={{ width: `${slides.length * 100}%` }}
          animate={{ x: `-${(100 / slides.length) * current}%` }}
          transition={{ type: 'spring', stiffness: 380, damping: 36 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragEnd={handleDragEnd}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              className="flex flex-col h-full"
              style={{ width: `${100 / slides.length}%` }}
            >
              {/* Illustration area */}
              <div
                className="flex items-center justify-center relative"
                style={{ height: '42%', background: slide.gradient }}
              >
                <div
                  className="absolute inset-0 opacity-20"
                  style={{ background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)' }}
                />
                <motion.div
                  key={`icon-${i}-${current === i}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={current === i ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.1 }}
                  className="w-28 h-28 rounded-[32px] flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.18)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
                >
                  <span
                    className="material-symbols-rounded text-white"
                    style={{ fontSize: 56, fontVariationSettings: "'FILL' 1" }}
                  >
                    {slide.icon}
                  </span>
                </motion.div>
              </div>

              {/* Content area */}
              <div className="flex-1 flex flex-col px-8 pt-10 pb-6">
                <motion.h2
                  key={`title-${i}-${current === i}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={current === i ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                  transition={{ duration: 0.35, delay: 0.15 }}
                  className="font-['Manrope'] font-extrabold text-[var(--color-on-surface)] mb-3"
                  style={{ fontSize: 26, letterSpacing: '-0.5px' }}
                >
                  {slide.title}
                </motion.h2>
                <motion.p
                  key={`sub-${i}-${current === i}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={current === i ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                  transition={{ duration: 0.35, delay: 0.22 }}
                  className="font-['Inter'] text-[var(--color-on-surface-variant)] text-base leading-relaxed mb-6"
                >
                  {slide.subtitle}
                </motion.p>

                {/* Stat pill */}
                <motion.div
                  key={`stat-${i}-${current === i}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={current === i ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl self-start"
                  style={{ background: 'var(--color-surface-container-low)' }}
                >
                  <span
                    className="font-['Manrope'] font-black text-xl"
                    style={{ color: 'var(--color-primary)', letterSpacing: '-0.5px' }}
                  >
                    {slide.stat.value}
                  </span>
                  <span className="font-['Inter'] text-sm text-[var(--color-on-surface-variant)]">
                    {slide.stat.label}
                  </span>
                </motion.div>

                <div className="flex-1" />

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  {slides.map((_, di) => (
                    <button
                      key={di}
                      onClick={() => setCurrent(di)}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: di === current ? 24 : 8,
                        height: 8,
                        background: di === current ? 'var(--color-primary)' : 'var(--color-outline-variant)',
                      }}
                    />
                  ))}
                </div>

                {/* CTA button(s) */}
                {isLast && currentSlide.isPushSlide ? (
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleAllowPush}
                      className="w-full py-4 rounded-2xl font-['Manrope'] font-bold text-lg text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                      style={{
                        background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-container))',
                        boxShadow: '0 8px 24px rgba(0,49,120,0.20)',
                      }}
                    >
                      <span className="material-symbols-rounded text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        notifications_active
                      </span>
                      Allow Notifications
                    </button>
                    <button
                      onClick={next}
                      className="w-full py-3 font-['Inter'] text-sm font-semibold active:opacity-60 transition-opacity"
                      style={{ color: 'var(--color-outline)' }}
                    >
                      Maybe Later
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={next}
                    className="w-full py-4 rounded-2xl font-['Manrope'] font-bold text-lg text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    style={{
                      background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-container))',
                      boxShadow: '0 8px 24px rgba(0,49,120,0.20)',
                    }}
                  >
                    {isLast ? (
                      <>
                        <span className="material-symbols-rounded text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          rocket_launch
                        </span>
                        Get Started
                      </>
                    ) : (
                      <>
                        Next
                        <span className="material-symbols-rounded text-[20px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function Onboarding({ onComplete }) {
  const [phase, setPhase] = useState('splash')

  useEffect(() => {
    const timer = setTimeout(() => setPhase('slides'), 2000)
    return () => clearTimeout(timer)
  }, [])

  if (phase === 'splash') return <SplashScreen />
  return <SlidesScreen onComplete={onComplete} />
}
