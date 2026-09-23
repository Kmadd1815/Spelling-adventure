/* Offline support.

   A module worker, so the version constant has exactly one home. Bumping
   APP_VERSION in js/core/version.js changes the cache name here, which
   retires the old cache and ships the new files — there is no second copy
   of the version to forget about.

   The app shell is cached up front so it opens with no network at all;
   everything is same-origin and there are no third-party requests. */

import { APP_VERSION } from './js/core/version.js';

const CACHE = `spelling-adventure-${APP_VERSION}`;

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/app.js',
  './js/core/version.js',
  './js/core/updates.js',
  './js/core/bus.js',
  './js/core/storage.js',
  './js/core/state.js',
  './js/core/words.js',
  './js/core/items.js',
  './js/core/speech.js',
  './js/core/rewards.js',
  './js/core/pet.js',
  './js/core/games.js',
  './js/core/events.js',
  './js/core/discovery.js',
  './js/core/safety.js',
  './js/core/season.js',
  './js/core/garden.js',
  './js/ui/dom.js',
  './js/ui/router.js',
  './js/ui/art.js',
  './js/ui/item-art.js',
  './js/ui/shade.js',
  './js/ui/scenes.js',
  './js/ui/petlife.js',
  './js/ui/toast.js',
  './js/ui/fx.js',
  './js/ui/room.js',
  './js/ui/garden.js',
  './js/ui/weather.js',
  './js/ui/buddy.js',
  './js/ui/discovery.js',
  './js/ui/keyboard.js',
  './js/screens/home.js',
  './js/screens/setup.js',
  './js/screens/spell.js',
  './js/screens/words.js',
  './js/screens/pet.js',
  './js/screens/progress.js',
  './js/screens/parent.js',
  './js/core/weeknote.js',
  './js/ui/textsize.js',
  './js/screens/paper.js',
  './js/screens/shop.js',
  './js/screens/decorate.js',
  './js/screens/games.js',
  './js/screens/play.js',
  './js/screens/event.js',
  './js/screens/garden.js',
  /* The games themselves are loaded on demand, so they are listed here to
     make sure they are in the cache before she is ever offline. */
  './js/games/wordsearch.js',
  './js/games/fillgap.js',
  './js/games/spotit.js',
  './js/games/builder.js',
  './js/games/crossword.js',
  './js/games/tictactoe.js',
  './js/games/sprint.js',
  './js/games/snake.js',
  './js/games/tower.js',
  './js/games/trace.js',
  './js/games/swim.js',
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
