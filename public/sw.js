/* global importScripts */
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE_NAME = 'peyvchin-v6';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/coin.mp3',
  '/victory.mp3',
  '/click.mp3',
  '/pop.mp3',
  '/noti.mp3',
  '/messag.mp3'
];

// Install: Cache basic assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
});

// Activate: Clean up old caches
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
  self.clients.claim(); // Immediately take control of all open clients
});

// Fetch Strategy: Network-First for HTML, Cache-First for others
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // For HTML pages, try Network first so we get the latest script hashes
  if (event.request.mode === 'navigate' || (url.origin === self.origin && url.pathname === '/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For other assets, use Cache-First
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
