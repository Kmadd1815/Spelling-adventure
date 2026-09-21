/* Stars, streaks and milestones.

   Two reward types, kept strictly apart:
     STARS        — ordinary currency, spent in the ordinary shop.
     SPECIAL ITEMS — earned only. Never purchasable, never priced.

   grantSpecial() is the only way a special item enters the collection,
   and it always records where it came from.
*/

import { getState, update } from './state.js';
import { emit } from './bus.js';
import { masteredWords, wordsInList, activeLists, isMastered, uid } from './words.js';

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
   Deliberately has no price field. A special item cannot be bought
   because there is nowhere to put a price on one. */

export function grantSpecial({ itemId, name, category = 'special', source, emoji = '✨' }) {
  return update(state => {
    const entry = {
      id: uid('own'),
      itemId,
      name,
      category,
      emoji,
      source,                    // human-readable: how she earned it
      earnedAt: Date.now(),
      special: true,
      equipped: false,
    };
    state.collection.items.push(entry);
    emit('special:granted', entry);
    return entry;
  });
}

export function ownedSpecials() {
  return getState().collection.items.filter(i => i.special);
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
    item: { itemId: 'sprout_charm', name: 'Little Sprout Charm', emoji: '\u{1F331}' },
    test: s => s.mastered >= 1 },

  { id: 'master_10',   title: '10 Words Mastered',    emoji: '\u{1F338}',
    blurb: 'Ten words, all yours.', stars: 25,
    item: { itemId: 'blossom_lamp', name: 'Blossom Lamp', emoji: '\u{1F3EE}' },
    test: s => s.mastered >= 10 },

  { id: 'master_25',   title: '25 Words Mastered',    emoji: '\u{1F31F}',
    blurb: 'Twenty-five words! That is a lot of practice.', stars: 50,
    item: { itemId: 'star_rug', name: 'Starlight Rug', emoji: '\u{1FA90}' },
    test: s => s.mastered >= 25 },

  { id: 'master_50',   title: '50 Words Mastered',    emoji: '\u{1F396}️',
    blurb: 'Fifty words mastered. Incredible.', stars: 100,
    item: { itemId: 'golden_quill', name: 'Golden Quill', emoji: '\u{1FAB6}' },
    test: s => s.mastered >= 50 },

  { id: 'master_100',  title: '100 Words Mastered',   emoji: '\u{1F451}',
    blurb: 'One hundred words. You are a word champion.', stars: 200,
    item: { itemId: 'champion_crown', name: 'Word Champion Crown', emoji: '\u{1F451}' },
    test: s => s.mastered >= 100 },

  { id: 'master_200',  title: '200 Words Mastered',   emoji: '\u{1F3F0}',
    blurb: 'Two hundred words! Your whole world grew.', stars: 400,
    item: { itemId: 'word_castle', name: 'Tiny Word Castle', emoji: '\u{1F3F0}' },
    test: s => s.mastered >= 200 },

  { id: 'streak_3',    title: '3 Days in a Row',      emoji: '\u{1F525}',
    blurb: 'Three days of practice in a row!', stars: 20,
    item: { itemId: 'cozy_candle', name: 'Cozy Candle', emoji: '\u{1F56F}️' },
    test: s => s.streak >= 3 },

  { id: 'streak_7',    title: 'A Whole Week',         emoji: '\u{1F525}',
    blurb: 'Seven days in a row. Wow.', stars: 60,
    item: { itemId: 'week_banner', name: 'Seven-Day Banner', emoji: '\u{1F3F5}️' },
    test: s => s.streak >= 7 },

  { id: 'streak_30',   title: 'Thirty Days',          emoji: '\u{1F31E}',
    blurb: 'A whole month of practice!', stars: 250,
    item: { itemId: 'sun_mobile', name: 'Sunbeam Mobile', emoji: '\u{1F31E}' },
    test: s => s.streak >= 30 },

  { id: 'first_list',  title: 'A List Completed',     emoji: '\u{1F4DA}',
    blurb: 'You mastered every word on a list!', stars: 75,
    item: { itemId: 'ribbon_shelf', name: 'Ribbon Shelf', emoji: '\u{1F380}' },
    test: s => s.completedLists >= 1 },

  { id: 'lists_5',     title: 'Five Lists Completed', emoji: '\u{1F3C6}',
    blurb: 'Five whole lists finished.', stars: 150,
    item: { itemId: 'trophy_shelf', name: 'Trophy Shelf', emoji: '\u{1F3C6}' },
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
    if (m.item) {
      grantSpecial({ ...m.item, category: 'milestone', source: m.title });
    }
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

/* ---------- Session payout ----------
   Effort is paid, not just perfection: every attempt earns something,
   correct answers earn more, and mastering a word earns a lot. */

export function payForSession({ correct = 0, attempted = 0, mastered = 0, isTest = false }) {
  const s = getState().settings;
  let total = 0;
  total += correct * s.starsPerCorrect;
  total += Math.max(0, attempted - correct) * s.starsPerTry;   // trying still counts
  total += mastered * s.starsPerMastery;
  if (attempted > 0) total += s.starsPerSession;
  if (isTest && attempted > 0) total += s.starsPerSession;     // finishing a test is a big deal

  awardStars(total, isTest ? 'test' : 'practice');
  return total;
}
