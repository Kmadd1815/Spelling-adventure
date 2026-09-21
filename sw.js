/* Offline support.

   Bump CACHE whenever files change, otherwise the tablet keeps serving the
   old copy. The app shell is cached up front so it opens with no network
   at all; everything is same-origin and there are no third-party requests. */

const CACHE = 'spelling-adventure-v4';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/app.js',
  './js/core/bus.js',
  './js/core/storage.js',
  './js/core/state.js',
  './js/core/words.js',
  './js/core/speech.js',
  './js/core/rewards.js',
  './js/core/pet.js',
  './js/core/season.js',
  './js/ui/dom.js',
  './js/ui/router.js',
  './js/ui/art.js',
  './js/ui/toast.js',
  './js/screens/home.js',
  './js/screens/setup.js',
  './js/screens/spell.js',
  './js/screens/words.js',
  './js/screens/pet.js',
  './js/screens/progress.js',
  './js/screens/parent.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      // addAll fails the whole install if any one file 404s, so add them
      // individually and let a missing optional file slide.
      .then(cache => Promise.all(SHELL.map(url => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(hit => {
      // Serve from cache immediately, then quietly refresh it for next time.
      const network = fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => hit);
      return hit || network;
    })
  );
});
