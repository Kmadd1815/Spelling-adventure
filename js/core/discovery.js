/* "Hey! I found something!"

   Every so often, after she has finished a spelling session, the axolotl
   turns up with something it found. That is the whole feature.

   The rules it follows are the ones that keep it a nice surprise instead of
   a slot machine:

     It is never required. Nothing in the app is gated behind a discovery,
     nothing levels up because of one, and running out of things to find
     costs her nothing at all.

     At most one a day, so it stays an event rather than a drip.

     Only after real work — a couple of words does not summon a present.

     Never the same item twice. The pool empties, and when it is empty the
     axolotl simply stops finding things; it never says sorry about it.
*/

import { getState, update } from './state.js';
import { grantSpecial } from './rewards.js';
import { byId, owns } from './items.js';
import { dayKey } from './words.js';
import { pet } from './pet.js';

/** Things only the axolotl ever turns up. */
export const POOL = [
  'glow_jar', 'moon_shell', 'star_map', 'paper_boat', 'mushroom_stool', 'feather_cap',
];

/** How often it happens, when it is allowed to happen at all. */
export const CHANCE = 0.28;

/** Fewer words than this is not a session, and does not earn a surprise. */
const MIN_WORDS = 3;

export const stillOutThere = () => POOL.filter(id => !owns(id));

export function foundToday() {
  return getState().progress.lastDiscoveryDay === dayKey();
}

/**
 * Roll for a discovery at the end of an activity.
 *
 * @param {object} opts
 * @param {number} opts.attempted  how many words the session actually asked
 * @returns {object|null} the catalogue item she found, or null
 */
export function maybeDiscover({ attempted = 0 } = {}) {
  if (attempted < MIN_WORDS) return null;
  if (foundToday()) return null;

  const left = stillOutThere();
  if (!left.length) return null;
  if (Math.random() > CHANCE) return null;

  const id = left[Math.floor(Math.random() * left.length)];
  const record = grantSpecial(id, `${pet().name} found it`);
  if (!record) return null;

  update(state => { state.progress.lastDiscoveryDay = dayKey(); });
  return byId(id);
}

/** What the axolotl says when it turns up with something. */
const LINES = [
  'Hey! I found something!',
  'Look what I found!',
  'Psst — look at this.',
  'I found this while you were spelling.',
  'Guess what I found!',
];

export const discoveryLine = () => LINES[Math.floor(Math.random() * LINES.length)];
