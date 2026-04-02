import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

const defaultUrl = import.meta.env.BASE_URL || '/'

self.skipWaiting()
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event) => {
  const payload = event.data?.json() ?? {
    title: 'Truthwatcher',
    body: 'A Brandon Sanderson project has moved forward.',
    url: defaultUrl,
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: {
        url: payload.url || defaultUrl,
      },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || defaultUrl

  event.waitUntil(clients.openWindow(targetUrl))
})
