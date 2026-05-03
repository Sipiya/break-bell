const CACHE_NAME = 'clinical-bell-v6';
const assets = ['./', './index.html', './manifest.json'];

// On install: cache assets AND immediately take control (don't wait for old SW to die)
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(assets))
  );
  self.skipWaiting(); // activate new SW immediately without waiting
});

// On activate: delete ALL old caches so stale files are gone
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim(); // take control of all open tabs right away
});

// Network-first strategy: always try network, fall back to cache
// This means new deploys show up immediately once the SW updates
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Got a valid response — update the cache with the fresh copy
        if (res && res.status === 200 && res.type === 'basic') {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, resClone));
        }
        return res;
      })
      .catch(() => caches.match(e.request)) // offline fallback
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});
