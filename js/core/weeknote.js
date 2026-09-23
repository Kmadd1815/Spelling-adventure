/* The week in three sentences.

   The Parent Area can already answer any question you care to ask it: how
   many words, which ones are stuck, what she did on Tuesday. What it could
   not do was answer the question actually being asked at nine o'clock on a
   school night, which is "is this working?"

   So: three sentences at the top, no charts, no tapping through.

     1. Did she turn up, and how often.
     2. What she learned.
     3. What is still catching her out.

   Rules this follows, because a weekly note that overstates is worse than
   none at all:

     - It counts DAYS SHE PRACTISED, never days missed. The streak works
       that way and so does this; a week off for half term is not a fact
       about her spelling.
     - It never claims a word is mastered that is not.
     - When there is nothing to say it says so plainly, rather than
       reaching for something encouraging.
*/

import { getState } from './state.js';
import * as words from './words.js';

const DAY = 86400000;
const TESTS = new Set(['practiceTest', 'fullTest', 'paperTest']);

/** "a, b and c", or "a, b, c and 2 others" — said the way it would be
    said out loud, because these go into the middle of a sentence. */
export function listOut(items, limit = 3) {
  const shown = items.slice(0, limit);
  const extra = items.length - shown.length;
  if (!shown.length) return '';
  if (extra > 0) return `${shown.join(', ')} and ${extra} other${extra === 1 ? '' : 's'}`;
  if (shown.length === 1) return shown[0];
  return `${shown.slice(0, -1).join(', ')} and ${shown[shown.length - 1]}`;
}

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * @param {number} [span] how many days back to look. A week by default.
 * @returns {{sentences: string[], practised: number, mastered: string[], stuck: string[]}}
 */
export function weekNote(span = 7) {
  const state = getState();
  const since = Date.now() - span * DAY;

  /* ---------- 1. turning up ---------- */
  const recent = (state.sessions || []).filter(s => s.at >= since);
  const days = new Set(recent.map(s => words.dayKey(new Date(s.at))));
  const tests = recent.filter(s => TESTS.has(s.mode)).length;

  let turningUp;
  if (!days.size) {
    turningUp = span === 7
      ? 'She has not practised this week yet.'
      : `She has not practised in the last ${plural(span, 'day')}.`;
  } else {
    turningUp = `She practised on ${plural(days.size, 'day')}` +
                (span === 7 ? ' this week' : ` in the last ${plural(span, 'day')}`);
    turningUp += tests ? `, with ${plural(tests, 'spelling test')}.` : '.';
  }

  /* ---------- 2. what she learned ---------- */
  const mastered = state.words
    .filter(w => w.masteredAt && w.masteredAt >= since)
    .sort((a, b) => a.masteredAt - b.masteredAt)
    .map(w => w.text);

  /* One or two more goes and they are hers. */
  const threshold = words.threshold();
  const close = words.activeWords()
    .filter(w => w.streak > 0 && threshold - w.streak <= 2)
    .sort((a, b) => b.streak - a.streak)
    .map(w => w.text);

  let learned;
  if (mastered.length) {
    /* Sentences never START with one of her words: a spelling word given a
       capital letter is a spelling word shown wrong. */
    learned = `She mastered ${plural(mastered.length, 'new word')}: ${listOut(mastered)}.`;
    if (close.length) learned += ` Nearly there too: ${listOut(close, 2)}.`;
  } else if (close.length) {
    learned = `Nothing was mastered this week, but ${listOut(close, 3)} ` +
              `${close.length === 1 ? 'is' : 'are'} one or two goes away.`;
  } else if (days.size) {
    learned = 'Nothing was mastered this week — these are early days with these words.';
  } else {
    learned = 'Nothing was mastered, because nothing was practised.';
  }

  /* ---------- 3. what is catching her out ---------- */
  const stuck = words.activeWords()
    .filter(w => w.lastMissed && w.lastMissed >= since)
    .sort((a, b) => {
      const ra = a.incorrectCount / Math.max(1, a.attempts);
      const rb = b.incorrectCount / Math.max(1, b.attempts);
      return (rb - ra) || (b.incorrectCount - a.incorrectCount);
    })
    .map(w => w.text);

  let catching;
  if (!words.activeWords().length) {
    catching = 'There is nothing left on her list — time for next week’s words.';
  } else if (stuck.length) {
    catching = `Still catching her out: ${listOut(stuck, 3)}.`;
  } else if (days.size) {
    catching = 'Nothing is stuck: everything she tried this week, she got.';
  } else {
    const waiting = words.activeWords().length;
    catching = `${plural(waiting, 'word')} ${waiting === 1 ? 'is' : 'are'} waiting for her.`;
  }

  return {
    sentences: [turningUp, learned, catching],
    practised: days.size,
    tests,
    mastered,
    stuck: stuck.slice(0, 3),
  };
}
