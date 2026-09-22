/* Stars, streaks and milestones.

   Two reward types, kept strictly apart:
     STARS        — ordinary currency, spent in the ordinary shop.
     SPECIAL ITEMS — earned only. Never purchasable, never priced.

   grantSpecial() is the only way a special item enters the collection,
   and it always records where it came from.
*/

import { getState, update } from './state.js';
import { emit } from './bus.js';
import { masteredWords, wordsInList, activeLists, isMastered } from './words.js';
import { grant as grantItem, byId as itemById, owns } from './items.js';

/* ---------- Stars ---------- */

export function stars() {
  return getState().progress.stars;
}

export function awardStars(amount, reason = '') {
  const n = Math.max(0, Math.round(amount));
  if (!n) return 0;
  update(state => { state.progress.stars += n; });
  emit('stars:awarded', { amount: n, reason });
  return n;
}

/** Returns false (and spends nothing) when she cannot afford it yet. */
export function spendStars(amount, reason = '') {
  const n = Math.max(0, Math.round(amount));
  if (getState().progress.stars < n) return false;
  update(state => { state.progress.stars -= n; });
  emit('stars:spent', { amount: n, reason });
  return true;
}

/* ---------- Special items ----------
   Awarded, never sold. They are catalogue entries with no price field at
   all, so there is nowhere for the shop to find a number to charge. */

export function grantSpecial(itemId, source) {
  const item = itemById(itemId);
  if (!item || item.price != null) {
    console.warn('[rewards] refusing to award a purchasable item as a prize:', itemId);
    return null;
  }
  const record = grantItem(itemId, source);
  if (record) emit('special:granted', { item, record });
  return record;
}

export function ownedSpecials() {
  return getState().collection.items
    .map(r => ({ ...itemById(r.itemId), record: r }))
    .filter(i => i.id && i.price == null);
}

/* ---------- Streaks ----------
   A streak is something to notice, never something to lose. Breaking one
   quietly starts a new one; nothing is taken away and nothing is said. */

export function todayKey(d = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}

/** Call once per completed activity. Returns { streak, isNewDay, isRecord }. */
export function touchStreak() {
  return update(state => {
    const today = todayKey();
    const p = state.progress;

    if (p.lastPracticeDay === today) {
      return { streak: p.currentStreak, isNewDay: false, isRecord: false };
    }

    p.currentStreak = p.lastPracticeDay === yesterdayKey() ? p.currentStreak + 1 : 1;
    p.lastPracticeDay = today;

    const isRecord = p.currentStreak > p.longestStreak;
    if (isRecord) p.longestStreak = p.currentStreak;

    return { streak: p.currentStreak, isNewDay: true, isRecord };
  });
}

/* ---------- Milestones ----------
   Each is checked against real accomplishments, never against time spent
   in the app. Add new ones by appending to this array. */

export const MILESTONES = [
  { id: 'first_word',  title: 'First Word Mastered',  emoji: '\u{1F331}',
    blurb: 'You mastered your very first word!', stars: 10,
    item: 'sprout_charm',
    test: s => s.mastered >= 1 },

  { id: 'master_10',   title: '10 Words Mastered',    emoji: '\u{1F338}',
    blurb: 'Ten words, all yours.', stars: 25,
    item: 'blossom_lamp',
    test: s => s.mastered >= 10 },

  /* The one milestone that is not a keepsake: it opens the garden. It sits
     at twenty rather than twenty-five so it gets a moment of its own —
     see core/garden.js, which works out whether the gate is open from her
     mastered words rather than from this flag. This just fires the
     celebration, once. */
  { id: 'garden_gate', title: 'The Garden Gate',      emoji: '\u{1F333}',
    blurb: 'Twenty words mastered — the door in your room opens onto a garden!',
    stars: 40,
    test: s => s.mastered >= 20 },

  { id: 'master_25',   title: '25 Words Mastered',    emoji: '\u{1F31F}',
    blurb: 'Twenty-five words! That is a lot of practice.', stars: 50,
    item: 'star_rug',
    test: s => s.mastered >= 25 },

  { id: 'master_50',   title: '50 Words Mastered',    emoji: '\u{1F396}️',
    blurb: 'Fifty words mastered. Incredible.', stars: 100,
    item: 'golden_quill',
    test: s => s.mastered >= 50 },

  { id: 'master_100',  title: '100 Words Mastered',   emoji: '\u{1F451}',
    blurb: 'One hundred words. You are a word champion.', stars: 200,
    item: 'champion_crown',
    test: s => s.mastered >= 100 },

  { id: 'master_200',  title: '200 Words Mastered',   emoji: '\u{1F3F0}',
    blurb: 'Two hundred words! Your whole world grew.', stars: 400,
    item: 'word_castle',
    test: s => s.mastered >= 200 },

  { id: 'streak_3',    title: '3 Days in a Row',      emoji: '\u{1F525}',
    blurb: 'Three days of practice in a row!', stars: 20,
    item: 'cozy_candle',
    test: s => s.streak >= 3 },

  { id: 'streak_7',    title: 'A Whole Week',         emoji: '\u{1F525}',
    blurb: 'Seven days in a row. Wow.', stars: 60,
    item: 'week_banner',
    test: s => s.streak >= 7 },

  { id: 'streak_30',   title: 'Thirty Days',          emoji: '\u{1F31E}',
    blurb: 'A whole month of practice!', stars: 250,
    item: 'sun_mobile',
    test: s => s.streak >= 30 },

  { id: 'first_list',  title: 'A List Completed',     emoji: '\u{1F4DA}',
    blurb: 'You mastered every word on a list!', stars: 75,
    item: 'ribbon_shelf',
    test: s => s.completedLists >= 1 },

  { id: 'lists_5',     title: 'Five Lists Completed', emoji: '\u{1F3C6}',
    blurb: 'Five whole lists finished.', stars: 150,
    item: 'trophy_shelf',
    test: s => s.completedLists >= 5 },
];

function milestoneStats() {
  const state = getState();
  const completedLists = activeLists().filter(l => {
    const words = wordsInList(l.id);
    return words.length > 0 && words.every(isMastered);
  }).length;

  return {
    mastered: masteredWords().length,
    streak: state.progress.currentStreak,
    completedLists,
    tests: state.progress.testsCompleted,
  };
}

/**
 * Checks every milestone and awards any newly reached ones.
 * Safe to call as often as you like — each milestone fires exactly once.
 * @returns {Array} the milestones earned on this call
 */
export function checkMilestones() {
  const stats = milestoneStats();
  const earnedIds = getState().progress.milestonesEarned;
  const freshlyEarned = [];

  for (const m of MILESTONES) {
    if (earnedIds.includes(m.id)) continue;
    if (!m.test(stats)) continue;

    update(state => { state.progress.milestonesEarned.push(m.id); });
    awardStars(m.stars, `milestone:${m.id}`);
    if (m.item) grantSpecial(m.item, m.title);
    freshlyEarned.push(m);
    emit('milestone:earned', m);
  }
  return freshlyEarned;
}

export function earnedMilestones() {
  const ids = getState().progress.milestonesEarned;
  return MILESTONES.filter(m => ids.includes(m.id));
}

export function nextMilestone() {
  const stats = milestoneStats();
  const ids = getState().progress.milestonesEarned;
  const remaining = MILESTONES.filter(m => !ids.includes(m.id) && m.id.startsWith('master_'));
  if (!remaining.length) return null;
  const target = remaining[0];
  const goal = Number(target.id.split('_')[1]);
  return { milestone: target, have: stats.mastered, goal };
}

/* ---------- Activity payout ----------

   Every activity returns an itemised list of what it paid and why, because
   "+37 stars" tells her nothing but "+15 spelling test, +17 words right on
   the first try, +5 perfect score" tells her exactly what the effort bought.
   Accuracy is visibly its own line, which is the whole point of paying for it.
*/

export const ACTIVITY = {
  daily:        { key: 'daily',        label: "Today's Practice" },
  practiceTest: { key: 'practiceTest', label: 'Practice test' },
  fullTest:     { key: 'fullTest',     label: 'Spelling test' },
  extra:        { key: 'extra',        label: 'Extra practice' },
};

/**
 * Work out and award the stars for a finished activity.
 *
 * @param {object} result
 * @param {string} result.kind             an ACTIVITY key
 * @param {number} result.firstTryCorrect  words right on the very first try
 * @param {number} result.attempted        words asked
 * @param {number} result.mastered         words that reached mastery here
 * @returns {{lines: Array<{label: string, stars: number}>, total: number}}
 */
export function payForActivity({ kind, firstTryCorrect = 0, attempted = 0, mastered = 0 }) {
  const s = getState().settings;
  const lines = [];
  const add = (label, stars) => { if (stars > 0) lines.push({ label, stars }); };

  const perfect = attempted > 0 && firstTryCorrect === attempted;

  if (kind === 'extra') {
    // Extra runs through words she has already done today are worth a
    // little, not nothing — but never as much as the day's real work.
    add(perfect ? 'Extra practice, all correct!' : 'Extra practice',
        perfect ? s.starsExtraClean : s.starsExtraTried);
  } else {
    const base = { daily: s.starsDaily, practiceTest: s.starsPracticeTest, fullTest: s.starsFullTest }[kind] || 0;
    add(`Finished ${ACTIVITY[kind]?.label || 'the activity'}`, base);
    add(`${firstTryCorrect} spelled right the first try`, firstTryCorrect * s.starsPerFirstTry);
    if (kind === 'fullTest' && perfect) add('Perfect score!', s.starsPerfectTest);
  }

  add(`${mastered} new ${mastered === 1 ? 'word' : 'words'} mastered`, mastered * s.starsPerMastery);

  const total = lines.reduce((sum, l) => sum + l.stars, 0);
  if (total > 0) awardStars(total, kind);
  return { lines, total };
}
