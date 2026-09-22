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

import { getState, update } from './state.js';
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
  {
    id: 'halloween_2026',
    name: 'Haunted Spelling Hunt',
    emoji: '\u{1F383}',
    year: 2026,
    from: [10, 1],
    to: [10, 31],
    theme: 'haunted',
    activity: 'ghosts',
    /* She hears a word and spells the whole thing with nothing to copy,
       exactly as in Today's Practice, so a hunt can add to a streak. As
       everywhere else, it can never take one away. */
    canMaster: true,
    blurb: 'Friendly ghosts got lost in the dark. Spell a word to light the way home for each one.',
    unitOne: 'ghost',
    unitMany: 'ghosts',
    pay: { base: 4, perUnit: 1 },
    rewards: [
      { at: 2,  item: 'pumpkin_lantern' },
      { at: 5,  item: 'witch_hat' },
      { at: 9,  item: 'bat_garland' },
      { at: 14, item: 'candy_bucket' },
      { at: 20, item: 'ghost_friend' },
    ],
  },
];

export const byId = id => EVENTS.find(e => e.id === id) || null;

/* ---------- The calendar ---------- */

function dayNumber(month, day) { return month * 100 + day; }

export function isLive(event, date = new Date()) {
  if (event.year && date.getFullYear() !== event.year) return false;
  const today = dayNumber(date.getMonth() + 1, date.getDate());
  return today >= dayNumber(...event.from) && today <= dayNumber(...event.to);
}

/** The event running right now, or null. */
export function liveEvent(date = new Date()) {
  return EVENTS.find(e => isLive(e, date)) || null;
}

/** Whole days left, counting today. Never negative. */
export function daysLeft(event, date = new Date()) {
  const end = new Date(date.getFullYear(), event.to[0] - 1, event.to[1], 23, 59, 59);
  return Math.max(0, Math.ceil((end - date) / 86400000));
}

/** The next event that has not happened yet, for the parent's calendar. */
export function upcoming(date = new Date()) {
  return EVENTS
    .filter(e => !isLive(e, date))
    .filter(e => !e.year || e.year > date.getFullYear() ||
      (e.year === date.getFullYear() &&
        dayNumber(date.getMonth() + 1, date.getDate()) < dayNumber(...e.from)))
    .sort((a, b) => (a.year - b.year) || (dayNumber(...a.from) - dayNumber(...b.from)));
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
      add(`${unitsWon} ${unitsWon === 1 ? event.unitOne : event.unitMany} helped home`,
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

    return { lines: lines.filter(l => l.stars > 0), total, capped, repeat };
  });

  if (payout.total > 0) awardStars(payout.total, `event:${event.id}`);
  return payout;
}
