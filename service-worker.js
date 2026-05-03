const CACHE_NAME = 'clinical-bell-v6';
const assets = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(assets)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});

self.addEventListener('push', e => {
  if(!e.data) return;
  const data = e.data.json();
  const opts = {
    body: data.body || 'Hey Dr. Supriya! Time for a break!',
    icon: data.icon || './icon.png',
    badge: data.badge || './icon.png',
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    tag: 'dr-supriya-bell',
    actions: [
      { action: 'take-break', title: 'Take break now' },
      { action: 'snooze', title: 'Snooze 5 min' }
    ]
  };
  e.waitUntil(self.registration.showNotification(data.title || 'Dr. Supriya Break Bell', opts));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if(e.action === 'snooze') {
    setTimeout(() => {
      self.registration.showNotification('Snooze over! 🌸', {
        body: 'Time for your break now, Dr. Supriya!',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        tag: 'dr-supriya-bell'
      });
    }, 5 * 60 * 1000);
    return;
  }
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for(const client of list) {
        if(client.url.includes('index.html') || client.url.endsWith('/')) {
          return client.focus();
        }
      }
      return clients.openWindow('./');
    })
  );
});
