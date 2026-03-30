// ---- VERSION: bump this whenever you deploy a new build ----
const CACHE_NAME = 'rotina-v2.0';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './data.js',
  './icons.js',
  './manifest.json',
  './icons/icon-512.png',
  './images/upper_body.png',
  './images/lower_body.png',
  './images/core_shadow.png',
];

// Install: pre-cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // activate immediately
});

// Activate: delete ALL old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // take control of all open tabs
});

// Fetch: NETWORK-FIRST — always try network, fall back to cache offline
self.addEventListener('fetch', e => {
  // Only handle GET requests for same origin
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(networkRes => {
        // Update cache with latest from network
        const clone = networkRes.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return networkRes;
      })
      .catch(() => {
        // Network failed — serve from cache (offline mode)
        return caches.match(e.request);
      })
  );
});
