// Service Worker for offline functionality and PWA installation
const CACHE_NAME = 'outfit-app-cache-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './icon.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Intercept fetch requests and serve them strictly from cache first 
    // for assets, or fallback to network for live weather API calls.
    if (event.request.url.includes('api.open-meteo.com')) {
        return; // Let standard fetch handle external API requests natively
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
