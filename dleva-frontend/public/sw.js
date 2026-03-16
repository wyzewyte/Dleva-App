/**
 * Service Worker
 * Handles offline caching, background sync, and PWA functionality
 */

const CACHE_NAME = 'dleva-rider-v1';
const ASSETS_CACHE = 'dleva-rider-assets-v1';
const API_CACHE = 'dleva-rider-api-v1';

// Assets to cache on install
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
];

/**
 * Install event - cache assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(ASSETS_CACHE).then((cache) => {
      console.log('[SW] Caching assets');
      return cache.addAll(ASSETS_TO_CACHE).catch((error) => {
        console.warn('[SW] Some assets failed to cache:', error);
      });
    })
  );

  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          const isOldCache = cacheName !== ASSETS_CACHE && 
                           cacheName !== API_CACHE && 
                           cacheName !== CACHE_NAME;
          
          if (isOldCache) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  self.clients.claim();
});

/**
 * Fetch event - network first, fallback to cache
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - network first, then cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
  }
  // Static assets - cache first, then network
  else if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, ASSETS_CACHE));
  }
  // HTML pages - network first
  else if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstStrategy(request, CACHE_NAME));
  }
});

/**
 * Network first strategy
 * Try network first, fallback to cache
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network request failed, trying cache:', request.url);
    
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Return offline page or error response
    return new Response('Offline - resource not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Cache first strategy
 * Try cache first, fallback to network
 */
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Cache and network unavailable:', request.url);
    return new Response('Offline - resource not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Check if path is a static asset
 */
function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.svg', '.woff', '.woff2'];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

/**
 * Handle messages from clients
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  console.log('[SW] Message received:', type);

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then((names) => {
          return Promise.all(names.map((name) => caches.delete(name)));
        })
      );
      break;

    case 'GET_CACHE_SIZE':
      event.waitUntil(
        (async () => {
          if (navigator.storage?.estimate) {
            const estimate = await navigator.storage.estimate();
            event.ports[0].postMessage({
              type: 'CACHE_SIZE',
              usage: estimate.usage,
              quota: estimate.quota,
            });
          }
        })()
      );
      break;

    case 'CACHE_URLS':
      event.waitUntil(
        (async () => {
          const cache = await caches.open(CACHE_NAME);
          const urls = payload.urls || [];
          
          for (const url of urls) {
            try {
              const response = await fetch(url);
              if (response.ok) {
                cache.put(url, response.clone());
              }
            } catch (error) {
              console.warn('[SW] Failed to cache URL:', url, error);
            }
          }
          
          event.ports[0]?.postMessage({ type: 'CACHE_COMPLETE' });
        })()
      );
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

/**
 * Handle periodic background sync (if supported)
 */
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'sync-offline-data') {
      event.waitUntil(syncOfflineData());
    }
  });
}

/**
 * Sync offline data (placeholder)
 */
async function syncOfflineData() {
  console.log('[SW] Background sync triggered');
  // This would be called to sync offline queue
  // Implementation depends on the app's sync requirements
}

console.log('[SW] Service Worker loaded');
