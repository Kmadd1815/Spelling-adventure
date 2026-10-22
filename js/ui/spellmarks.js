/* Drawing a missed word so the difference is the thing you see.

   core/spelldiff.js works out which letters matter; this puts them on the
   screen. Two rules, and they are the whole design:

     the CORRECT spelling lights the letters she did not get — the i she
     left out, the letter she swapped — in the colour the app uses for
     "right", because that is what those letters are

     HER TRY keeps every letter she wrote, with only the wrong ones struck
     through, and an empty slot where she left a letter out. Striking the
     whole attempt (which is what this used to do) says "all of that was
     wrong", and it almost never is: she had five letters of six. The slot
     matters as much as the strike — "fr_end" says a letter is missing
     and says where, which a word that is simply shorter does not.
*/

import { el } from './dom.js';
import { diffWord } from '../core/spelldiff.js';

/**
 * The word spelled correctly, with the letters she slipped on lit up.
 * @param {string} attempt
 * @param {string} target
 * @param {object} [opts]
 * @param {string} [opts.cls]  class for the wrapper
 * @param {string} [opts.tag]  'div' (default) or 'span' to sit in a line of text
 */
export function markedWord(attempt, target, { cls = 'correct-spelling', tag = 'div' } = {}) {
  const { target: marks } = diffWord(attempt, target);
  return el(tag, { class: `${cls} spell-marked`.trim(), 'aria-label': target },
    marks.map(m => el('span', {
      class: m.state === 'same' ? 'sp-ch' : 'sp-ch sp-mark',
      text: m.ch,
    }))
  );
}

/**
 * What she wrote, with the letters that were not in the word struck out.
 */
export function markedTry(attempt, target, { cls = 'your-try', tag = 'div' } = {}) {
  const { attempt: marks } = diffWord(attempt, target);
  return el(tag, { class: `${cls} spell-marked`.trim(), 'aria-label': `you wrote ${attempt}` },
    marks.map(m => {
      if (m.state === 'gap') return el('span', { class: 'sp-ch sp-gap', 'aria-hidden': 'true' });
      return el('span', {
        class: m.state === 'same' ? 'sp-ch' : 'sp-ch sp-bad',
        text: m.ch,
      });
    })
  );
}
