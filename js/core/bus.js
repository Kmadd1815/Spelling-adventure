/* Tiny pub/sub so systems can talk without importing each other. */

const listeners = new Map();

export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => off(event, fn);
}

export function off(event, fn) {
  listeners.get(event)?.delete(fn);
}

export function emit(event, payload) {
  listeners.get(event)?.forEach(fn => {
    try { fn(payload); }
    catch (err) { console.error(`[bus] listener for "${event}" threw`, err); }
  });
}
