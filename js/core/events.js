/* Seasonal and holiday events.

   An event sits ON TOP of the season rather than replacing it: October is
   still Fall, it just also has a Haunted Spelling Hunt in it. Everything
   about an event is data in the EVENTS list below, so next year's Halloween
   is a new entry with its own collectibles rather than a new screen.

   Three rules carried straight over from the design notes:

     Event items are earned during the event and never sold. They are
     ordinary special items — no price field — so the shop has nowhere to
     put a number on them even by accident.

     What she earns is hers for good. An event ending takes nothing away;
     it only stops new things being earned from it.

     Events pay their own small star allowance, budgeted separately from
     the mini-games, so a month of Halloween cannot quietly double what a
     day is worth.
*/

import { getState, update, settings } from './state.js';
import { awardStars, grantSpecial } from './rewards.js';
import { owns } from './items.js';
import * as words from './words.js';

/** Stars an event may pay in one day, on top of the games allowance. */
export const DAILY_CAP = 12;

/** What a second or later hunt on the same day is worth. */
const REPEAT_PAY = 1;

/**
 * The calendar.
 *
 * `from` and `to` are [month, day] with month 1-12, and `to` is the last
 * day the event runs, inclusive. `year` pins an event to one year, which
 * is what lets Halloween 2027 hand out a different set of things without
 * disturbing anything she earned in 2026.
 *
 * `rewards` are thresholds on the event's own counter. Crossing one grants
 * that special item once, for good.
 */
export const EVENTS = [
  /* Her birthday comes first in this list on purpose: if a grown-up sets it
     to a date that lands inside a holiday, the birthday wins. */
  {
    id: 'birthday',
    name: 'Birthday Week',
    emoji: '\u{1F382}',
    dynamic: 'birthday',        // window comes from the parent setting, not here
    theme: 'party',
    canMaster: true,
    blurb: 'It is your birthday week! Light a candle for every word you spell.',
    unitOne: 'candle', unitMany: 'candles', verb: 'lit',
    sprite: 'candle', scene: 'party',
    greeting: 'Happy birthday! Let us light them all.',
    pay: { base: 5, perUnit: 1 },
    /* A present of stars, once each birthday, however many years she plays. */
    yearlyGift: 50,
    rewards: [
      { at: 2,  item: 'birthday_cake' },
      { at: 5,  item: 'balloon_bunch' },
      { at: 9,  item: 'party_banner' },
      { at: 14, item: 'birthday_sash' },
    ],
  },

  {
    id: 'halloween_2026',
    name: 'Haunted Spelling Hunt',
    emoji: '\u{1F383}',
    year: 2026, from: [10, 1], to: [10, 31],
    theme: 'haunted',
    canMaster: true,
    blurb: 'Friendly ghosts got lost in the dark. Spell a word to light the way home for each one.',
    unitOne: 'ghost', unitMany: 'ghosts', verb: 'helped home',
    sprite: 'ghost', scene: 'haunted',
    greeting: 'Tap a ghost and help it home!',
    pay: { base: 4, perUnit: 1 },
    rewards: [
      { at: 2,  item: 'pumpkin_lantern' },
      { at: 5,  item: 'witch_hat' },
      { at: 9,  item: 'bat_garland' },
      { at: 14, item: 'candy_bucket' },
      { at: 20, item: 'ghost_friend' },
    ],
  },

  {
    id: 'thanksgiving_2026',
    name: 'Gathering Week',
    emoji: '\u{1F342}',
    year: 2026, from: [11, 20], to: [11, 30],
    theme: 'harvest',
    canMaster: true,
    blurb: 'The wind has scattered the leaves. Spell a word to gather each one up.',
    unitOne: 'leaf', unitMany: 'leaves', verb: 'gathered',
    sprite: 'leaf', scene: 'harvest',
    greeting: 'Let us gather the leaves before they blow away!',
    pay: { base: 4, perUnit: 1 },
    rewards: [
      { at: 2,  item: 'pumpkin_pie' },
      { at: 6,  item: 'acorn_hat' },
      { at: 11, item: 'leaf_wreath' },
      { at: 17, item: 'cornucopia' },
    ],
  },

  {
    id: 'christmas_2026',
    name: 'Trim the Tree',
    emoji: '\u{1F384}',
    year: 2026, from: [12, 1], to: [12, 26],
    theme: 'snowy',
    canMaster: true,
    blurb: 'The tree is bare. Spell a word to hang each ornament on it.',
    unitOne: 'ornament', unitMany: 'ornaments', verb: 'hung up',
    sprite: 'ornament', scene: 'snowy',
    greeting: 'Shall we decorate the tree together?',
    pay: { base: 4, perUnit: 1 },
    rewards: [
      { at: 3,  item: 'holiday_tree' },
      { at: 8,  item: 'stocking' },
      { at: 14, item: 'santa_hat' },
      { at: 22, item: 'snow_globe' },
    ],
  },

  {
    id: 'newyear_2027',
    name: 'Midnight Sparklers',
    emoji: '\u{1F386}',
    year: 2026, from: [12, 27], to: [1, 4],   // wraps into the new year
    theme: 'midnight',
    canMaster: true,
    blurb: 'A new year is starting. Spell a word to set off each sparkler.',
    unitOne: 'sparkler', unitMany: 'sparklers', verb: 'lit up the sky',
    sprite: 'firework', scene: 'midnight',
    greeting: 'Ready to light up the sky?',
    pay: { base: 4, perUnit: 1 },
    rewards: [
      { at: 2,  item: 'sparkler_jar' },
      { at: 6,  item: 'party_horn' },
      { at: 11, item: 'star_garland' },
      { at: 17, item: 'midnight_clock' },
    ],
  },

  {
    id: 'easter_2027',
    name: 'Spring Egg Hunt',
    emoji: '\u{1F430}',
    year: 2027, from: [3, 22], to: [3, 29],
    theme: 'spring',
    canMaster: true,
    blurb: 'Someone hid eggs all over the garden. Spell a word to open each one.',
    unitOne: 'egg', unitMany: 'eggs', verb: 'found',
    sprite: 'egg', scene: 'spring',
    greeting: 'Eggs everywhere! Which one first?',
    pay: { base: 4, perUnit: 1 },
    rewards: [
      { at: 2,  item: 'egg_basket' },
      { at: 6,  item: 'bunny_ears' },
      { at: 11, item: 'tulip_pot' },
      { at: 17, item: 'spring_wreath' },
    ],
  },
];

export const byId = id => EVENTS.find(e => e.id === id) || null;

/* ---------- The calendar ---------- */

const dayNumber = (month, day) => month * 100 + day;

/** Default birthday, if a grown-up has not set one. */
export const DEFAULT_BIRTHDAY = '11-07';
/** Days either side of the birthday that the week covers. */
const BIRTHDAY_SPAN = 3;

function parseBirthday(value) {
  const m = /^(\d{1,2})-(\d{1,2})$/.exec(String(value || '').trim());
  if (!m) return null;
  const month = Number(m[1]), day = Number(m[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { month, day };
}

/**
 * The window an event runs in, as [from, to].
 *
 * Most events carry their own dates. The birthday takes hers from the
 * parent setting, because a birthday belongs to the child rather than to
 * the calendar, and works it out by walking days either side — which keeps
 * it correct across a month or year boundary without any arithmetic about
 * how long February is.
 */
export function windowOf(event) {
  if (event.dynamic !== 'birthday') return [event.from, event.to];

  const parsed = parseBirthday(settings().birthday) || parseBirthday(DEFAULT_BIRTHDAY);
  // Any non-leap year does; only the month and day are used.
  const anchor = new Date(2001, parsed.month - 1, parsed.day);
  const at = offset => {
    const d = new Date(anchor);
    d.setDate(d.getDate() + offset);
    return [d.getMonth() + 1, d.getDate()];
  };
  return [at(-BIRTHDAY_SPAN), at(BIRTHDAY_SPAN)];
}

export function isLive(event, date = new Date()) {
  const [from, to] = windowOf(event);
  const today = dayNumber(date.getMonth() + 1, date.getDate());
  const start = dayNumber(...from), end = dayNumber(...to);

  /* A window whose end is earlier in the calendar than its start runs over
     the turn of the year — New Year's Eve into January. */
  const wraps = end < start;
  const inWindow = wraps ? (today >= start || today <= end) : (today >= start && today <= end);
  if (!inWindow) return false;

  if (!event.year) return true;            // recurring, like the birthday
  // For a wrapping window `year` is the year it starts in, so the tail of it
  // belongs to the year after.
  const wantYear = (wraps && today <= end) ? event.year + 1 : event.year;
  return date.getFullYear() === wantYear;
}

/** The event running right now, or null. */
export function liveEvent(date = new Date()) {
  return EVENTS.find(e => isLive(e, date)) || null;
}

/** Whole days left, counting today. Never negative. */
export function daysLeft(event, date = new Date()) {
  const [, to] = windowOf(event);
  const year = (dayNumber(...to) < dayNumber(date.getMonth() + 1, date.getDate()))
    ? date.getFullYear() + 1 : date.getFullYear();
  const end = new Date(year, to[0] - 1, to[1], 23, 59, 59);
  return Math.max(0, Math.ceil((end - date) / 86400000));
}

/** When an event next opens, as a Date, for sorting and for telling her. */
export function nextStart(event, date = new Date()) {
  const [from] = windowOf(event);
  const thisYear = new Date(date.getFullYear(), from[0] - 1, from[1]);
  if (event.year) return new Date(event.year, from[0] - 1, from[1]);
  return thisYear >= date ? thisYear
    : new Date(date.getFullYear() + 1, from[0] - 1, from[1]);
}

/** Everything not running now, soonest first, for the parent's calendar. */
export function upcoming(date = new Date()) {
  return EVENTS
    .filter(e => !isLive(e, date))
    .map(e => ({ e, at: nextStart(e, date) }))
    .filter(x => x.at >= new Date(date.getFullYear() - 1, 0, 1))
    .filter(x => !x.e.year || x.at >= date)
    .sort((a, b) => a.at - b.at)
    .map(x => x.e);
}

/* ---------- Her progress through an event ---------- */

function slot(state, eventId) {
  state.events = state.events || {};
  if (!state.events[eventId]) state.events[eventId] = { count: 0, claimed: [] };
  return state.events[eventId];
}

export function progress(eventId) {
  const saved = getState().events?.[eventId];
  return { count: saved?.count || 0, claimed: saved?.claimed || [] };
}

/** The next thing she is working towards, or null once they are all hers. */
export function nextReward(event) {
  const { count } = progress(event.id);
  return event.rewards.find(r => r.at > count) || null;
}

/**
 * Count one completed unit — a ghost sent home, an egg found.
 *
 * @returns {{count: number, earned: Array}} any special items this crossed
 */
export function addProgress(event, n = 1) {
  const earned = [];

  const count = update(state => {
    const mine = slot(state, event.id);
    mine.count += Math.max(0, n);
    return mine.count;
  });

  for (const reward of event.rewards) {
    if (count < reward.at) continue;
    if (progress(event.id).claimed.includes(reward.item)) continue;
    if (owns(reward.item)) continue;

    const record = grantSpecial(reward.item, `${event.name}, ${event.year}`);
    update(state => { slot(state, event.id).claimed.push(reward.item); });
    if (record) earned.push(reward.item);
  }

  return { count, earned };
}

/* ---------- Words ----------
   Exactly the pool practice uses, so an event is the same spelling work in
   a costume rather than a separate curriculum. */

export function eventWords(count = 5) {
  const active = words.pickWords({ count: count * 2, pool: 'active' });
  if (active.length >= count) return active.slice(0, count);

  const have = new Set(active.map(w => w.id));
  const topped = active.slice();
  for (const w of words.masteredWords()) {
    if (topped.length >= count) break;
    if (!have.has(w.id)) topped.push(w);
  }
  return topped;
}

/* ---------- Stars ----------
   Its own daily budget, so an event never eats into the games allowance
   and the two together still sit under a day of real practice. */

function today() { return words.dayKey(); }

export function todaysEventStars() {
  const day = getState().progress.eventDay;
  return day && day.day === today() ? day.stars : 0;
}

export function starsLeftToday() {
  return Math.max(0, DAILY_CAP - todaysEventStars());
}

/**
 * Pay for one finished round. Same itemised shape the activities and the
 * mini-games use, so the results card reads the same everywhere.
 */
export function scoreRound({ event, unitsWon = 0 }) {
  const payout = update(state => {
    const p = state.progress;
    if (!p.eventDay || p.eventDay.day !== today()) {
      p.eventDay = { day: today(), stars: 0, rounds: 0 };
    }
    const day = p.eventDay;
    const repeat = day.rounds > 0;
    const room = Math.max(0, DAILY_CAP - day.stars);
    day.rounds += 1;

    const lines = [];
    const add = (label, stars) => { if (stars > 0) lines.push({ label, stars }); };

    let want;
    if (repeat) {
      want = REPEAT_PAY;
      add(`Another go at the ${event.name}`, REPEAT_PAY);
    } else {
      add(`The ${event.name}`, event.pay.base);
      add(`${unitsWon} ${unitsWon === 1 ? event.unitOne : event.unitMany} ${event.verb}`,
          unitsWon * event.pay.perUnit);
      want = lines.reduce((sum, l) => sum + l.stars, 0);
    }

    let total = Math.min(want, room);
    const capped = total < want;
    if (capped) {
      let budget = total;
      for (const line of lines) {
        const take = Math.min(line.stars, budget);
        line.stars = take;
        budget -= take;
      }
    }
    day.stars += total;

    /* A birthday present is a present, so it is handed over whole and is
       not counted against the day's allowance. Once a year, every year. */
    let gift = 0;
    if (event.yearlyGift) {
      const year = new Date().getFullYear();
      const mine = slot(state, event.id);
      if (mine.giftYear !== year) {
        mine.giftYear = year;
        gift = event.yearlyGift;
        lines.push({ label: '\u{1F381} Happy birthday!', stars: gift });
      }
    }

    return { lines: lines.filter(l => l.stars > 0), total: total + gift, capped, repeat };
  });

  if (payout.total > 0) awardStars(payout.total, `event:${event.id}`);
  return payout;
}
