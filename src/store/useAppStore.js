import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { activeAlerts, notifications, settings, generatePriceHistory } from '../data/mockData'
import { isSupabaseEnabled } from '../lib/supabase'
import {
  insertAlert as insertAlertApi,
  updateAlert as updateAlertApi,
  deleteAlert as deleteAlertApi,
} from '../lib/alertsApi'

const DESTINATION_IMAGES = {
  default: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80',
}

// Bump this number whenever the persisted state shape changes.
// The migrate() function handles upgrading older stored data.
const STORE_VERSION = 4

function migrate(persistedState, version) {
  let state = persistedState
  if (version === 0 || !state) {
    // v0 → v1: ensure all alerts have the full detail fields
    const alerts = (state?.alerts ?? activeAlerts).map((a) => ({
      currentPrice: a.currentBest ?? a.targetPrice + 50,
      trendLabel: 'Monitoring started',
      image: DESTINATION_IMAGES.default,
      destinationFull: a.destination,
      peakPrice: Math.round((a.targetPrice ?? 500) * 1.45),
      lowPrice: Math.round((a.targetPrice ?? 500) * 0.88),
      priceHistory: generatePriceHistory(a.targetPrice ?? 500),
      alternatives: [],
      ...a,
    }))
    state = { ...state, alerts }
  }
  if (version < 2) {
    // v1 → v2: add theme to settings
    state = {
      ...state,
      settings: { ...settings, ...state?.settings, theme: state?.settings?.theme ?? 'system' },
    }
  }
  if (version < 3) {
    // v2 → v3: add status to all alerts
    state = {
      ...state,
      alerts: (state?.alerts ?? []).map((a) => ({ status: 'active', ...a })),
    }
  }
  if (version < 4) {
    // v3 → v4: existing users skip onboarding (they already know the app)
    state = {
      ...state,
      settings: { ...state?.settings, onboardingDone: true },
    }
  }
  return state
}

export const useAppStore = create(
  persist(
    (set, get) => ({
      alerts: activeAlerts,
      notifications,
      settings,
      user: null, // populated by useAuth — not persisted

      recentlyUpdatedId: null,

      // ── ID reconciliation (transient — not persisted) ────────────────────────
      // pendingIds: alerts that have been inserted locally but not yet confirmed
      // by the server. { [tempId]: true }
      pendingIds: {},
      // opQueue: operations enqueued while the alert is still pending.
      // Each entry: { tempId, type: 'update' | 'delete' | 'toggle', changes? }
      opQueue: [],
      // idMap: maps tempId → serverId once the server confirms.
      // Allows operations using the old tempId to still resolve correctly.
      idMap: {},

      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),

      setRecentlyUpdated: (id) => {
        set({ recentlyUpdatedId: id })
        setTimeout(() => set({ recentlyUpdatedId: null }), 3000)
      },

      // Replace the full alerts array (used after Supabase sync)
      setAlerts: (alerts) => set({ alerts }),

      updateSetting: (key, value) =>
        set((state) => ({
          settings: { ...state.settings, [key]: value },
        })),

      toggleNotificationChannel: (channel) =>
        set((state) => ({
          settings: {
            ...state.settings,
            notifications: {
              ...state.settings.notifications,
              [channel]: !state.settings.notifications[channel],
            },
          },
        })),

      addAlert: (alert) => {
        const FREE_LIMIT = 5
        const { alerts, user } = get()
        if (isSupabaseEnabled && (user?.tier ?? 'free') === 'free' && alerts.length >= FREE_LIMIT) {
          return null // caller should show upgrade prompt
        }
        const id = Date.now()
        const priceHistory = generatePriceHistory(alert.targetPrice)
        const currentPrice = alert.targetPrice + 50
        const newAlert = {
          ...alert,
          id,
          currentBest: currentPrice,
          currentPrice,
          status: 'active',
          trend: 'flat',
          change: 0,
          trendLabel: 'Monitoring started — waiting for price moves',
          image: DESTINATION_IMAGES.default,
          destinationFull: alert.destination,
          peakPrice: Math.round(alert.targetPrice * 1.45),
          lowPrice: Math.round(alert.targetPrice * 0.88),
          priceHistory,
          alternatives: [],
        }
        // Optimistic local insert — mark as pending until server confirms
        set((state) => ({
          alerts: [...state.alerts, newAlert],
          pendingIds: { ...state.pendingIds, [id]: true },
        }))

        if (isSupabaseEnabled) {
          insertAlertApi(newAlert)
            .then((remote) => {
              if (!remote) return
              set((state) => {
                // Collect and remove queued ops for this tempId
                const opsForId = state.opQueue.filter((op) => op.tempId === id)
                const opQueue = state.opQueue.filter((op) => op.tempId !== id)
                const pendingIds = { ...state.pendingIds }
                delete pendingIds[id]

                // Apply queued mutations onto the remote alert
                let finalAlert = remote
                for (const op of opsForId) {
                  if (op.type === 'update') finalAlert = { ...finalAlert, ...op.changes }
                  if (op.type === 'toggle') {
                    finalAlert = {
                      ...finalAlert,
                      status: finalAlert.status === 'active' ? 'paused' : 'active',
                    }
                  }
                }

                // Fire deferred API calls for queued ops
                for (const op of opsForId) {
                  if (op.type === 'delete') {
                    deleteAlertApi(remote.id).catch(console.error)
                  } else if (op.type === 'update') {
                    updateAlertApi(remote.id, op.changes).catch(console.error)
                  } else if (op.type === 'toggle') {
                    updateAlertApi(remote.id, { status: finalAlert.status }).catch(console.error)
                  }
                }

                const hasDelete = opsForId.some((op) => op.type === 'delete')
                return {
                  alerts: hasDelete
                    ? state.alerts.filter((a) => a.id !== id)
                    : state.alerts.map((a) => (a.id === id ? finalAlert : a)),
                  pendingIds,
                  opQueue,
                  idMap: { ...state.idMap, [id]: remote.id },
                }
              })
            })
            .catch(() => {
              // Rollback on failure — discard any queued ops too
              set((state) => {
                const pendingIds = { ...state.pendingIds }
                delete pendingIds[id]
                return {
                  alerts: state.alerts.filter((a) => a.id !== id),
                  pendingIds,
                  opQueue: state.opQueue.filter((op) => op.tempId !== id),
                }
              })
            })
        }
        return id
      },

      removeAlert: (id) => {
        const { pendingIds, idMap } = get()
        // Resolve to the current server ID if the temp ID was already replaced
        const resolvedId = idMap[id] ?? id

        // Remove locally regardless of pending status
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== id && a.id !== resolvedId),
        }))

        if (pendingIds[id]) {
          // Alert is still being inserted — enqueue the delete for after confirmation
          set((state) => ({
            opQueue: [...state.opQueue, { tempId: id, type: 'delete' }],
          }))
        } else {
          // Already confirmed — delete from server now
          if (isSupabaseEnabled) deleteAlertApi(resolvedId).catch(console.error)
        }
      },

      setOnboardingDone: () =>
        set((state) => ({
          settings: { ...state.settings, onboardingDone: true },
        })),

      toggleAlertStatus: (id) => {
        const { pendingIds, idMap } = get()
        const resolvedId = idMap[id] ?? id

        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id || a.id === resolvedId
              ? { ...a, status: a.status === 'active' ? 'paused' : 'active' }
              : a
          ),
        }))

        if (pendingIds[id]) {
          set((state) => ({
            opQueue: [...state.opQueue, { tempId: id, type: 'toggle' }],
          }))
        } else if (isSupabaseEnabled) {
          const updated = get().alerts.find((a) => a.id === id || a.id === resolvedId)
          if (updated) updateAlertApi(resolvedId, { status: updated.status }).catch(console.error)
        }
      },

      updateAlert: (id, changes) => {
        const { pendingIds, idMap } = get()
        const resolvedId = idMap[id] ?? id

        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id || a.id === resolvedId ? { ...a, ...changes } : a
          ),
        }))

        if (pendingIds[id]) {
          set((state) => ({
            opQueue: [...state.opQueue, { tempId: id, type: 'update', changes }],
          }))
        } else {
          if (isSupabaseEnabled) updateAlertApi(resolvedId, changes).catch(console.error)
        }
      },

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      dismissNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: 'skytrack-store',
      storage: createJSONStorage(() => {
        // Graceful fallback if localStorage is unavailable (private browsing, storage full)
        try {
          localStorage.setItem('__test__', '1')
          localStorage.removeItem('__test__')
          return localStorage
        } catch {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          }
        }
      }),
      // Only persist alerts + settings — notifications, user and ID-reconciliation
      // state are all ephemeral.
      partialize: (state) => ({
        alerts: state.alerts,
        settings: state.settings,
      }),
      version: STORE_VERSION,
      migrate,
    }
  )
)
