/* Hash-based router. No dependencies, no build step, and the browser's
   own back gesture works because every screen is a real history entry. */

import { clear } from './dom.js';
import { emit } from '../core/bus.js';

const routes = new Map();
let currentCleanup = null;
let currentPath = null;
let currentUp = null;

export function route(path, config) {
  routes.set(path, config);
}

export function navigate(path, { replace = false } = {}) {
  const target = `#${path}`;
  if (location.hash === target) return render();
  if (replace) location.replace(target);
  else location.hash = target;
}

/* The arrow in the top bar goes UP one level, not back through history.

   Those are not the same thing and the difference is the whole point. Play
   three mini-games and the history behind you is games, play, games, play,
   games, play — pressing back walks her back through every game she just
   finished, one at a time, which is not what an arrow at the top left of a
   children's app means. It means "out of here". A screen says where out of
   it is (`back: '/games'` in the route table), and the arrow goes there.

   The browser's own back gesture still retraces history, because that is
   what a browser's back gesture is for. */
export function goBack(fallback = '/') {
  const up = typeof currentUp === 'string' && currentUp !== currentPath
    ? currentUp
    : fallback;
  navigate(up);
}

export function currentRoute() {
  return currentPath;
}

function parse() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, query] = raw.split('?');
  const params = Object.fromEntries(new URLSearchParams(query || ''));
  return { path: path || '/', params };
}

export function render() {
  const { path, params } = parse();
  const config = routes.get(path) || routes.get('/');
  if (!config) return;

  // Let the outgoing screen stop timers, cancel speech, and so on.
  try { currentCleanup?.(); } catch (err) { console.error('[router] cleanup failed', err); }
  currentCleanup = null;
  currentPath = path;
  currentUp = typeof config.back === 'string' ? config.back : null;

  const screen = document.getElementById('screen');
  clear(screen);
  screen.scrollTop = 0;

  const topbar = document.getElementById('topbar');
  const showChrome = config.chrome !== false;
  topbar.hidden = !showChrome;
  if (showChrome) {
    document.getElementById('screenTitle').textContent =
      typeof config.title === 'function' ? config.title(params) : (config.title || '');
    document.getElementById('backBtn').hidden = !config.back;
    document.getElementById('starCount').hidden = config.stars === false;
  }

  emit('route:before', { path, params });
  currentCleanup = config.render(screen, params) || null;
  emit('route:after', { path, params });
}

export function start() {
  addEventListener('hashchange', render);
  render();
}
