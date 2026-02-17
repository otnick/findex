// Service Worker for FinDex PWA
const CACHE_NAME = 'findex-static-v3'
const urlsToCache = [
  '/manifest.json',
  '/icon-192x192.png',
]

// Install service worker
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache')
      return cache.addAll(urlsToCache)
    })
  )
})

// Fetch from cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  const url = new URL(event.request.url)

  if (url.origin !== self.location.origin) {
    return
  }

  if (event.request.mode === 'navigate') {
    // Network-only for HTML to avoid stale app shells causing reload loops.
    event.respondWith(fetch(event.request))
    return
  }

  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200) return response
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
          return response
        })
      })
    )
    return
  }

  if (url.pathname === '/manifest.json' || url.pathname.startsWith('/icon-')) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        const contentType = response.headers.get('content-type') || ''
        if (!contentType.startsWith('image/') && !contentType.includes('font') && !contentType.includes('text/css') && !contentType.includes('application/javascript')) {
          return response
        }

        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
    })
  )
})

// Update service worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]

  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName)
            }
          })
        )
      }),
      self.clients.claim(),
    ])
  )
})

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  
  const options = {
    body: data.body || 'Neue Aktivität in FinDex',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: data.data,
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'FinDex', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})
