import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

self.skipWaiting()
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event) => {
  const payload = event.data?.json() ?? {
    title: 'Truthwatcher',
    body: 'A Brandon Sanderson project has moved forward.',
    url: '/',
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: {
        url: payload.url || '/',
      },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(clients.openWindow(targetUrl))
})
