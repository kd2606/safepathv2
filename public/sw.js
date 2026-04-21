/* ============================================
   SAFEPATH — Service Worker
   ============================================
   Cache-first strategy for app shell,
   network-first for API calls.
   Enables offline capability for the PWA.
   ============================================ */

const CACHE_NAME = 'safepath-v1';
const SHELL_CACHE = 'safepath-shell-v1';

/* Files to pre-cache for offline app shell */
const SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json'
];


/* ── Install: Pre-cache app shell ── */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching app shell');
        return cache.addAll(SHELL_FILES);
      })
      .then(() => self.skipWaiting())
  );
});


/* ── Activate: Clean up old caches ── */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  const allowedCaches = [CACHE_NAME, SHELL_CACHE];

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => !allowedCaches.includes(name))
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});


/* ── Fetch: Cache-first for shell, network-first for API ── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external API calls (Firebase, Google Maps, Gemini)
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('google.com')
  ) {
    return;
  }

  // Cache-first for app shell files
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Not in cache — fetch from network and cache it
        return fetch(request)
          .then((networkResponse) => {
            // Don't cache non-successful responses
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Clone and cache the response
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone);
              });

            return networkResponse;
          })
          .catch(() => {
            // Offline fallback for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});
