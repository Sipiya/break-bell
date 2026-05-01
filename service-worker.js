const CACHE_NAME = 'break-bell-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network first, then cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const clonedResponse = response.clone();

        // Cache the new response
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, clonedResponse);
          });

        return response;
      })
      .catch(() => {
        // If fetch fails, try to get from cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // If not in cache, return offline page or generic response
            return new Response('Offline - cached version not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Handle background sync for notifications (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'break-reminder') {
    event.waitUntil(
      self.registration.showNotification('Time for a Break! 🔔', {
        body: 'It\'s time for your well-deserved break, Doctor Supriya!',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%235A4BAA" width="192" height="192"/><text x="96" y="96" font-size="120" font-weight="bold" fill="white" text-anchor="middle" dy=".3em">🔔</text></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%235A4BAA" width="96" height="96"/><text x="48" y="48" font-size="60" fill="white" text-anchor="middle" dy=".3em">🔔</text></svg>',
        tag: 'break-bell-notification',
        requireInteraction: false
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        for (let client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('./index.html?screen=timer');
        }
      })
  );
});
