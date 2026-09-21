/* Persistence. Everything lives in one JSON blob in localStorage.
   Nothing leaves the tablet — there is no server and no account.

   Because that blob is the only copy of months of progress, this module
   also keeps a rolling secondary copy and owns backup export/import. */

const KEY        = 'spelling-adventure:v1';
const BACKUP_KEY = 'spelling-adventure:v1:autobackup';
const SCHEMA_VERSION = 1;

export function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: Date.now(),

    child: {
      name: '',
      petCoat: 'cocoa',
      petName: '',
      setupComplete: false,
    },

    settings: {
      /* Spelling */
      masteryThreshold: 3,      // distinct sessions spelled correctly
      missBehavior: 'setback',  // 'keep' | 'setback' | 'reset'
      practiceSize: 8,
      includeMasteredInPractice: false,

      /* Voice */
      voiceURI: null,
      rate: 0.85,
      sentenceMode: 'homophone', // 'never' | 'homophone' | 'always'

      /* Input */
      keyboardLayout: 'qwerty', // 'qwerty' (real US layout) | 'abc'

      /* Rewards */
      starsPerCorrect: 2,
      starsPerTry: 1,
      starsPerSession: 5,
      starsPerMastery: 15,

      /* Parent gate */
      parentPin: '1234',
    },

    lists: [],
    words: [],

    progress: {
      stars: 0,
      sessionsCompleted: 0,
      testsCompleted: 0,
      wordsAttempted: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastPracticeDay: null,   // 'YYYY-MM-DD'
      milestonesEarned: [],    // milestone ids
    },

    /* Rolling history, trimmed to the most recent sessions. */
    sessions: [],

    /* Reserved for the collection / shop layer. Special items land here
       with the record of how they were earned. */
    collection: {
      items: [],   // { id, itemId, name, category, source, earnedAt, special }
    },
  };
}

function migrate(state) {
  // Fill in anything a newer version added, without touching existing data.
  const base = defaultState();
  const merged = {
    ...base,
    ...state,
    child:      { ...base.child,      ...(state.child    || {}) },
    settings:   { ...base.settings,   ...(state.settings || {}) },
    progress:   { ...base.progress,   ...(state.progress || {}) },
    collection: { ...base.collection, ...(state.collection || {}) },
  };
  merged.schemaVersion = SCHEMA_VERSION;
  return merged;
}

export function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); }
  catch (err) { console.warn('[storage] localStorage unreadable', err); }

  if (!raw) {
    // Fall back to the auto-backup before giving up and starting fresh.
    try { raw = localStorage.getItem(BACKUP_KEY); }
    catch { /* ignore */ }
    if (raw) console.warn('[storage] primary save missing — restored from auto-backup');
  }
  if (!raw) return defaultState();

  try {
    return migrate(JSON.parse(raw));
  } catch (err) {
    console.error('[storage] save file is corrupt', err);
    return defaultState();
  }
}

let writeTimer = null;
let backupCounter = 0;

export function save(state) {
  clearTimeout(writeTimer);
  writeTimer = setTimeout(() => flush(state), 200);
}

export function flush(state) {
  clearTimeout(writeTimer);
  try {
    const json = JSON.stringify(state);
    localStorage.setItem(KEY, json);
    // Second copy every 10th write, so a half-finished write can't take
    // both copies down at once.
    if (backupCounter++ % 10 === 0) localStorage.setItem(BACKUP_KEY, json);
  } catch (err) {
    console.error('[storage] could not save', err);
  }
}

/* ---------- Backup / restore ----------
   This is the real safety net: browser storage can be cleared by the OS,
   by "clear browsing data", or by a stray tap in Chrome's settings. */

export function exportBlob(state) {
  const payload = {
    app: 'spelling-adventure',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    state,
  };
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
}

export function suggestedFilename() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `spelling-adventure-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

export function parseBackup(text) {
  const payload = JSON.parse(text);
  const state = payload?.state ?? payload;
  if (!state || !Array.isArray(state.words) || !Array.isArray(state.lists)) {
    throw new Error('That file does not look like a Spelling Adventure backup.');
  }
  return migrate(state);
}
