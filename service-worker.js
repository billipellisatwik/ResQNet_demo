const CACHE_NAME = 'resqnet-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/frontend/index.html',
  '/frontend/citizen.html',
  '/frontend/tracking.html',
  '/frontend/command-center.html',
  '/frontend/rescue-team.html',
  '/frontend/weather.html',
  '/frontend/analytics.html',
  '/frontend/shelters.html',
  '/frontend/resources.html',
  '/frontend/login.html',
  '/css/base.css',
  '/css/landing.css',
  '/css/citizen.css',
  '/css/dashboard.css',
  '/css/map.css',
  '/css/weather.css',
  '/css/responsive.css',
  '/css/accessibility.css',
  '/js/main.js',
  '/js/theme.js',
  '/js/translation.js',
  '/js/websocket.js',
  '/js/notifications.js',
  '/js/citizen.js',
  '/js/tracking.js',
  '/js/dashboard.js',
  '/js/map.js',
  '/js/weather.js',
  '/js/rescue.js',
  '/js/shelters.js',
  '/js/resources.js',
  '/js/analytics.js',
  '/js/offline.js',
  '/js/simulation.js',
  '/translations/en.json',
  '/translations/te.json',
  '/translations/hi.json',
  '/manifest.json',
  '/assets/logo.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Pre-caching warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/') || event.request.url.includes('/ws')) {
    // Network-first for API and WebSocket
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  } else {
    // Cache-first for static assets
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        });
      })
    );
  }
});
