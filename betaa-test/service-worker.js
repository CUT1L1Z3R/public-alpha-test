// Service Worker for FreeFlixx
const CACHE_VERSION = '1.0.2'; // Increment this when making changes
const CACHE_NAME = 'freeflixx-cache-v' + CACHE_VERSION;
const urlsToCache = [
  './',
  './index.html',
  './index.css',
  './index.js',
  './manifest.json',
  './assets/freeflixx.ico',
  './assets/freeflixx.png',
  './assests/netflix.png',
  './assests/play.png',
  './assests/info.png',
  './custom-buttons.css',
  './custom-navigation.js',
  './navigation-fix.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  // Skip waiting to update service worker immediately
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache resources:', error);
      })
  );
});

// Fetch event - serve from cache if available
self.addEventListener('fetch', event => {
  // Handle page navigation requests differently
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('./index.html');
        })
    );
    return;
  }

  // Don't cache API calls or skip cache for development
  const isApiCall = event.request.url.includes('api.themoviedb.org');
  const shouldSkipCache = event.request.url.includes('?v=') || isApiCall;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // For API calls or versioned resources, always go to network first
        if (shouldSkipCache) {
          return fetch(event.request)
            .then(networkResponse => {
              // Only cache if it's not an API call
              if (!isApiCall && networkResponse && networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseToCache);
                });
              }
              return networkResponse;
            })
            .catch(error => {
              console.error('API fetch failed:', error);
              // If we have a cached response, return it as fallback
              if (response) return response;

              // Otherwise return an error
              return new Response('Network error happened', {
                status: 408,
                headers: { 'Content-Type': 'text/plain' },
              });
            });
        }

        // Return the cached response if found for non-API calls
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Add to cache
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            // Return a custom offline page if it's a page request
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            return new Response('Network error happened', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' },
            });
          });
      })
  );
});

// Activate event - delete old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];

  // Take control of all clients immediately
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all([
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        }),
        self.clients.claim() // Take control of all clients
      ]);
    })
  );
});
