import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAppStore } from '../store/useAppStore'

// Reset store between tests by reinitialising with default state
beforeEach(() => {
  useAppStore.setState({
    alerts: [],
    notifications: [],
    settings: {
      notifications: { push: true, whatsapp: false, email: false },
      currency: 'USD ($)',
      language: 'English',
      alertFrequency: 'realtime',
      theme: 'system',
      onboardingDone: false,
      sortAlerts: 'newest',
    },
  })
})

// ── addAlert ─────────────────────────────────────────────────────────────────

describe('addAlert', () => {
  it('adds an alert to the store', () => {
    const { addAlert } = useAppStore.getState()
    addAlert({ origin: 'NYC', destination: 'LON', dates: 'Oct 12', targetPrice: 450 })
    expect(useAppStore.getState().alerts).toHaveLength(1)
  })

  it('returns the new alert id', () => {
    const { addAlert } = useAppStore.getState()
    const id = addAlert({ origin: 'SFO', destination: 'TYO', dates: 'Nov 1', targetPrice: 800 })
    expect(typeof id).toBe('number')
    expect(id).toBeGreaterThan(0)
  })

  it('sets status to active by default', () => {
    const { addAlert } = useAppStore.getState()
    addAlert({ origin: 'NYC', destination: 'PAR', dates: 'Dec 1', targetPrice: 500 })
    const [alert] = useAppStore.getState().alerts
    expect(alert.status).toBe('active')
  })

  it('generates a priceHistory array', () => {
    const { addAlert } = useAppStore.getState()
    addAlert({ origin: 'NYC', destination: 'MIA', dates: 'Jan 1', targetPrice: 200 })
    const [alert] = useAppStore.getState().alerts
    expect(Array.isArray(alert.priceHistory)).toBe(true)
    expect(alert.priceHistory.length).toBeGreaterThan(0)
  })
})

// ── removeAlert ──────────────────────────────────────────────────────────────

describe('removeAlert', () => {
  it('removes the alert with the matching id', () => {
    const { addAlert, removeAlert } = useAppStore.getState()
    const id = addAlert({ origin: 'NYC', destination: 'LON', dates: 'Oct', targetPrice: 400 })
    removeAlert(id)
    expect(useAppStore.getState().alerts).toHaveLength(0)
  })

  it('does not remove other alerts', () => {
    // Use fake timers so consecutive addAlert() calls get distinct Date.now() IDs
    vi.useFakeTimers()
    vi.setSystemTime(1000)
    const store = useAppStore.getState()
    const id1 = store.addAlert({ origin: 'NYC', destination: 'LON', dates: 'Oct', targetPrice: 400 })
    vi.setSystemTime(2000)
    store.addAlert({ origin: 'SFO', destination: 'TYO', dates: 'Nov', targetPrice: 800 })
    vi.useRealTimers()
    store.removeAlert(id1)
    expect(useAppStore.getState().alerts).toHaveLength(1)
    expect(useAppStore.getState().alerts[0].origin).toBe('SFO')
  })
})

// ── toggleAlertStatus ────────────────────────────────────────────────────────

describe('toggleAlertStatus', () => {
  it('pauses an active alert', () => {
    const { addAlert, toggleAlertStatus } = useAppStore.getState()
    const id = addAlert({ origin: 'NYC', destination: 'LON', dates: 'Oct', targetPrice: 400 })
    toggleAlertStatus(id)
    const alert = useAppStore.getState().alerts.find((a) => a.id === id)
    expect(alert.status).toBe('paused')
  })

  it('resumes a paused alert', () => {
    const { addAlert, toggleAlertStatus } = useAppStore.getState()
    const id = addAlert({ origin: 'NYC', destination: 'LON', dates: 'Oct', targetPrice: 400 })
    toggleAlertStatus(id)
    toggleAlertStatus(id)
    const alert = useAppStore.getState().alerts.find((a) => a.id === id)
    expect(alert.status).toBe('active')
  })
})

// ── updateAlert ──────────────────────────────────────────────────────────────

describe('updateAlert', () => {
  it('patches only the specified fields', () => {
    const { addAlert, updateAlert } = useAppStore.getState()
    const id = addAlert({ origin: 'NYC', destination: 'LON', dates: 'Oct', targetPrice: 400 })
    updateAlert(id, { targetPrice: 350 })
    const alert = useAppStore.getState().alerts.find((a) => a.id === id)
    expect(alert.targetPrice).toBe(350)
    expect(alert.origin).toBe('NYC') // untouched
  })
})

// ── updateSetting ────────────────────────────────────────────────────────────

describe('updateSetting', () => {
  it('updates a top-level setting', () => {
    const { updateSetting } = useAppStore.getState()
    updateSetting('currency', 'EUR (€)')
    expect(useAppStore.getState().settings.currency).toBe('EUR (€)')
  })

  it('does not overwrite other settings', () => {
    const { updateSetting } = useAppStore.getState()
    updateSetting('language', 'Português')
    expect(useAppStore.getState().settings.currency).toBe('USD ($)')
  })
})

// ── notifications ────────────────────────────────────────────────────────────

describe('notifications', () => {
  beforeEach(() => {
    useAppStore.setState({
      ...useAppStore.getState(),
      notifications: [
        { id: 1, type: 'price_drop', read: false, dateGroup: 'Today' },
        { id: 2, type: 'target_reached', read: false, dateGroup: 'Today' },
      ],
    })
  })

  it('markAsRead marks a single notification', () => {
    useAppStore.getState().markAsRead(1)
    const notifs = useAppStore.getState().notifications
    expect(notifs.find((n) => n.id === 1).read).toBe(true)
    expect(notifs.find((n) => n.id === 2).read).toBe(false)
  })

  it('markAllAsRead marks all notifications', () => {
    useAppStore.getState().markAllAsRead()
    const allRead = useAppStore.getState().notifications.every((n) => n.read)
    expect(allRead).toBe(true)
  })

  it('dismissNotification removes the notification', () => {
    useAppStore.getState().dismissNotification(1)
    expect(useAppStore.getState().notifications).toHaveLength(1)
    expect(useAppStore.getState().notifications[0].id).toBe(2)
  })
})
