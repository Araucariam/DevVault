const CACHE_NAME = 'devvault-v2.2';

// On détecte automatiquement le base path
const BASE = self.registration.scope;

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                // Cache les ressources essentielles
                return cache.addAll([
                    BASE,
                    BASE + 'index.html',
                    BASE + 'css/style.css',
                    BASE + 'js/app.js',
                    BASE + 'js/data.js',
                    BASE + 'js/utils.js',
                    BASE + 'js/snippets.js',
                    BASE + 'js/bookmarks.js',
                    BASE + 'js/notes.js',
                    BASE + 'manifest.json',
                    BASE + 'icons/192.png',
                    BASE + 'icons/512.png'
                ]).catch(err => {
                    console.warn('[SW] Cache addAll failed:', err);
                    // Continue anyway — fonts are external
                });
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE_NAME)
                    .map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith('http')) return;

    // Strategy: Cache first, then network
    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                // Return cached version
                if (cached) {
                    // Update cache in background
                    fetch(event.request)
                        .then(res => {
                            if (res && res.status === 200) {
                                caches.open(CACHE_NAME)
                                    .then(cache => cache.put(event.request, res));
                            }
                        })
                        .catch(() => {});
                    return cached;
                }

                // Not cached — fetch from network
                return fetch(event.request)
                    .then(res => {
                        if (!res || res.status !== 200) return res;
                        const clone = res.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, clone));
                        return res;
                    })
                    .catch(() => {
                        // Offline fallback for navigation
                        if (event.request.destination === 'document') {
                            return caches.match(BASE + 'index.html');
                        }
                    });
            })
    );
});

self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') self.skipWaiting();
});