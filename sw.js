const CACHE_NAME = 'dice-battle-elite-v1.1';
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

// Install Event - Caches the files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Fetch Event - Serves files from cache if offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            return response || fetch(event.request);
        })
    );
});
