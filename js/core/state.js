/* The single source of truth. Screens read it, systems mutate it through
   update(), and every mutation persists and notifies. */

import * as storage from './storage.js';
import { emit } from './bus.js';

let state = storage.load();

export function getState() {
  return state;
}

/** Mutate state in place inside fn, then persist + broadcast. */
export function update(fn) {
  const result = fn(state);
  storage.save(state);
  emit('state:changed', state);
  return result;
}

/** Replace the whole state (restore from backup, full reset). */
export function replaceState(next) {
  state = next;
  storage.flush(state);
  emit('state:changed', state);
  emit('state:replaced', state);
}

export function resetAll() {
  replaceState(storage.defaultState());
}

export const settings = () => state.settings;
export const progress = () => state.progress;
export const child    = () => state.child;

export function flushNow() {
  storage.flush(state);
}
