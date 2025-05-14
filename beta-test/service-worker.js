// Service Worker for FreeFlixx
const CACHE_VERSION = '1.0.3'; // Increment this when making changes
const CACHE_NAME = 'freeflixx-cache-v' + CACHE_VERSION;
const APP_SHELL_CACHE = 'freeflixx-appshell-v' + CACHE_VERSION;
const DATA_CACHE_NAME = 'freeflixx-data-v' + CACHE_VERSION;
const OFFLINE_URL = '/404.html';

// App Shell - Critical resources that should be cached for offline use
const APP_SHELL_FILES = [
  './',
  './index.html',
  './404.html',
  './index.css',
  './custom-buttons.css',
  './movies/index.html',
  './tvshows/index.html',
  './anime/index.html',
  './watchList/watchlist.html'
];

// Assets - Visual resources that enhance the app but aren't critical
const ASSET_FILES = [
  './assets/freeflixx.ico',
  './assets/freeflixx.png',
  './assests/netflix.png',
  './assests/play.png',
  './assests/info.png'
];

// JavaScript - Core functionality
const JS_FILES = [
  './index.js',
  './custom-navigation.js',
  './navigation-fix.js',
  './service-worker.js'
];

// Combine all files to cache
const urlsToCache = [
  ...APP_SHELL_FILES,
  ...ASSET_FILES,
  ...JS_FILES,
  './manifest.json',
  './site.webmanifest',
  './sitemap.html'
];

// Install event - cache assets
self.addEventListener('install', event => {
  // Skip waiting to update service worker immediately
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache: ' + CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache resources:', error);
      })
  );
});

// Fetch event - serve from cache if available
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Handle page navigation requests differently
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('./index.html') || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Handle API calls to themoviedb.org
  if (requestUrl.href.includes('api.themoviedb.org')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200) {
            return response;
          }

          // Clone the response to store in cache
          const responseToCache = response.clone();

          // Store in data cache for future use
          caches.open(DATA_CACHE_NAME)
            .then(cache => {
              // Set a custom header to identify the origin of this cached response
              const headers = new Headers(responseToCache.headers);
              headers.append('X-Cache-Date', new Date().toISOString());

              // Create a new response with the custom header
              const enhancedResponse = new Response(
                responseToCache.body,
                {
                  status: responseToCache.status,
                  statusText: responseToCache.statusText,
                  headers: headers
                }
              );

              // Cache for 60 minutes
              const cacheControl = {
                'Cache-Control': 'max-age=3600'
              };

              // Store in cache with metadata
              cache.put(event.request, enhancedResponse);
            });

          return response;
        })
        .catch(error => {
          console.error('API fetch failed:', error);
          return caches.match(event.request);
        })
    );
    return;
  }

  // For versioned resources or resources with query parameters,
  // always go to network first, then cache
  if (requestUrl.search || requestUrl.href.includes('?v=')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200) {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the versioned resource
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // For all other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return the cached response if found
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then(networkResponse => {
            // Don't cache if not a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response
            const responseToCache = networkResponse.clone();

            // Add to cache
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch(error => {
            console.error('Fetch failed:', error);

            // Return a custom offline page if it's a page request
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }

            // For assets that aren't critical, return an empty response
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
  const cacheWhitelist = [CACHE_NAME, DATA_CACHE_NAME, APP_SHELL_CACHE];

  // Take control of all clients immediately
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all open clients
      self.clients.claim()
    ])
  );
});

// Handle push notifications (for future enhancement)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();

    self.registration.showNotification('FreeFlixx Update', {
      body: data.message || 'New content is available!',
      icon: './assets/freeflixx.png',
      badge: './assets/freeflixx.png',
      data: {
        url: data.url || '/'
      }
    });
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
