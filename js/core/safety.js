/* Keeping months of work from evaporating.

   Everything she has done lives in one browser's storage, on one tablet.
   The rolling second copy in storage.js guards against a half-finished
   write and against nothing else: "clear browsing data", a storage sweep
   by Chrome, a factory reset or a lost tablet all take both copies at once.

   So there are two jobs here, and neither of them is a feature she will
   ever see:

     Ask Chrome not to reclaim the storage. A site that has been granted
     persistence is not evicted when the device is short of space.

     Notice when a backup is overdue and say so, in terms of what is
     actually at risk — "nine words mastered since you last saved a copy"
     rather than a date.

   Nothing here ever nags the child. Backups are a grown-up's job and the
   reminder only appears in the Parent Area.
*/

import { getState, update } from './state.js';
import { masteredWords } from './words.js';

/** How long a backup stays fresh before it is worth mentioning. */
export const STALE_DAYS = 14;
/** Mastered words since the last copy that make it worth mentioning sooner. */
export const STALE_WORDS = 8;
/** How long "remind me later" holds for. */
export const SNOOZE_DAYS = 3;

const DAY = 86400000;

/* ---------- Persistence ----------

   Asking is free and the answer is remembered by the browser, so this runs
   once quietly at start-up. Chrome grants it readily for an installed app.
   A refusal is not worth telling anybody about — there is nothing they
   could do differently, and the backup reminder covers the same risk. */

export async function requestPersistence() {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted?.()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

export async function persistenceState() {
  try {
    if (!navigator.storage?.persisted) return 'unknown';
    return (await navigator.storage.persisted()) ? 'granted' : 'not granted';
  } catch {
    return 'unknown';
  }
}

/** How big her actual save file is — not the app, not the offline cache. */
export function saveSize() {
  try {
    return new Blob([JSON.stringify(getState())]).size;
  } catch {
    return null;
  }
}

/** Everything this app is using on the device, the app shell included. */
export async function storageEstimate() {
  try {
    const { usage } = (await navigator.storage?.estimate?.()) || {};
    return typeof usage === 'number' ? usage : null;
  } catch {
    return null;
  }
}

/* ---------- The backup record ---------- */

export function noteBackupSaved() {
  update(state => {
    state.progress.lastBackupAt = Date.now();
    state.progress.lastBackupMastered = masteredWords().length;
    state.progress.backupSnoozedUntil = null;
  });
}

export function snoozeReminder() {
  update(state => {
    state.progress.backupSnoozedUntil = Date.now() + SNOOZE_DAYS * DAY;
  });
}

export function lastBackup() {
  const at = getState().progress.lastBackupAt;
  return at ? new Date(at) : null;
}

export function daysSinceBackup() {
  const at = getState().progress.lastBackupAt;
  return at ? Math.floor((Date.now() - at) / DAY) : null;
}

/** Words mastered since the last copy — the thing actually at risk. */
export function masteredSinceBackup() {
  const p = getState().progress;
  if (!p.lastBackupAt) return masteredWords().length;
  return Math.max(0, masteredWords().length - (p.lastBackupMastered || 0));
}

/**
 * Should the Parent Area say something about backing up?
 *
 * Only ever when there is something real to lose. A tablet she has not
 * used yet has nothing worth saving, and saying so would be noise.
 *
 * @returns {{due: boolean, reason: string, days: number|null, words: number}}
 */
export function backupStatus() {
  const p = getState().progress;
  const words = masteredSinceBackup();
  const days = daysSinceBackup();
  const atRisk = words > 0 || (p.sessionsCompleted || 0) > 0;

  const quiet = { due: false, reason: '', days, words };
  if (!atRisk) return quiet;
  if (p.backupSnoozedUntil && Date.now() < p.backupSnoozedUntil) return quiet;

  if (!p.lastBackupAt) {
    return { due: true, reason: 'never', days: null, words };
  }
  if (words >= STALE_WORDS) {
    return { due: true, reason: 'words', days, words };
  }
  if (days !== null && days >= STALE_DAYS) {
    return { due: true, reason: 'age', days, words };
  }
  return quiet;
}

/** One plain sentence about what is at stake right now. */
export function backupMessage(status = backupStatus()) {
  const { reason, days, words } = status;
  const w = n => `${n} word${n === 1 ? '' : 's'}`;

  if (reason === 'never') {
    return words > 0
      ? `No copy of her progress has ever been saved, and she has ${w(words)} mastered. If this tablet’s browsing data were cleared, all of it would be gone.`
      : 'No copy of her progress has ever been saved. It is worth doing once now, so the habit is there before there is a lot to lose.';
  }
  if (reason === 'words') {
    return `${w(words)} mastered since the last copy was saved. Worth saving another one.`;
  }
  if (reason === 'age') {
    return `It has been ${days} days since a copy was saved${words ? `, and ${w(words)} have been mastered since` : ''}.`;
  }
  return '';
}

/** How the up-to-date case reads, for the Backup screen. */
export function reassurance() {
  const days = daysSinceBackup();
  if (days === null) return 'No copy saved yet.';
  if (days === 0) return 'Last copy saved today.';
  if (days === 1) return 'Last copy saved yesterday.';
  return `Last copy saved ${days} days ago.`;
}
