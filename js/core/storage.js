/* Persistence. Everything lives in one JSON blob in localStorage.
   Nothing leaves the tablet — there is no server and no account.

   Because that blob is the only copy of months of progress, this module
   also keeps a rolling secondary copy and owns backup export/import. */

import { emit } from './bus.js';

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
      masteryThreshold: 5,      // correct test answers in a row
      /* Whether those have to be on different days. Off by default: three
         in a row is what a parent means by "three in a row", and a word is
         never shown before she spells it, so there is nothing on screen to
         copy. On, it becomes three separate days, which is a stronger claim
         and a much slower one. */
      oneCreditPerDay: false,
      masteryRuleV2: true,      // see migrate(): moved to five tests in a row
      practiceSize: 8,          // words in Today's Practice
      practiceTestSize: 10,     // words in a practice test
      /* Mastered words come back to be checked after a week, a month, a
         term and half a year. There used to be a setting here called
         includeMasteredInPractice which nothing anywhere ever read — the
         intention was right and the mechanism was never built, and nothing
         said so. See REVIEW_LADDER in core/words.js. */
      reviewMastered: true,
      reviewsPerDay: 2,         // at most, mixed into Today's Practice

      /* Voice */
      voiceURI: null,
      rate: 0.85,
      sentenceMode: 'homophone', // 'never' | 'homophone' | 'always'

      /* Input */
      keyboardLayout: 'qwerty', // 'qwerty' (real US layout) | 'abc'

      /* Mini-games */
      gamesAfterDaily: true,    // games wait until Today's Practice is done

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
      /* Days she turned up, not days in a row. Nothing takes it away —
         see touchStreak() in core/rewards.js. longestStreak is kept only
         because saves in the wild carry it; it can no longer differ. */
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
      window: 'window_plain',
      door: null,
      bed: null,
      rug: null,
      hat: null,
      accessory: null,
      wallDecor: [],    // up to 2
      floorDecor: [],   // up to 3

      /* The garden. Sky and ground are starters, like wallpaper and
         flooring, so the first thing she sees out there is a garden rather
         than a blank box. */
      sky: 'sky_day',
      ground: 'ground_grass',
      tree: null,
      water: null,
      fence: null,
      gardenDecor: [],  // up to 3
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

  /* The streak became a count of days she turned up rather than days in a
     row, so the rest-day bookkeeping has nothing left to do. A save made
     under the old rule may be mid-stream with a number that a missed day
     was about to knock down; whatever it says now is what it keeps, and
     from here it only goes up. */
  if (state.progress && 'lastRestDay' in state.progress) delete state.progress.lastRestDay;

  /* A room needs a window: indoors, it is the only place the weather
     shows. Saves made before there was a starter one get it here. */
  if (state.equipped && !state.equipped.window) state.equipped.window = 'window_plain';

  /* The mastery rule changed twice: from "three in a row, one a day" to
     "three in a row, every answer counts", and then to "five in a row, and
     only the two tests count". A save made under an older rule is moved
     across once — her streaks and anything already mastered carry over
     untouched, they just need more to finish now. */
  if (state.settings && !state.settings.masteryRuleV2) {
    state.settings.masteryRuleV2 = true;
    state.settings.masteryThreshold = 5;
    /* Games now wait for Today's Practice by default. A save made before
       that has `false` stored, which would silently win over the new
       default, so it moves across here too. */
    state.settings.gamesAfterDaily = true;
  }

  /* The Toadstools were two catalogue rows sharing one id — 50 stars for the
     garden, 110 for indoors — and the second row won the lookup, so every
     pair she bought was filed as indoor furniture whichever shelf she bought
     it from. The indoor one has its own id now.

     Nothing is taken away. She gets both: which of the two she actually paid
     for is not recorded anywhere, and the wrong guess would delete something
     she owns. A spare decoration costs nothing; losing one she saved up for
     is the kind of thing a child remembers. */
  if (state.collection && Array.isArray(state.collection.items)) {
    const had = state.collection.items.some(r => r.itemId === 'mushrooms');
    const has = state.collection.items.some(r => r.itemId === 'toadstool_cluster');
    if (had && !has) {
      state.collection.items.push({
        id: 'mig-toadstool-' + Date.now(),
        itemId: 'toadstool_cluster',
        source: 'Bought in the shop',
        earnedAt: Date.now(),
      });
      /* If a pair was standing on the floor it stays exactly where she put
         it, under the id that belongs indoors. */
      const floor = state.equipped?.floorDecor;
      if (Array.isArray(floor)) {
        const at = floor.indexOf('mushrooms');
        if (at !== -1) floor[at] = 'toadstool_cluster';
      }
    }
  }

  /* Every word she has already mastered gets its first check scheduled,
     counted from the day she mastered it rather than from today — so a word
     she finished in the summer is due now, which is the whole point, and
     one she finished this week waits its week like any other.

     A big backlog is not a problem: Today's Practice takes at most a couple
     of reviews a day, oldest first, so it drains gently instead of arriving
     as a fifty-word exam. */
  for (const w of state.words || []) {
    if (w.masteredAt && !w.reviewAt) {
      w.reviewStep = 0;
      w.reviewAt = w.masteredAt + 7 * 86400000;
    }
  }

  /* Saves made before there was a garden get its sky and ground, and the
     empty lists the slots expect. */
  if (state.equipped) {
    const e = state.equipped;
    if (!e.sky) e.sky = 'sky_day';
    if (!e.ground) e.ground = 'ground_grass';
    if (!Array.isArray(e.gardenDecor)) e.gardenDecor = [];
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
    /* A CORRUPT save used to go straight to a blank app — every word, every
       star and every mastered dot gone — while a perfectly good auto-backup
       sat in the next key along, untouched. The backup is written for
       exactly this ("so a half-finished write can't take both copies down
       at once") and the one path that could not read it was the one that
       needed it, because the fallback above only ran when the primary was
       MISSING, and a truncated write leaves it present and unparseable.

       This is what a half-written save actually looks like, and it is worse
       than starting fresh: the screen says "No words yet", which reads as
       "nobody ever added a list" rather than "everything is gone". */
    console.error('[storage] save file is corrupt', err);
    let backup = null;
    try { backup = localStorage.getItem(BACKUP_KEY); } catch { /* ignore */ }
    if (backup && backup !== raw) {
      try {
        const state = migrate(JSON.parse(backup));
        console.warn('[storage] recovered from the auto-backup');
        recovered = true;
        return state;
      } catch (err2) {
        console.error('[storage] the auto-backup is corrupt too', err2);
      }
    }
    lost = true;
    return defaultState();
  }
}

/* Whether the last load had to fall back, so a screen can say so. Silence
   is the wrong answer to either of these: one is good news she should know
   about, the other is the worst news in the app. */
let recovered = false;
let lost = false;
export const loadOutcome = () => (lost ? 'lost' : recovered ? 'recovered' : 'ok');

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
    if (saveFailed) { saveFailed = false; emit('storage:ok'); }
  } catch (err) {
    /* Out of space, or storage switched off. Nothing is being written and
       she will carry on playing for an hour before anyone finds out — so
       say so, once, rather than only in a console nobody has open. */
    console.error('[storage] could not save', err);
    if (!saveFailed) { saveFailed = true; emit('storage:failed', err); }
  }
}

let saveFailed = false;
export const isSaving = () => !saveFailed;

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
