import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAppStore } from '../store/useAppStore'
import { useAuth } from '../hooks/useAuth'

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const mockGetSession = vi.hoisted(() => vi.fn())
const mockOnAuthStateChange = vi.hoisted(() => vi.fn())
const mockProfileSingle = vi.hoisted(() => vi.fn())
const mockFetchAlerts = vi.hoisted(() => vi.fn())
const mockMigrateLocalAlerts = vi.hoisted(() => vi.fn())

vi.mock('../lib/supabase', () => ({
  isSupabaseEnabled: true,
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: () => ({
      select: () => ({
        eq: () => ({ single: mockProfileSingle }),
      }),
    }),
    channel: () => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
}))

vi.mock('../lib/alertsApi', () => ({
  fetchAlerts: mockFetchAlerts,
  migrateLocalAlerts: mockMigrateLocalAlerts,
  rowToAlert: (row) => row,
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const FAKE_USER = {
  id: 'user-123',
  email: 'test@skytrack.com',
  user_metadata: { full_name: 'Test User', avatar_url: null },
  app_metadata: { provider: 'email' },
}
const FAKE_SESSION = { user: FAKE_USER }

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  })
  useAppStore.setState({ alerts: [], user: null })
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAuth — session handling', () => {
  it('loads remote alerts when session exists', async () => {
    const remoteAlerts = [{ id: 1, origin: 'NYC', destination: 'LON', targetPrice: 450 }]
    mockGetSession.mockResolvedValue({ data: { session: FAKE_SESSION } })
    mockProfileSingle.mockResolvedValue({ data: null })
    mockFetchAlerts.mockResolvedValue(remoteAlerts)

    renderHook(() => useAuth())

    await waitFor(() => {
      expect(useAppStore.getState().alerts).toEqual(remoteAlerts)
    })
  })

  it('migrates local alerts when remote is empty', async () => {
    const localAlerts = [{ id: 999, origin: 'SFO', destination: 'TYO', targetPrice: 800 }]
    const migratedAlerts = [{ id: 1, origin: 'SFO', destination: 'TYO', targetPrice: 800 }]
    mockGetSession.mockResolvedValue({ data: { session: FAKE_SESSION } })
    mockProfileSingle.mockResolvedValue({ data: null })
    mockFetchAlerts.mockResolvedValue([])
    mockMigrateLocalAlerts.mockResolvedValue(migratedAlerts)

    useAppStore.setState({ alerts: localAlerts, user: null })
    renderHook(() => useAuth())

    await waitFor(() => {
      expect(mockMigrateLocalAlerts).toHaveBeenCalledWith(localAlerts)
      expect(useAppStore.getState().alerts).toEqual(migratedAlerts)
    })
  })

  it('applies profile name, avatar and tier to the user', async () => {
    const profile = { name: 'John Doe', avatar_url: 'https://img.example/avatar.jpg', tier: 'premium' }
    mockGetSession.mockResolvedValue({ data: { session: FAKE_SESSION } })
    mockProfileSingle.mockResolvedValue({ data: profile })
    mockFetchAlerts.mockResolvedValue([])

    renderHook(() => useAuth())

    await waitFor(() => {
      const user = useAppStore.getState().user
      expect(user?.name).toBe('John Doe')
      expect(user?.avatar).toBe('https://img.example/avatar.jpg')
      expect(user?.tier).toBe('premium')
    })
  })

  it('clears user and skips alert fetch when session is null', async () => {
    useAppStore.setState({ user: { id: 'old', name: 'Old User' }, alerts: [] })
    mockGetSession.mockResolvedValue({ data: { session: null } })

    renderHook(() => useAuth())

    await waitFor(() => {
      expect(useAppStore.getState().user).toBeNull()
    })
    expect(mockFetchAlerts).not.toHaveBeenCalled()
  })
})
