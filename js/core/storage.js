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
      masteryThreshold: 3,      // correct answers in a row, max one a day
      practiceSize: 8,          // words in Today's Practice
      practiceTestSize: 10,     // words in a practice test
      includeMasteredInPractice: false,

      /* Voice */
      voiceURI: null,
      rate: 0.85,
      sentenceMode: 'homophone', // 'never' | 'homophone' | 'always'

      /* Input */
      keyboardLayout: 'qwerty', // 'qwerty' (real US layout) | 'abc'

      /* Mini-games */
      gamesAfterDaily: false,   // when on, games wait until practice is done

      /* Her birthday, as MM-DD. Birthday Week runs three days either side
         of it. A birthday belongs to the child, not to the calendar, so it
         is a setting rather than a date baked into the event list. */
      birthday: '11-07',

      /* Rewards.
         Every activity pays a flat base for finishing it, plus one star for
         each word spelled right on the first try. The base is what pays for
         effort, so a hard session still earns something; the per-word stars
         are what pay for accuracy. */
      starsDaily: 5,            // finishing Today's Practice
      starsPracticeTest: 10,    // finishing a practice test
      starsFullTest: 15,        // finishing a full spelling test
      starsPerFirstTry: 1,      // each word right on the first try
      starsPerfectTest: 5,      // bonus for a flawless full spelling test
      starsExtraClean: 2,       // an extra practice run with no mistakes
      starsExtraTried: 1,       // an extra practice run with any mistakes
      starsPerMastery: 5,       // each word that reaches mastery

      /* Parent gate */
      parentPin: '1234',
    },

    lists: [],
    words: [],

    progress: {
      stars: 0,
      treats: 0,        // earned by spelling, spent on spoiling the axolotl
      petMoments: 0,    // a tally of times played together; only ever goes up
      sessionsCompleted: 0,
      testsCompleted: 0,
      gamesPlayed: 0,
      wordsAttempted: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastPracticeDay: null,   // 'YYYY-MM-DD'
      milestonesEarned: [],    // milestone ids

      /* What the mini-games have paid today, so the daily ceiling survives
         a reload. Reset by core/games.js the first time it is read on a
         new day. */
      gameDay: null,           // { day, stars, plays: { gameId: count } }
      eventDay: null,          // { day, stars, rounds } — events are budgeted apart
      lastDiscoveryDay: null,  // 'YYYY-MM-DD' the axolotl last found something

      /* Backup safety. Everything she has done lives in one browser on one
         tablet, so core/safety.js watches how long it has been since a copy
         left the device and how much has happened since. */
      lastBackupAt: null,        // ms
      lastBackupMastered: 0,     // mastered words at that moment
      backupSnoozedUntil: null,  // ms — "remind me later" 
    },

    /* Rolling history, trimmed to the most recent sessions. */
    sessions: [],

    /* How far she has got in each seasonal event, keyed by event id:
       { count, claimed: [itemId] }. An event ending never clears this —
       what she earned stays earned, and next year is a new key. */
    events: {},

    /* Everything she owns. Each record is just which catalogue item it is
       and how she came by it — the name, art and price all live in the
       catalogue, so an item can never disagree with itself. */
    collection: {
      items: [],   // { id, itemId, source, earnedAt }
    },

    /* What is on show right now, a slot at a time. Owning is permanent;
       this is the arrangement she chooses on top of it. */
    equipped: {
      wallpaper: 'wall_plain',
      flooring: 'floor_wood',
      window: null,
      door: null,
      bed: null,
      rug: null,
      hat: null,
      accessory: null,
      wallDecor: [],    // up to 2
      floorDecor: [],   // up to 3
    },
  };
}

function migrate(state) {
  /* The scene used to be one flat list of three things. It is a room now,
     with a place for each kind of thing, so anything already out gets sorted
     into the slot its category belongs to rather than being dropped. */
  if (state.equipped && Array.isArray(state.equipped.scene)) {
    const CATEGORY_OF = {
      rug: 'rug', star_rug: 'rug',
      lantern: 'wallDecor', week_banner: 'wallDecor', sun_mobile: 'wallDecor',
      ribbon_shelf: 'wallDecor', trophy_shelf: 'wallDecor',
    };
    const e = state.equipped;
    e.wallDecor = e.wallDecor || [];
    e.floorDecor = e.floorDecor || [];
    for (const id of state.equipped.scene) {
      const slot = CATEGORY_OF[id] || 'floorDecor';
      if (slot === 'rug') e.rug = e.rug || id;
      else if (slot === 'wallDecor') { if (e.wallDecor.length < 2) e.wallDecor.push(id); }
      else if (e.floorDecor.length < 3) e.floorDecor.push(id);
    }
    delete state.equipped.scene;
    if (!e.wallpaper) e.wallpaper = 'wall_plain';
    if (!e.flooring) e.flooring = 'floor_wood';
  }

  // Mastery used to be counted as a list of session ids. It is now a streak
  // of correct answers capped at one a day, so carry the old count across as
  // a starting streak rather than throwing her progress away.
  for (const w of state.words || []) {
    if (w.streak === undefined) {
      w.streak = Array.isArray(w.creditSessions) ? w.creditSessions.length : 0;
      w.lastCreditDay = null;
      w.lastDailyDay = null;
    }
    delete w.creditSessions;
  }

  // Fill in anything a newer version added, without touching existing data.
  const base = defaultState();
  const merged = {
    ...base,
    ...state,
    child:      { ...base.child,      ...(state.child    || {}) },
    settings:   { ...base.settings,   ...(state.settings || {}) },
    progress:   { ...base.progress,   ...(state.progress || {}) },
    collection: { ...base.collection, ...(state.collection || {}) },
    events:     { ...base.events,     ...(state.events     || {}) },
    equipped:   { ...base.equipped,   ...(state.equipped   || {}) },
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
