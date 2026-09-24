/* The Word Tree.

   The second thing she earns, and the first that is not decorated with
   stars. Every word she masters grows a leaf with the word written on it.
   Nothing here is bought and nothing can be arranged: the tree is made
   entirely out of work she has already done, and the only way to make it
   bigger is to learn another word.

   That is the point of it. Until now a mastered word left the practice
   pool and became a number in the Parent Area — twenty words of real
   effort with nothing to show for them. This is the something to show.

   FORTY WORDS, not fifty. Fifty already has a keepsake milestone of its
   own and two celebrations landing on the same word bury each other,
   which is the same reason the garden opens at twenty rather than
   twenty-five.

   As with the garden there is NO stored "tree unlocked" flag. Whether the
   gate is open is worked out from her mastered words every time it is
   asked, so it cannot drift out of step with her progress or survive a
   reset it should not have.
*/

import { masteredWords, reviewDue } from './words.js';

/** Mastered words needed before the gate at the end of the garden opens. */
export const TREE_AT = 40;

export const mastered = () => masteredWords().length;
export const treeOpen = () => mastered() >= TREE_AT;
export const wordsToGo = () => Math.max(0, TREE_AT - mastered());

/** What the axolotl says at the gate. Never a refusal without a number in
    it, so a shut gate reads as something to work towards. */
export function gateLine() {
  const left = wordsToGo();
  if (left === 0) return 'Come and see your tree!';
  if (left === 1) return 'One more mastered word and the gate opens!';
  if (left <= 5)  return `Nearly! ${left} more mastered words and we can go through.`;
  return `There is a tree through that gate with your words on it. ` +
         `${left} more mastered words and it opens!`;
}

/* ---------- Which leaf is which ----------

   Oldest first, so leaf 0 is always the very first word she mastered and
   a new word always arrives on the outside. A word with no timestamp —
   only possible on a save from before mastery was dated — sorts to the
   front by id so it still has a fixed place rather than shuffling about
   every time the screen opens.
*/
export function leafWords() {
  return masteredWords().slice().sort((a, b) =>
    (a.masteredAt || 0) - (b.masteredAt || 0) || (a.id < b.id ? -1 : 1));
}

/* ---------- Where the leaves go ----------

   A phyllotactic spiral: the angle between one leaf and the next is the
   golden angle, which is what a real plant does and the reason no two
   leaves end up in a line. Two properties matter here and both come free:

     the arrangement is EVEN at every count, with no gaps or clumps, so
     the canopy looks right at 40 words and at 400

     leaf i is at the same place whatever N is, so mastering a word adds a
     leaf rather than rearranging the tree she looked at yesterday

   The canopy is wider than it is tall, because a tree is.
*/
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));   // 137.5 degrees
const SPACING = 7.1;        // how far apart the rings sit, in tree units
/* Exported because the drawing has to make the foliage exactly the shape
   the leaves are arranged in, and a second copy of these two numbers over
   there would drift. */
export const SPREAD = { x: 1.28, y: 0.78 };
const SPREAD_X = SPREAD.x;  // canopy wider than tall
const SPREAD_Y = SPREAD.y;

/** The canopy's radius in tree units — grows with the square root of the
    count, because area is what has to grow, not width. */
export const canopyRadius = n => SPACING * Math.sqrt(Math.max(1, n));

/**
 * Leaf positions in tree units, centred on (0, 0).
 * @returns {Array<{x:number,y:number,i:number}>}
 */
export function leafLayout(count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    /* +0.6 keeps the first leaf off the exact centre, where it would sit
       on the trunk. */
    const r = SPACING * Math.sqrt(i + 0.6);
    const a = i * GOLDEN_ANGLE;
    out.push({ i, x: r * Math.cos(a) * SPREAD_X, y: r * Math.sin(a) * SPREAD_Y });
  }
  return out;
}

/**
 * How much to shrink the whole tree so a canopy of `count` leaves fits the
 * frame. One over the tree rather than per leaf: the leaves keep their
 * proportions and the picture reads as standing further back from a bigger
 * tree, which is what is actually happening.
 *
 * @param {number} count
 * @param {object} frame  half-width and half-height available, in scene units
 */
export function canopyScale(count, { fitX = 62, fitY = 29 } = {}) {
  const r = canopyRadius(count);
  return Math.min(1, fitX / Math.max(1, r * SPREAD_X), fitY / Math.max(1, r * SPREAD_Y));
}

/* ---------- What a leaf knows ----------

   A leaf that is due for a review is marked, but marked as something to
   CHECK rather than something lost. She has not lost the word — the app
   has simply not asked her about it for a month — and a tree that turned
   her old words brown would teach her that working is a treadmill.
*/
export function leaves() {
  const words = leafWords();
  const spots = leafLayout(words.length);
  return words.map((word, i) => ({
    id: word.id,
    text: word.text,
    at: word.masteredAt || null,
    due: reviewDue(word),
    ...spots[i],
  }));
}

/** A plain-English date for the tap card, written to sit after the word
    "Mastered" — so it comes back lower case, and a month keeps its capital
    because a month is a name. */
export function whenMastered(at) {
  if (!at) return 'a while ago';
  const days = Math.floor((Date.now() - at) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'last week';
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return `in ${new Date(at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`;
}
