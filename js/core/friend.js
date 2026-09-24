/* The friend.

   At sixty mastered words an egg turns up on her bedroom floor. She taps
   it — it wobbles, it cracks, it cracks again — and on the fourth tap a
   duckling comes out. After that it follows the axolotl everywhere it
   goes: the room, the garden, and out under the word tree.

   WHY SHE CRACKS IT HERSELF. The obvious build is an egg that hatches on
   a timer, or on the next practice session. Both take the one moment that
   is properly hers and hand it to a clock. Four taps is the whole thing:
   no waiting, no "come back tomorrow", and the hatching happens in her
   hands. The taps are saved, so an egg left half-cracked at bedtime is
   still half-cracked in the morning — which is its own small pleasure.

   WHY A DUCKLING and not a second axolotl. A second axolotl is the same
   drawing again and reads as a copy. A duckling is round, small, obviously
   a different animal at any size, and it will have somewhere to swim when
   the pond arrives.

   The same rule as the pet applies here and is worth saying twice: this is
   a companion, never a chore. It has no hunger, no mood that decays, and
   nothing in this file can make it sad or take it away.
*/

import { getState, update } from './state.js';
import { masteredWords } from './words.js';

/** Mastered words before the egg turns up. */
export const FRIEND_AT = 60;

/** Taps to crack it open. */
export const TAPS_TO_HATCH = 4;

export const SPECIES = { key: 'duckling', name: 'Duckling', emoji: '\u{1F423}' };

/* Named after how they look rather than after people, so the suggestions
   are things a nine year old might actually pick. */
export const NAME_IDEAS = ['Pip', 'Butter', 'Nugget', 'Waddles', 'Sunny', 'Pebble'];

const blank = { crackedTaps: 0, hatchedAt: null, name: '', foundAt: null };

/** Her friend's state, with the defaults filled in for an older save. */
export function friend() {
  return { ...blank, ...(getState().friend || {}) };
}

export const mastered = () => masteredWords().length;

/** Has she earned the egg? Worked out from her mastered words every time,
    like the garden and the tree, so it cannot drift out of step.

    Once she has touched it, though, it is hers for good. A word can come
    back out of mastery — she misses it on a test and its run starts over —
    and without this an egg she had already cracked twice would quietly
    vanish off the floor because the count went from sixty to fifty-nine.
    Nothing in this app takes something away from her for getting a word
    wrong, and that includes a half-hatched egg. */
export const eggEarned = () => mastered() >= FRIEND_AT || !!friend().foundAt;
export const wordsToGo = () => Math.max(0, FRIEND_AT - mastered());

export const hasHatched = () => !!friend().hatchedAt;

/** The egg is on the floor when it has been earned and not yet hatched. */
export const eggWaiting = () => eggEarned() && !hasHatched();

/** 0, 1, 2 or 3 — how broken the egg looks. */
export function cracks() {
  return Math.min(TAPS_TO_HATCH - 1, friend().crackedTaps);
}

/** The name she gave it, or what to call it until she does. */
export function name() {
  return friend().name || SPECIES.name;
}

/**
 * One tap on the egg.
 * @returns {{cracks:number, hatched:boolean}} hatched is true on the tap
 *   that opened it, and only on that one.
 */
export function tapEgg() {
  if (!eggWaiting()) return { cracks: cracks(), hatched: false };

  return update(state => {
    const f = { ...blank, ...(state.friend || {}) };
    f.crackedTaps += 1;
    if (!f.foundAt) f.foundAt = Date.now();

    const hatched = f.crackedTaps >= TAPS_TO_HATCH;
    if (hatched) f.hatchedAt = Date.now();

    state.friend = f;
    return { cracks: Math.min(TAPS_TO_HATCH - 1, f.crackedTaps), hatched };
  });
}

export function setName(value) {
  update(state => {
    const f = { ...blank, ...(state.friend || {}) };
    f.name = String(value || '').trim().slice(0, 16);
    state.friend = f;
  });
}

/* ---------- What it says ----------

   Short, because it is small. It never asks her for anything. */

const EGG_LINES = [
  'An egg! Where did that come from?',
  'It wobbled. I definitely saw it wobble.',
  'Tap it again — something is in there.',
  'Nearly! One more.',
];

const PEEPS = [
  'Peep!', 'Peep peep!', '♪', 'Peeeep.', 'Peep?',
];

const FRIEND_LINES = [
  'follows you everywhere.',
  'is having a lovely time.',
  'likes it here.',
  'waddled after you.',
];

const pick = list => list[Math.floor(Math.random() * list.length)];

/** What the axolotl says about the egg, counting down as it cracks. */
export function eggLine() {
  return EGG_LINES[Math.min(EGG_LINES.length - 1, friend().crackedTaps)];
}

export const peep = () => pick(PEEPS);
export const friendLine = () => `${name()} ${pick(FRIEND_LINES)}`;

/** What the axolotl says at sixty words, before she has found the egg. */
export function arrivalLine() {
  return 'There is an egg on the floor! Tap it!';
}
