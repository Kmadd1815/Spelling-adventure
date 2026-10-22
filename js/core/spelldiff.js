/* Where it actually went wrong.

   A missed word used to be shown as two plain words, one above the other:

       frend
       friend

   and a child was left to find the difference herself. Often she does not.
   Two words that are nearly the same look the same to an eight-year-old at
   a glance, so the moment that should teach her something teaches her that
   she got it wrong and no more.

   This lines the two spellings up and says which letters are the ones that
   matter: the i she left out, the e she put in the wrong place. The screen
   can then light exactly those letters, and her eye goes to the part worth
   looking at.

   It is a plain edit alignment (the Levenshtein table, walked backwards).
   Spelling words are a dozen letters at the most, so the cost of it is
   nothing, and unlike a letter-by-letter comparison it copes with a
   missing letter without calling the whole rest of the word wrong —
   "frend" against "friend" is one missing i, not five letters out of
   place.
*/

/**
 * @typedef {{ ch: string, state: 'same'|'wrong'|'missing'|'extra' }} Mark
 *   same    — she got this letter right
 *   wrong   — she wrote a different letter here
 *   missing — this letter belongs in the word and she left it out
 *   extra   — she wrote this letter and the word does not have it
 *   gap     — stands in her attempt where a missing letter should have been,
 *             so her own spelling can show the hole rather than just being
 *             shorter than the answer. Carries no letter.
 */

/**
 * Line her attempt up against the word.
 * @param {string} attempt
 * @param {string} target
 * @returns {{ attempt: Mark[], target: Mark[], same: boolean, slips: number }}
 */
export function diffWord(attempt, target) {
  const a = String(attempt ?? '');
  const b = String(target ?? '');
  const al = a.toLowerCase();
  const bl = b.toLowerCase();

  if (al === bl) {
    return {
      attempt: [...a].map(ch => ({ ch, state: 'same' })),
      target: [...b].map(ch => ({ ch, state: 'same' })),
      same: true,
      slips: 0,
    };
  }

  const n = al.length, m = bl.length;
  const d = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) d[i][0] = i;
  for (let j = 0; j <= m; j++) d[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = al[i - 1] === bl[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }

  /* Walked from the end, taking the diagonal wherever it is as cheap as
     anything else: that keeps letters paired up with the letter they were
     meant to be, rather than reading a swap as a delete and an insert. */
  const attemptOut = [], targetOut = [];
  let i = n, j = m, slips = 0;
  while (i > 0 || j > 0) {
    const sub = i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (al[i - 1] === bl[j - 1] ? 0 : 1);
    if (sub) {
      const same = al[i - 1] === bl[j - 1];
      attemptOut.unshift({ ch: a[i - 1], state: same ? 'same' : 'wrong' });
      targetOut.unshift({ ch: b[j - 1], state: same ? 'same' : 'wrong' });
      if (!same) slips += 1;
      i -= 1; j -= 1;
    } else if (j > 0 && d[i][j] === d[i][j - 1] + 1) {
      targetOut.unshift({ ch: b[j - 1], state: 'missing' });
      attemptOut.unshift({ ch: '', state: 'gap' });
      slips += 1;
      j -= 1;
    } else {
      attemptOut.unshift({ ch: a[i - 1], state: 'extra' });
      slips += 1;
      i -= 1;
    }
  }

  return { attempt: attemptOut, target: targetOut, same: false, slips };
}

/** True when the only thing wrong is one letter. */
export function oneLetterOut(attempt, target) {
  return diffWord(attempt, target).slips === 1;
}
