/* Hash-based router. No dependencies, no build step, and the browser's
   own back gesture works because every screen is a real history entry. */

import { clear } from './dom.js';
import { emit } from '../core/bus.js';

const routes = new Map();
let currentCleanup = null;
let currentPath = null;

export function route(path, config) {
  routes.set(path, config);
}

export function navigate(path, { replace = false } = {}) {
  const target = `#${path}`;
  if (location.hash === target) return render();
  if (replace) location.replace(target);
  else location.hash = target;
}

export function goBack(fallback = '/') {
  if (history.length > 1 && currentPath !== '/') history.back();
  else navigate(fallback, { replace: true });
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
