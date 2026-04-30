const CACHE_NAME = 'dice-battle-elite-v1.2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './main.js',
    './manifest.json',
    './assets/red-dice.png',
    './assets/red-1.png',
    './assets/red-6.png',
    './assets/green-1.png'
];

// 1. Install Event - Caches the files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    // Forces the newly installed service worker to activate immediately
    self.skipWaiting();
});

// 2. Activate Event - Cleans up old, stubborn caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // If the cache name doesn't match our current version (v1.2), delete it!
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Takes control of all open browser tabs immediately
    self.clients.claim();
});

// 3. Fetch Event - Serves files from cache so the game works offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            return response || fetch(event.request);
        })
    );
});
