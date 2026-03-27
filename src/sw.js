import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

// Remove caches from previous Workbox versions
cleanupOutdatedCaches()

// Precache all assets listed by vite-plugin-pwa at build time
precacheAndRoute(self.__WB_MANIFEST)

// ── Runtime Caching ───────────────────────────────────────────────────────────

registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
)

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
)

registerRoute(
  ({ url }) => url.origin === 'https://images.unsplash.com',
  new StaleWhileRevalidate({
    cacheName: 'unsplash-images-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
)

// ── Push Notifications ────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const {
    title = 'SkyTrack',
    body = 'You have a new price alert.',
    url = '/notifications',
    tag = 'skytrack-alert',
  } = data

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      tag,
      renotify: true,
      data: { url },
      vibrate: [100, 50, 100],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url ?? '/notifications'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        const existing = windowClients.find((c) => c.url.endsWith(targetUrl))
        if (existing) return existing.focus()
        return clients.openWindow(targetUrl)
      })
  )
})
