const CACHE_NAME = 'screensnap-v3';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/analytics',
  '/settings',
  '/guide',
];

// Pre-cache all webtv backgrounds
const BG_ASSETS = Array.from({ length: 10 }, (_, i) => `/webtv-bg/bg${i + 1}.png`);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll([...STATIC_ASSETS, ...BG_ASSETS]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first strategy for pages, cache-first for static assets
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // Cache-first for static assets (images, fonts, webtv backgrounds, mediapipe)
  if (
    url.pathname.includes('/webtv-bg/') ||
    url.pathname.includes('/mediapipe/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|woff2?|ico)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => new Response('', { status: 404 }));
      })
    );
    return;
  }

  // Network-first for pages and API
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful page responses
        if (response.ok && (url.pathname === '/' || url.pathname.startsWith('/_next/'))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('/')))
  );
});

// Handle background sync for video uploads
self.addEventListener('sync', (event) => {
  if (event.tag === 'upload-video') {
    event.waitUntil(
      // Placeholder for background upload logic
      Promise.resolve()
    );
  }
});

// Push notifications (future)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || { title: 'ScreenSnap', body: 'New notification' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
  );
});
