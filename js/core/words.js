/* The spelling engine.

   Every activity in the app — Listen & Spell, Practice, Test, and every
   mini-game added later — goes through this module. Nothing else is
   allowed to decide what counts as "mastered" or which words come next.

   The rules it enforces (non-negotiable):
     1. Mastered words leave the active pool.
     2. Unmastered words carry forward indefinitely.
     3. Mastered words are never deleted.
     4. Mastered words only reappear when explicitly asked for.
*/

import { getState, update, settings } from './state.js';
import { emit } from './bus.js';

/* ---------- ids ---------- */

export function uid(prefix = 'w') {
  const rand = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36));
  return `${prefix}_${rand.replace(/-/g, '').slice(0, 12)}`;
}

/* ---------- Word shape ---------- */

export function makeWord(text, listId, extra = {}) {
  return {
    id: uid('w'),
    listId,
    text: String(text).trim(),
    definition: extra.definition || '',
    sentence: extra.sentence || '',
    hint: extra.hint || '',
    tags: extra.tags || [],

    attempts: 0,
    correctCount: 0,
    incorrectCount: 0,
    streak: 0,            // consecutive correct answers, at most one per day
    lastCreditDay: null,  // 'YYYY-MM-DD' the streak last went up
    lastDailyDay: null,   // 'YYYY-MM-DD' it last came up in Today's Practice
    recent: [],           // last few outcomes, newest last: true/false

    firstSeen: null,
    lastSeen: null,
    lastCorrect: null,
    lastMissed: null,
    masteredAt: null,

    createdAt: Date.now(),
  };
}

/* ---------- Status ---------- */

export const STATUS = {
  NEW:        { key: 'new',        label: 'New',        kidLabel: 'Brand new',   icon: '\u{1F195}' },
  LEARNING:   { key: 'learning',   label: 'Learning',   kidLabel: 'Learning',    icon: '\u{1F331}' },
  PRACTICING: { key: 'practicing', label: 'Practicing', kidLabel: 'Almost there',icon: '\u{1F33F}' },
  MASTERED:   { key: 'mastered',   label: 'Mastered',   kidLabel: 'Mastered',    icon: '⭐' },
};

export function threshold() {
  return Math.max(1, settings().masteryThreshold || 3);
}

/** Today, as a date key. Mastery counts at most one correct answer a day. */
export function dayKey(d = new Date()) {
  const pad = x => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Consecutive correct answers, counted at most once per day.
 *
 * Three in a row on three different days is a very different claim from
 * three in a row in five minutes: the first means she learned the word,
 * the second means she can copy letters she is still looking at. A miss
 * resets this to zero.
 */
export function credits(word) {
  return word.streak || 0;
}

/** Has this word already earned its one streak credit today? */
export function creditedToday(word) {
  return word.lastCreditDay === dayKey();
}

export function statusOf(word) {
  if (word.masteredAt) return STATUS.MASTERED;
  if (credits(word) >= threshold()) return STATUS.MASTERED;
  if (credits(word) >= 1) return STATUS.PRACTICING;
  if (word.attempts > 0) return STATUS.LEARNING;
  return STATUS.NEW;
}

export const isMastered = word => statusOf(word).key === 'mastered';

/* ---------- Pools ---------- */

export function allWords() {
  return getState().words;
}

export function wordById(id) {
  return getState().words.find(w => w.id === id) || null;
}

export function listById(id) {
  return getState().lists.find(l => l.id === id) || null;
}

export function activeLists() {
  return getState().lists.filter(l => !l.archived);
}

/** ACTIVE POOL = every unmastered word from every non-archived list.
    This is what normal practice, tests and games draw from. */
export function activeWords() {
  const archived = new Set(getState().lists.filter(l => l.archived).map(l => l.id));
  return getState().words.filter(w => !isMastered(w) && !archived.has(w.listId));
}

export function masteredWords() {
  return getState().words.filter(isMastered);
}

export function wordsInList(listId) {
  return getState().words.filter(w => w.listId === listId);
}

/* ---------- Priority / rotation ----------

   Within the active pool we favour, in order:
     1. words she keeps missing
     2. words she has not seen in a while
     3. words she has never tried
     4. words from the newest list
   A little jitter keeps the order from feeling mechanical. */

const DAY = 86400000;

function priorityScore(word, newestListId) {
  let score = 0;

  const missRate = word.attempts ? word.incorrectCount / word.attempts : 0;
  score += missRate * 40;

  // Recent misses weigh more than old ones.
  const recentMisses = word.recent.filter(ok => ok === false).length;
  score += recentMisses * 12;

  const daysSince = word.lastSeen ? (Date.now() - word.lastSeen) / DAY : 14;
  score += Math.min(daysSince, 14) * 3;

  if (credits(word) === 0) score += 10;
  if (word.attempts === 0) score += 8;
  if (word.listId === newestListId) score += 6;

  score += Math.random() * 6;
  return score;
}

/**
 * Choose the next batch of words for an activity.
 * @param {object} opts
 * @param {number} opts.count        how many words to return
 * @param {'active'|'daily'|'mastered'|'all'|'list'} opts.pool
 * @param {string} [opts.listId]     required when pool === 'list'
 * @param {boolean} [opts.allowRepeats] pad by repeating when the pool is small
 */
export function pickWords({ count = 8, pool = 'active', listId = null, allowRepeats = false } = {}) {
  let candidates;
  switch (pool) {
    case 'mastered': candidates = masteredWords(); break;
    case 'all':      candidates = allWords().slice(); break;
    case 'list':     candidates = wordsInList(listId); break;
    // Today's Practice works through the list, so it only offers words that
    // have not already had their turn today.
    case 'daily':    candidates = wordsLeftToday(); break;
    default:         candidates = activeWords();
  }
  if (!candidates.length) return [];

  const lists = activeLists();
  const newestListId = lists.length
    ? lists.reduce((a, b) => (a.createdAt > b.createdAt ? a : b)).id
    : null;

  const ranked = candidates
    .map(w => ({ w, s: priorityScore(w, newestListId) }))
    .sort((a, b) => b.s - a.s)
    .map(x => x.w);

  const chosen = ranked.slice(0, count);

  if (allowRepeats && chosen.length && chosen.length < count) {
    let i = 0;
    while (chosen.length < count) chosen.push(ranked[i++ % ranked.length]);
  }
  return chosen;
}

/* ---------- Recording an attempt ----------

   This is the ONLY way a word's mastery changes. Mini-games call this
   and nothing else, so mastery can never drift between activities. */

/**
 * Record one attempt at a word. This is the ONLY way mastery ever changes,
 * so every activity and every future mini-game must come through here.
 *
 * @param {string} wordId
 * @param {boolean} wasCorrect
 * @param {object} [opts]
 * @param {boolean} [opts.countsForMastery=true]
 *   false for a second look at a word she just missed. Those re-tries are
 *   for learning: they are recorded in her history but neither advance the
 *   streak nor break it again, and they earn nothing.
 */
export function recordAttempt(wordId, wasCorrect, opts = {}) {
  const { countsForMastery = true } = opts;

  return update(state => {
    const word = state.words.find(w => w.id === wordId);
    if (!word) return { ok: false };

    const wasMastered = isMastered(word);
    const now = Date.now();
    const today = dayKey();

    word.attempts += 1;
    word.lastSeen = now;
    if (!word.firstSeen) word.firstSeen = now;

    word.recent.push(!!wasCorrect);
    if (word.recent.length > 6) word.recent.shift();

    if (wasCorrect) {
      word.correctCount += 1;
      word.lastCorrect = now;
    } else {
      word.incorrectCount += 1;
      word.lastMissed = now;
    }

    let creditedNow = false;

    if (countsForMastery) {
      if (wasCorrect) {
        // One credit a day, so the streak measures days she knew it.
        if (word.lastCreditDay !== today) {
          word.streak = (word.streak || 0) + 1;
          word.lastCreditDay = today;
          creditedNow = true;
        }
      } else {
        word.streak = 0;
        word.lastCreditDay = null;
        word.masteredAt = null;      // a missed word comes back into rotation
      }
    }

    state.progress.wordsAttempted += 1;

    const need = Math.max(1, state.settings.masteryThreshold || 3);
    const nowMastered = (word.streak || 0) >= need;
    if (nowMastered && !word.masteredAt) word.masteredAt = now;

    const justMastered = nowMastered && !wasMastered;
    if (justMastered) emit('word:mastered', word);

    /* `creditedNow` is what the screen needs to tell her the truth. A right
       answer that earns nothing — because today is already counted, or
       because it was a second look at one she missed — looks identical to a
       broken counter unless somebody says so. */
    return { ok: true, word, justMastered, credits: word.streak || 0, creditedNow };
  });
}

/** Note that a word came up in Today's Practice, so it is done for today. */
export function markCoveredToday(wordId) {
  update(state => {
    const word = state.words.find(w => w.id === wordId);
    if (word) word.lastDailyDay = dayKey();
  });
}

/** Active words Today's Practice has not covered yet today. */
export function wordsLeftToday() {
  const today = dayKey();
  return activeWords().filter(w => w.lastDailyDay !== today);
}

/** True once every active word has had its turn today. */
export function dailyPracticeDone() {
  return activeWords().length > 0 && wordsLeftToday().length === 0;
}

/* ---------- Lists ---------- */

export function createList(name, { week = '', description = '' } = {}) {
  return update(state => {
    const list = {
      id: uid('l'),
      name: name.trim() || 'Untitled list',
      week,
      description,
      archived: false,
      createdAt: Date.now(),
    };
    state.lists.push(list);
    return list;
  });
}

export function renameList(listId, name) {
  update(state => {
    const l = state.lists.find(x => x.id === listId);
    if (l) l.name = name.trim() || l.name;
  });
}

export function setListArchived(listId, archived) {
  update(state => {
    const l = state.lists.find(x => x.id === listId);
    if (l) l.archived = !!archived;
  });
}

/** Deletes a list. Mastered words are kept and moved to an archive list,
    because Rule 3 says mastered words are never deleted. */
export function deleteList(listId) {
  update(state => {
    const keep = state.words.filter(w => w.listId === listId && isMastered(w));
    state.words = state.words.filter(w => w.listId !== listId || isMastered(w));
    if (keep.length) {
      let archive = state.lists.find(l => l.name === 'Mastered (kept)');
      if (!archive) {
        archive = { id: uid('l'), name: 'Mastered (kept)', week: '', description:
          'Mastered words rescued from deleted lists.', archived: true, createdAt: Date.now() };
        state.lists.push(archive);
      }
      keep.forEach(w => { w.listId = archive.id; });
    }
    state.lists = state.lists.filter(l => l.id !== listId);
  });
}

/* ---------- Word CRUD ---------- */

export function addWord(listId, text, extra) {
  return update(state => {
    const word = makeWord(text, listId, extra);
    state.words.push(word);
    return word;
  });
}

export function editWord(wordId, patch) {
  update(state => {
    const w = state.words.find(x => x.id === wordId);
    if (!w) return;
    Object.assign(w, patch);
    if (patch.text) w.text = String(patch.text).trim();
  });
}

export function deleteWord(wordId) {
  update(state => { state.words = state.words.filter(w => w.id !== wordId); });
}

/** Put a word back into the active pool without losing its history. */
export function resetWordProgress(wordId) {
  update(state => {
    const w = state.words.find(x => x.id === wordId);
    if (!w) return;
    w.streak = 0;
    w.lastCreditDay = null;
    w.recent = [];
    w.masteredAt = null;
  });
}

/* ---------- Bulk paste ----------

   Typing seventeen words one at a time on a tablet keyboard is the fastest
   way to make a parent stop using an app, so the list editor takes a paste
   of the whole week at once. Handles "1. train", "1) train", "- train",
   and an optional  word | definition | sentence  form. */

export function parseBulk(text) {
  const rows = [];
  const seen = new Set();

  for (const rawLine of String(text).split(/[\n\r]+/)) {
    let line = rawLine.trim();
    if (!line) continue;

    line = line.replace(/^\s*(\d+\s*[.)\-:]\s*|[-*•]\s+)/, '').trim();
    if (!line) continue;

    const parts = line.split('|').map(p => p.trim());
    const word = parts[0];
    if (!word) continue;

    // A "word" with spaces is usually a stray heading, not a spelling word,
    // but we keep short phrases in case the list has one on purpose.
    if (word.split(/\s+/).length > 3) continue;

    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({ text: word, definition: parts[1] || '', sentence: parts[2] || '' });
  }
  return rows;
}

/** Adds parsed rows to a list, skipping words that list already has. */
export function addBulkToList(listId, rows) {
  return update(state => {
    const existing = new Set(
      state.words.filter(w => w.listId === listId).map(w => w.text.toLowerCase())
    );
    let added = 0, skipped = 0;
    for (const row of rows) {
      if (existing.has(row.text.toLowerCase())) { skipped++; continue; }
      existing.add(row.text.toLowerCase());
      state.words.push(makeWord(row.text, listId, row));
      added++;
    }
    return { added, skipped };
  });
}

/* ---------- Homophones ----------

   A spoken word alone cannot tell "their" from "there". Third grade lists
   are full of these, so any word in a homophone family always gets its
   example sentence read aloud with it. */

const HOMOPHONE_FAMILIES = [
  ['their', 'there', "they're"],
  ['to', 'too', 'two'],
  ['your', "you're"],
  ['its', "it's"],
  ['hear', 'here'],
  ['where', 'wear', 'were', 'ware'],
  ['which', 'witch'],
  ['right', 'write', 'rite'],
  ['knight', 'night'],
  ['know', 'no'],
  ['new', 'knew'],
  ['one', 'won'],
  ['son', 'sun'],
  ['sea', 'see'],
  ['be', 'bee'],
  ['blue', 'blew'],
  ['threw', 'through'],
  ['flour', 'flower'],
  ['hour', 'our'],
  ['made', 'maid'],
  ['mail', 'male'],
  ['main', 'mane'],
  ['meat', 'meet'],
  ['pair', 'pear', 'pare'],
  ['peace', 'piece'],
  ['plain', 'plane'],
  ['rain', 'reign', 'rein'],
  ['read', 'reed'],
  ['road', 'rode', 'rowed'],
  ['sail', 'sale'],
  ['scent', 'sent', 'cent'],
  ['some', 'sum'],
  ['stair', 'stare'],
  ['tail', 'tale'],
  ['weak', 'week'],
  ['wait', 'weight'],
  ['waist', 'waste'],
  ['bear', 'bare'],
  ['break', 'brake'],
  ['buy', 'by', 'bye'],
  ['cell', 'sell'],
  ['dear', 'deer'],
  ['die', 'dye'],
  ['eight', 'ate'],
  ['fair', 'fare'],
  ['for', 'four', 'fore'],
  ['great', 'grate'],
  ['heal', 'heel'],
  ['hi', 'high'],
  ['hole', 'whole'],
  ['not', 'knot'],
  ['past', 'passed'],
  ['steal', 'steel'],
  ['than', 'then'],
  ['threw', 'through'],
  ['toe', 'tow'],
  ['wood', 'would'],
];

const HOMOPHONES = new Set(HOMOPHONE_FAMILIES.flat());

export function isHomophone(word) {
  return HOMOPHONES.has(word.text.trim().toLowerCase());
}

/** Should the example sentence be spoken automatically with this word? */
export function shouldSpeakSentence(word) {
  const mode = settings().sentenceMode;
  if (!word.sentence) return false;
  if (mode === 'always') return true;
  if (mode === 'never') return false;
  return isHomophone(word);     // 'homophone' — the default
}

/** Words that need a sentence written for them before they are fair to ask. */
export function homophonesMissingSentences() {
  return allWords().filter(w => isHomophone(w) && !w.sentence.trim());
}

/* ---------- Summary for progress screens ---------- */

export function summary() {
  const words = allWords();
  const counts = { new: 0, learning: 0, practicing: 0, mastered: 0 };
  for (const w of words) counts[statusOf(w).key]++;
  return {
    total: words.length,
    ...counts,
    active: activeWords().length,
  };
}

/** Active words she misses most — the parent's "needs attention" list. */
export function troubleWords(limit = 10) {
  return activeWords()
    .filter(w => w.incorrectCount > 0)
    .sort((a, b) => {
      const ra = a.incorrectCount / Math.max(1, a.attempts);
      const rb = b.incorrectCount / Math.max(1, b.attempts);
      return (rb - ra) || (b.incorrectCount - a.incorrectCount);
    })
    .slice(0, limit);
}
