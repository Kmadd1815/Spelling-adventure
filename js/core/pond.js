/* The pond.

   The fourth place, and the only one that is properly HERS in the sense
   that it is where the animal belongs. An axolotl is not a land creature.
   It has spent this whole app standing on a rug being very pleased to see
   her, and at eighty mastered words it finally gets some water.

   That is also why the pond is worth building rather than being a third
   room with different wallpaper: everywhere else the axolotl walks along
   a line at the bottom of the picture. Here it swims — up, down, across,
   tail going — and a place where the animal moves differently is a
   different place. See swim() in ui/petlife.js.

   Eighty, and the ladder so far: the garden at twenty, the word tree at
   forty, the egg at sixty. Far enough apart that each one is a season's
   work, and none of them landing on a number that already has a keepsake
   milestone of its own.

   As with all the others there is NO stored "pond unlocked" flag. Whether
   the way down is open is worked out from her mastered words every time it
   is asked.
*/

import { masteredWords } from './words.js';

/** Mastered words before the path down to the water opens. */
export const POND_AT = 80;

export const mastered = () => masteredWords().length;
export const pondOpen = () => mastered() >= POND_AT;
export const wordsToGo = () => Math.max(0, POND_AT - mastered());

/** What the axolotl says at the top of the path. A shut way is never just
    refused — there is always a number on it. */
export function gateLine() {
  const left = wordsToGo();
  if (left === 0) return 'Down here! There is water!';
  if (left === 1) return 'One more mastered word and we can go down to the water!';
  if (left <= 5)  return `Nearly! ${left} more mastered words and we can go down to the water.`;
  return `That path goes down to a pond. ${left} more mastered words and we can go swimming!`;
}

/* ---------- What the axolotl says down there ----------

   More of it than the other places get, because this is the one it has
   been waiting for. */
const POND_LINES = [
  'This is the best place.',
  'I could stay in here all day.',
  'Watch me go all the way to the bottom!',
  'The water is just right.',
  'I am much better at swimming than walking.',
  'Blub.',
  'Did you see me do a loop?',
];

export const pondLine = () => POND_LINES[Math.floor(Math.random() * POND_LINES.length)];
