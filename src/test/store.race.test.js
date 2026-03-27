/**
 * Race-condition and ID-reconciliation tests for the Zustand store.
 * Requires Supabase mocked as enabled so the async branch in addAlert executes.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAppStore } from '../store/useAppStore'

// ── Module mocks ─────────────────────────────────────────────────────────────
const { mockInsert, mockUpdate, mockDelete } = vi.hoisted(() => ({
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {},
  isSupabaseEnabled: true,
}))

vi.mock('../lib/alertsApi', () => ({
  insertAlert: mockInsert,
  updateAlert: mockUpdate,
  deleteAlert: mockDelete,
}))

// ── Helpers ───────────────────────────────────────────────────────────────────
const flushMicrotasks = () => Promise.resolve().then(() => Promise.resolve())

const BASE_STATE = {
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
  user: null,
  recentlyUpdatedId: null,
  pendingIds: {},
  opQueue: [],
  idMap: {},
}

function makeRemote(overrides = {}) {
  return {
    id: 9999,
    origin: 'NYC',
    destination: 'LON',
    dates: 'Oct',
    targetPrice: 400,
    currentPrice: 450,
    currentBest: 450,
    status: 'active',
    trend: 'flat',
    change: 0,
    trendLabel: '',
    image: '',
    destinationFull: 'London',
    peakPrice: 580,
    lowPrice: 352,
    priceHistory: [],
    alternatives: [],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDelete.mockResolvedValue(undefined)
  mockUpdate.mockResolvedValue(undefined)
  useAppStore.setState(BASE_STATE)
})

// ── addAlert — pending state ───────────────────────────────────────────────────

describe('addAlert — pending state', () => {
  it('marks the alert as pending while insertAlert is in-flight', () => {
    mockInsert.mockReturnValue(new Promise(() => {})) // never resolves

    const tempId = useAppStore.getState().addAlert({ origin: 'NYC', destination: 'LON', dates: 'Oct', targetPrice: 400 })

    expect(useAppStore.getState().pendingIds[tempId]).toBe(true)
  })

  it('clears pending and updates idMap when server confirms', async () => {
    let resolve
    mockInsert.mockReturnValue(new Promise((res) => { resolve = res }))

    const tempId = useAppStore.getState().addAlert({ origin: 'NYC', destination: 'LON', dates: 'Oct', targetPrice: 400 })

    resolve(makeRemote())
    await flushMicrotasks()

    expect(useAppStore.getState().pendingIds[tempId]).toBeUndefined()
    expect(useAppStore.getState().idMap[tempId]).toBe(9999)
  })

  it('rolls back and clears pending when insertAlert rejects', async () => {
    mockInsert.mockRejectedValue(new Error('network error'))

    useAppStore.getState().addAlert({ origin: 'NYC', destination: 'LON', dates: 'Oct', targetPrice: 400 })
    expect(useAppStore.getState().alerts).toHaveLength(1)

    await flushMicrotasks()

    expect(useAppStore.getState().alerts).toHaveLength(0)
    expect(Object.keys(useAppStore.getState().pendingIds)).toHaveLength(0)
  })
})

// ── Race: removeAlert before API ack ─────────────────────────────────────────

describe('removeAlert before API ack', () => {
  it('removes the alert locally immediately', async () => {
    mockInsert.mockReturnValue(new Promise(() => {}))

    const tempId = useAppStore.getState().addAlert({ origin: 'NYC', destination: 'LON', dates: 'Oct', targetPrice: 400 })
    expect(useAppStore.getState().alerts).toHaveLength(1)

    useAppStore.getState().removeAlert(tempId)

    expect(useAppStore.getState().alerts).toHaveLength(0)
  })

  it('enqueues a delete op instead of calling the API immediately', () => {
    mockInsert.mockReturnValue(new Promise(() => {}))

    const tempId = useAppStore.getState().addAlert({ origin: 'NYC', destination: 'LON', dates: 'Oct', targetPrice: 400 })
    useAppStore.getState().removeAlert(tempId)

    expect(mockDelete).not.toHaveBeenCalled()
    expect(useAppStore.getState().opQueue).toEqual([{ tempId, type: 'delete' }])
  })

  it('calls deleteAlertApi with the server id once insert is confirmed', async () => {
    let resolve
    mockInsert.mockReturnValue(new Promise((res) => { resolve = res }))

    const tempId = useAppStore.getState().addAlert({ origin: 'NYC', destination: 'LON', dates: 'Oct', targetPrice: 400 })
    useAppStore.getState().removeAlert(tempId)

    resolve(makeRemote())
    await flushMicrotasks()

    expect(mockDelete).toHaveBeenCalledWith(9999)
    expect(useAppStore.getState().alerts).toHaveLength(0)
    expect(useAppStore.getState().opQueue).toHaveLength(0)
  })
})

// ── Race: removeAlert after API ack (ID already replaced) ────────────────────

describe('removeAlert after API ack (idMap lookup)', () => {
  it('removes the alert by resolving tempId → serverId via idMap', async () => {
    let resolve
    mockInsert.mockReturnValue(new Promise((res) => { resolve = res }))

    const tempId = useAppStore.getState().addAlert({ origin: 'NYC', destination: 'LON', dates: 'Oct', targetPrice: 400 })

    // API confirms before removeAlert is called
    resolve(makeRemote())
    await flushMicrotasks()

    // At this point the alert has id: 9999, idMap[tempId] = 9999
    expect(useAppStore.getState().alerts[0].id).toBe(9999)

    // User calls removeAlert with the old tempId
    useAppStore.getState().removeAlert(tempId)

    expect(useAppStore.getState().alerts).toHaveLength(0)
    expect(mockDelete).toHaveBeenCalledWith(9999)
  })
})

// ── updateAlert on temp ID while pending ──────────────────────────────────────

describe('updateAlert on temp ID while API is pending', () => {
  it('applies the change locally', () => {
    mockInsert.mockReturnValue(new Promise(() => {}))

    const tempId = useAppStore.getState().addAlert({ origin: 'NYC', destination: 'LON', dates: 'Oct', targetPrice: 400 })
    useAppStore.getState().updateAlert(tempId, { targetPrice: 350 })

    const alert = useAppStore.getState().alerts.find((a) => a.id === tempId)
    expect(alert.targetPrice).toBe(350)
  })

  it('enqueues the update instead of calling the API immediately', () => {
    mockInsert.mockReturnValue(new Promise(() => {}))

    const tempId = useAppStore.getState().addAlert({ origin: 'NYC', destination: 'LON', dates: 'Oct', targetPrice: 400 })
    useAppStore.getState().updateAlert(tempId, { targetPrice: 350 })

    expect(mockUpdate).not.toHaveBeenCalled()
    expect(useAppStore.getState().opQueue).toEqual([
      { tempId, type: 'update', changes: { targetPrice: 350 } },
    ])
  })

  it('calls updateAlertApi with server id once insert is confirmed', async () => {
    let resolve
    mockInsert.mockReturnValue(new Promise((res) => { resolve = res }))

    const tempId = useAppStore.getState().addAlert({ origin: 'NYC', destination: 'LON', dates: 'Oct', targetPrice: 400 })
    useAppStore.getState().updateAlert(tempId, { targetPrice: 350 })

    resolve(makeRemote())
    await flushMicrotasks()

    expect(mockUpdate).toHaveBeenCalledWith(9999, { targetPrice: 350 })
    expect(useAppStore.getState().opQueue).toHaveLength(0)
    // Local state reflects the queued change
    expect(useAppStore.getState().alerts[0].targetPrice).toBe(350)
  })
})

// ── toggleAlertStatus on temp ID while pending ────────────────────────────────

describe('toggleAlertStatus on temp ID while API is pending', () => {
  it('pauses the alert locally', () => {
    mockInsert.mockReturnValue(new Promise(() => {}))

    const tempId = useAppStore.getState().addAlert({ origin: 'NYC', destination: 'LON', dates: 'Oct', targetPrice: 400 })
    useAppStore.getState().toggleAlertStatus(tempId)

    expect(useAppStore.getState().alerts.find((a) => a.id === tempId).status).toBe('paused')
  })

  it('enqueues a toggle op and does not call the API immediately', () => {
    mockInsert.mockReturnValue(new Promise(() => {}))

    const tempId = useAppStore.getState().addAlert({ origin: 'NYC', destination: 'LON', dates: 'Oct', targetPrice: 400 })
    useAppStore.getState().toggleAlertStatus(tempId)

    expect(mockUpdate).not.toHaveBeenCalled()
    expect(useAppStore.getState().opQueue).toEqual([{ tempId, type: 'toggle' }])
  })

  it('calls updateAlertApi with server id once insert is confirmed', async () => {
    let resolve
    mockInsert.mockReturnValue(new Promise((res) => { resolve = res }))

    const tempId = useAppStore.getState().addAlert({ origin: 'NYC', destination: 'LON', dates: 'Oct', targetPrice: 400 })
    useAppStore.getState().toggleAlertStatus(tempId)

    resolve(makeRemote({ status: 'active' }))
    await flushMicrotasks()

    // The toggle flipped active → paused
    expect(mockUpdate).toHaveBeenCalledWith(9999, { status: 'paused' })
    expect(useAppStore.getState().opQueue).toHaveLength(0)
  })
})
