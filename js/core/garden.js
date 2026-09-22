/* The garden gate.

   The garden is the one part of the app she has to earn. Everything else is
   hers from the first launch and she decorates it with stars; this is a
   second place to be, and it opens at twenty mastered words — a good few
   weeks of real work for a third grader, since a word needs three correct
   answers in a row and only comes up once a session.

   Twenty rather than twenty-five: twenty-five already has a milestone of
   its own, and two celebrations landing on the same word would bury each
   other.

   There is no stored "garden unlocked" flag. Whether the gate is open is
   worked out from the mastered words every time it is asked, so it cannot
   drift out of step with her progress, survive a reset it should not have,
   or need a migration. The one thing that IS stored is the milestone that
   fires the celebration, and that lives with all the other milestones.
*/

import { masteredWords } from './words.js';

/** Mastered words needed before the door out of her room will open. */
export const GARDEN_AT = 20;

export function mastered() {
  return masteredWords().length;
}

/** Is the garden open to her yet? */
export function gardenOpen() {
  return mastered() >= GARDEN_AT;
}

/** How many more words to go. Zero once it is open. */
export function wordsToGo() {
  return Math.max(0, GARDEN_AT - mastered());
}

/**
 * What the axolotl says when she tries the door.
 * Never a refusal on its own — always a refusal with a number in it, so a
 * shut door reads as something to work towards rather than something
 * broken.
 */
export function gateLine() {
  const left = wordsToGo();
  if (left === 0) return 'Come outside with me!';
  if (left === 1) return 'One more mastered word and this door opens!';
  if (left <= 5)  return `Nearly! ${left} more mastered words and we can go outside.`;
  return `This door goes to the garden. ${left} more mastered words and it opens!`;
}
