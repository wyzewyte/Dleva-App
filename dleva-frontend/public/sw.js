/* global clients */
/**
 * Service Worker - v2
 * Handles offline caching, background sync, and PWA functionality
 * IMPORTANT: Increment version number when making changes
 */

const CACHE_NAME = 'dleva-rider-v2';
const ASSETS_CACHE = 'dleva-rider-assets-v2';
const API_CACHE = 'dleva-rider-api-v2';

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
 * Firebase Cloud Messaging - Handle push notifications
 * This event fires when a push message is received and the app is in the background
 */
self.addEventListener('push', (event) => {
  console.log('[SW] 🔔 PUSH EVENT RECEIVED:', event);

  if (!event.data) {
    console.warn('[SW] ⚠️ Push event received but no data payload');
    return;
  }

  // App logo from assets
  const appLogo = '/src/assets/images/favicon.svg';
  
  let options = {
    icon: appLogo,                    // ✅ D-Leva app logo
    badge: appLogo,
    requireInteraction: true,         // ✅ Keep visible until user acts
    vibrate: [200, 100, 200],        // ✅ Vibration pattern
    silent: false,                    // ✅ Allow sound
  };

  try {
    // Parse Firebase Cloud Messaging payload
    const data = event.data.json();
    console.log('[SW] 📤 Push data:', data);

    const notification = data.notification || {};
    const customData = data.data || {};

    // Use role + order + notification type so buyer delivery updates do not overwrite one another.
    const userRole = customData.user_role || 'rider';
    const notificationType = customData.notification_type || 'general';
    const orderId = customData.order_id || 'global';
    options.tag = `dleva-notification-${userRole}-${orderId}-${notificationType}`;

    options.title = notification.title || 'D-Leva Notification';
    options.body = notification.body || 'You have a new notification';
    
    console.log('[SW] 📢 Notification title:', options.title);
    console.log('[SW] 📢 Notification body:', options.body);
    
    // Add custom data for click handling
    options.data = {
      ...customData,
      notificationType,
      orderId: customData.order_id,
      url: customData.url || '/',
      // ✅ Add user context for routing
      userRole: customData.user_role || 'rider',
    };

    // ✅ Enable system sound - this is the key for audio!
    options.sound = '/notification-sound.mp3';  // ✅ Add default notification sound
    
    // Badge for iOS/Android
    if (data.notification?.badge) {
      options.badge = data.notification.badge;
    }

    // ✅ Add actions for better interaction
    options.actions = [
      {
        action: 'open',
        title: 'Open',
      },
      {
        action: 'close',
        title: 'Dismiss',
      },
    ];

    console.log('[SW] 🎯 Showing notification with options:', options);

    // Show the notification
    event.waitUntil(
      self.registration.showNotification(options.title, options)
        .then(() => console.log('[SW] ✅ Notification displayed successfully'))
        .catch(err => console.error('[SW] ❌ Failed to show notification:', err))
    );
  } catch (error) {
    console.error('[SW] ❌ Error parsing push event:', error);
    // Fallback notification with proper settings
    event.waitUntil(
      self.registration.showNotification('D-Leva Notification', {
        body: 'You have a new notification',
        icon: appLogo,
        badge: appLogo,
        tag: 'dleva-notification',
        requireInteraction: true,
        sound: '/notification-sound.mp3',
        vibrate: [200, 100, 200],
        silent: false,
        data: { 
          notificationType: 'general', 
          url: '/',
          userRole: 'rider',
        },
      })
        .then(() => console.log('[SW] ✅ Fallback notification displayed'))
        .catch(err => console.error('[SW] ❌ Failed to show fallback:', err))
    );
  }
});

/**
 * Handle notification clicks - Route based on user role
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 👆 NOTIFICATION CLICKED:', event.notification.tag);
  console.log('[SW] 📋 Notification data:', event.notification.data);
  console.log('[SW] 🎯 Action:', event.action);

  const notification = event.notification;
  const data = notification.data || {};
  const action = event.action;
  const userRole = data.userRole || 'rider';
  const notificationType = data.notificationType || 'general';
  const orderId = data.orderId;

  // Close the notification
  notification.close();

  // Handle dismiss action
  if (action === 'close') {
    console.log('[SW] ❌ Notification dismissed by user');
    return;
  }

  // Determine the URL based on user role and notification type
  let targetUrl = '/';

  switch (userRole) {
    case 'rider':
      targetUrl = getRiderUrl(notificationType, orderId);
      break;
    case 'seller':
      targetUrl = getSellerUrl(notificationType, orderId);
      break;
    case 'buyer':
      targetUrl = getBuyerUrl(notificationType, orderId);
      break;
    default:
      targetUrl = data.url || '/';
  }

  console.log('[SW] ✅ Target URL:', targetUrl);

  // Focus or open the client window
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      console.log('[SW] 🪟 Found windows:', clientList.length);
      // Check if there's already a window we can focus
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          console.log('[SW] ✅ Focusing existing client');
          return client.focus();
        }
      }
      // If no matching window, open a new one
      if (clients.openWindow) {
        console.log('[SW] 🆕 Opening new window');
        return clients.openWindow(targetUrl);
      }
    })
  );
});

/**
 * Get rider-specific notification URL
 */
function getRiderUrl(notificationType, orderId) {
  switch (notificationType) {
    case 'assignment':
      return orderId ? `/rider/orders/${orderId}` : '/rider/dashboard';
    case 'payout':
      return '/rider/earnings';
    case 'warning':
      return '/rider/account';
    case 'suspension':
      return '/rider/account';
    case 'dispute':
      return '/rider/support';
    case 'status_update':
      return orderId ? `/rider/orders/${orderId}` : '/rider/dashboard';
    default:
      return '/rider/dashboard';
  }
}

/**
 * Get seller-specific notification URL
 */
function getSellerUrl(notificationType, orderId) {
  switch (notificationType) {
    case 'order_received':
      return orderId ? `/seller/orders/${orderId}` : '/seller/dashboard';
    case 'assignment':
      return orderId ? `/seller/orders/${orderId}` : '/seller/orders';
    case 'payout':
      return '/seller/earnings';
    case 'review':
      return '/seller/reviews';
    case 'order_cancelled':
      return '/seller/orders';
    case 'dispute':
      return '/seller/support';
    case 'status_update':
      return orderId ? `/seller/orders/${orderId}` : '/seller/dashboard';
    default:
      return '/seller/dashboard';
  }
}

/**
 * Get buyer-specific notification URL
 */
function getBuyerUrl(notificationType, orderId) {
  switch (notificationType) {
    case 'order_confirmed':
      return orderId ? `/buyer/orders/${orderId}` : '/buyer/dashboard';
    case 'order_processing':
      return orderId ? `/buyer/orders/${orderId}` : '/buyer/orders';
    case 'order_ready':
      return orderId ? `/buyer/orders/${orderId}` : '/buyer/orders';
    case 'rider_assigned':
    case 'rider_arrived_at_restaurant':
    case 'order_picked_up':
    case 'order_on_the_way':
    case 'delivery_attempted':
      return orderId ? `/buyer/orders/${orderId}` : '/buyer/orders';
    case 'order_delivered':
      return orderId ? `/buyer/orders/${orderId}` : '/buyer/orders';
    case 'promotion':
      return '/buyer/explore';
    case 'payment_failed':
      return '/buyer/account/payment';
    case 'support':
      return '/buyer/support';
    default:
      return '/buyer/dashboard';
  }
}

/**
 * Handle notification close
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
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
  } catch {
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
  } catch {
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
