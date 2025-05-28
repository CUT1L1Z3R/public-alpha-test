// Service Worker for FreeFlix
const CACHE_VERSION = '1.0.5'; // Increment this when making changes
const CACHE_NAME = 'freeflix-cache-v' + CACHE_VERSION;
const urlsToCache = [
  './',
  './index.html',
  './index.css',
  './index.js',
  './manifest.json',
  './assets/freeflix.ico',
  './assets/freeflix.png',
  './assets/netflix.png',
  './assets/play.png',
  './assets/info.png',
  './assets/playg.png',
  './assets/Imdb-Logo.png',
  './custom-buttons.css',
  './custom-navigation.js',
  './navigation-fix.js',
  './sitemap.xml',
  './robots.txt',
  './404.html',
  './free-movie-streaming.html'
];

// Install event - cache assets with version control
self.addEventListener('install', event => {
  // Use skipWaiting but we'll control the reload behavior ourselves
  self.skipWaiting();

  // Clear old caches and create new one
  event.waitUntil(
    // First clear old caches for proper version updates
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Only delete our app's caches, but different versions
          if (cacheName.startsWith('freeflix-cache-') && cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        }).filter(Boolean) // Remove undefined values
      );
    }).then(() => {
      // Then open and populate the new cache
      console.log('Opening new cache:', CACHE_NAME);
      return caches.open(CACHE_NAME).then(cache => {
        console.log('Caching app resources');
        return cache.addAll(urlsToCache);
      });
    }).catch(error => {
      console.error('Failed to cache resources:', error);
    })
  );
});

// Fetch event - enhanced to better handle caching and updates
self.addEventListener('fetch', event => {
  // Handle page navigation requests with network-first strategy
  if (event.request.mode === 'navigate') {
    event.respondWith(
      // Try to fetch from network first (ensures fresh content)
      fetch(event.request)
        .then(response => {
          return response;
        })
        .catch(() => {
          // If network fails, use cache as fallback
          return caches.match('./index.html');
        })
    );
    return;
  }

  // Special handling for different resource types
  const url = new URL(event.request.url);
  const isApiCall = event.request.url.includes('api.themoviedb.org');
  const isVersioned = event.request.url.includes('?v=') || event.request.url.includes('&v=');
  const isAsset = (/\.(jpe?g|png|gif|svg|ico|css|js)$/i).test(url.pathname);
  const isHtml = url.pathname.endsWith('.html') || url.pathname.endsWith('/');

  // Different caching strategies based on resource type
  if (isApiCall || isHtml) {
    // Network-first for API calls and HTML files to ensure fresh content
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the fresh response
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(error => {
          console.error('Fetch failed:', error);
          return caches.match(event.request);
        })
    );
  } else if (isVersioned || isAsset) {
    // Cache-first for versioned resources and assets with
    // stale-while-revalidate pattern for auto-updating
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Start fetching fresh copy in background
          const fetchPromise = fetch(event.request)
            .then(networkResponse => {
              // Update cache with fresh copy
              if (networkResponse && networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseToCache);
                });
              }
              return networkResponse;
            });

          // Return cached response immediately if available
          return response || fetchPromise;
        })
    );
  } else {
    // Network-first for everything else
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(error => {
          console.error('Fetch failed:', error);
          // Try cache as fallback
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }

            // Return an error response if no cached version
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
  }
});

// Activate event with controlled update behavior
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        }).filter(Boolean) // Remove undefined values
      );
    }).then(() => {
      // Take control of uncontrolled clients
      return self.clients.claim();
    }).then(() => {
      // Removed update notification to prevent popup from appearing
      console.log('Update available (notifications disabled)');
    })
  );
});
