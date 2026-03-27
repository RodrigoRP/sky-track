import { useEffect, useRef, useState } from 'react'
import { supabase, isSupabaseEnabled } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import { fetchAlerts, migrateLocalAlerts, rowToAlert } from '../lib/alertsApi'
import { useToastStore } from './useToast'

function mapUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.user_metadata?.full_name ?? u.email?.split('@')[0] ?? 'User',
    avatar: u.user_metadata?.avatar_url ?? null,
    tier: 'free',
    provider: u.app_metadata?.provider ?? 'email',
  }
}

export function useAuth() {
  const [loading, setLoading] = useState(isSupabaseEnabled)
  const setUser = useAppStore((s) => s.setUser)
  const clearUser = useAppStore((s) => s.clearUser)
  const setAlerts = useAppStore((s) => s.setAlerts)
  const localAlerts = useAppStore((s) => s.alerts)
  const user = useAppStore((s) => s.user)
  const realtimeRef = useRef(null)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    function startRealtime(userId) {
      if (realtimeRef.current) supabase.removeChannel(realtimeRef.current)

      const channel = supabase
        .channel(`alerts-${userId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'alerts', filter: `user_id=eq.${userId}` },
          (payload) => {
            // Skip updates when tab is hidden
            if (document.visibilityState !== 'visible') return

            const { updateAlert, setRecentlyUpdated } = useAppStore.getState()
            const updated = rowToAlert(payload.new)
            updateAlert(updated.id, updated)
            setRecentlyUpdated(updated.id)

            // In-app toast on price drop
            const oldPrice = payload.old?.current_price
            const newPrice = payload.new?.current_price
            if (oldPrice && newPrice && newPrice < oldPrice) {
              useToastStore.getState().show(
                `${payload.new.origin} → ${payload.new.destination} dropped to $${newPrice}!`,
                'success',
                5000,
                `/alert/${updated.id}`
              )
            }
          }
        )
        .subscribe()

      realtimeRef.current = channel
    }

    function stopRealtime() {
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current)
        realtimeRef.current = null
      }
    }

    async function handleSession(session) {
      if (!session?.user) {
        clearUser()
        stopRealtime()
        return
      }

      const mappedUser = mapUser(session.user)
      setUser(mappedUser)

      // Fetch profile for saved name/avatar (overrides OAuth metadata)
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url, tier')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setUser({
          ...mappedUser,
          name: profile.name ?? mappedUser.name,
          avatar: profile.avatar_url ?? mappedUser.avatar,
          tier: profile.tier ?? 'free',
        })
      }

      // Load alerts from Supabase
      const remoteAlerts = await fetchAlerts().catch(() => null)
      if (remoteAlerts !== null) {
        if (remoteAlerts.length === 0 && localAlerts.length > 0) {
          const migrated = await migrateLocalAlerts(localAlerts).catch(() => [])
          if (migrated.length > 0) setAlerts(migrated)
        } else {
          setAlerts(remoteAlerts)
        }
      }

      startRealtime(session.user.id)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session).finally(() => setLoading(false))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session)
    })

    return () => {
      subscription.unsubscribe()
      stopRealtime()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { user, loading }
}
