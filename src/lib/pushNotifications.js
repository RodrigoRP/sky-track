import { supabase } from './supabase'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function isPushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function getPushPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

/**
 * Request push permission, subscribe via VAPID, and persist subscription to Supabase.
 * Returns the PushSubscription object, or null on failure/denial.
 */
export async function subscribeToPush() {
  if (!isPushSupported()) return null

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!vapidKey) {
    console.warn('[push] VITE_VAPID_PUBLIC_KEY not set — push disabled')
    return null
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  const reg = await navigator.serviceWorker.ready
  let subscription = await reg.pushManager.getSubscription()

  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })
  }

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('push_subscriptions')
        .upsert({ user_id: user.id, subscription: subscription.toJSON() }, { onConflict: 'user_id' })
    }
  }

  return subscription
}

/**
 * Unsubscribe from push and remove the subscription from Supabase.
 */
export async function unsubscribeFromPush() {
  if (!isPushSupported()) return

  const reg = await navigator.serviceWorker.ready
  const subscription = await reg.pushManager.getSubscription()
  if (!subscription) return

  await subscription.unsubscribe()

  if (supabase) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .filter('subscription->>endpoint', 'eq', subscription.endpoint)
  }
}
