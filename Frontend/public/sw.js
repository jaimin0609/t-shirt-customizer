// Service Worker for Uniqverse PWA
const CACHE_NAME = 'uniqverse-cache-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/critical.css',
  '/fallback.css',
  '/logo.png',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Additional runtime caching rules
const RUNTIME_CACHE_RULES = [
  // CSS and JS files
  { urlPattern: /\.(?:js|css)$/, strategy: 'staleWhileRevalidate' },
  // Image files
  { urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/, strategy: 'cacheFirst' },
  // Fonts
  { urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/, strategy: 'cacheFirst' },
  // API calls
  { urlPattern: /^https:\/\/t-shirt-customizer-backend\.onrender\.com\/api/, strategy: 'networkFirst' },
  // Cloudinary images
  { urlPattern: /^https:\/\/res\.cloudinary\.com\//, strategy: 'cacheFirst' }
];

// Install event: Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell and content');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        console.log('Deleting old cache:', cacheToDelete);
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Helper function to determine caching strategy
const getStrategy = (url) => {
  const urlObj = new URL(url);
  for (const rule of RUNTIME_CACHE_RULES) {
    if (rule.urlPattern.test(urlObj.href)) {
      return rule.strategy;
    }
  }
  return 'networkFirst'; // Default strategy
};

// Handle fetch events with different strategies
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('cloudinary.com') && 
      !event.request.url.includes('t-shirt-customizer-backend.onrender.com')) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const strategy = getStrategy(event.request.url);

  if (strategy === 'cacheFirst') {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request)
            .then((response) => {
              // Don't cache non-successful responses
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clone the response as it can only be consumed once
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              return response;
            })
            .catch(() => {
              // For image requests, return a fallback image if available
              if (event.request.destination === 'image') {
                return caches.match('/icons/placeholder-image.png');
              }
              return caches.match('/offline.html');
            });
        })
    );
  } else if (strategy === 'networkFirst') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response as it can only be consumed once
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // For HTML requests, return the offline page
              if (event.request.destination === 'document') {
                return caches.match('/offline.html');
              }
              
              // Return a fallback for other types if needed
              return new Response('Network error', { status: 408, headers: { 'Content-Type': 'text/plain' } });
            });
        })
    );
  } else { // staleWhileRevalidate
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              // Don't cache non-successful responses
              if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                return networkResponse;
              }
              
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, networkResponse.clone());
                });
              return networkResponse;
            })
            .catch(() => {
              console.log('Fetch failed; returning offline page instead.');
              return caches.match('/offline.html');
            });
          return cachedResponse || fetchPromise;
        })
    );
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  const data = event.data.json();
  const title = data.title || 'Uniqverse';
  const options = {
    body: data.body || 'Something new happened!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: data.url || '/'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cart-items') {
    event.waitUntil(syncCartItems());
  }
});

// Function to sync cart items when back online
async function syncCartItems() {
  try {
    const db = await openDatabase();
    const tx = db.transaction('pendingCartItems', 'readonly');
    const store = tx.objectStore('pendingCartItems');
    const items = await store.getAll();
    
    if (items.length > 0) {
      for (const item of items) {
        try {
          const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
          });
          
          if (response.ok) {
            const deleteTx = db.transaction('pendingCartItems', 'readwrite');
            const deleteStore = deleteTx.objectStore('pendingCartItems');
            await deleteStore.delete(item.id);
          }
        } catch (err) {
          console.error('Failed to sync item:', err);
        }
      }
    }
  } catch (err) {
    console.error('Failed to sync cart items:', err);
  }
}

// Open IndexedDB for offline storage
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('uniqverse-offline-db', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('pendingCartItems', { keyPath: 'id' });
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
} 