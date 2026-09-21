/* Keeping the tablet on the current version.

   A service worker serves from cache first, which is what makes the app open
   instantly and work offline — but it also means the page on screen keeps
   running the code it started with. Without this module, a new version sits
   in the cache unused until the app happens to be opened twice.

   So: check for a new version on every launch, and when one takes over,
   reload the page — but only at a moment where a reload costs nothing. */

import { APP_VERSION } from './version.js';
import { on as onBus } from './bus.js';

const supported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

/* Whether this page was already being served by a worker when it loaded. On
   the very first visit there is nothing stale on screen, so the worker taking
   control is not a reason to refresh. */
const hadController = supported && !!navigator.serviceWorker.controller;

let registration = null;
let updatePending = false;
let reloading = false;

export { APP_VERSION };

/**
 * Register the worker and watch for new versions.
 * @param {object} opts
 * @param {() => boolean} opts.isSafeToReload
 *   Asked before refreshing. Reloading in the middle of a spelling word would
 *   throw away what she is doing, so the reload waits for a calm moment.
 */
export function watchForUpdates({ isSafeToReload = () => true } = {}) {
  if (!supported) return;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;     // first install — nothing to refresh
    updatePending = true;
    maybeReload();
  });

  // A module worker so it can import the version constant rather than keep a
  // second copy of it. Every browser this app targets supports them.
  navigator.serviceWorker.register('sw.js', { type: 'module' })
    .then(reg => {
      registration = reg;
      reg.update().catch(() => {});   // look for a new version on every launch
    })
    .catch(err => console.warn('[sw] registration failed', err));

  onBus('route:after', maybeReload);

  function maybeReload() {
    if (!updatePending || reloading) return;
    if (!isSafeToReload()) return;
    reloading = true;
    location.reload();
  }
}

/** True when a newer version is downloaded and waiting for a calm moment. */
export function updateWaiting() {
  return updatePending;
}

/**
 * Ask the server for a new version right now.
 * @returns {Promise<'found'|'current'|'unsupported'>}
 */
export async function checkNow() {
  if (!supported || !registration) return 'unsupported';
  try {
    await registration.update();
  } catch {
    return 'unsupported';
  }
  if (updatePending || registration.installing || registration.waiting) return 'found';
  return 'current';
}
