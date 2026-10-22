/* Breaking a word into the chunks it is spelled in.

   "Remember" is hard to spell as one lump of sound and easy as re-mem-ber.
   Chunking is how spelling is taught at her age, and the app could not do
   it: Show me read the word out and then spelled it letter by letter,
   which is the two ends of the scale with the useful middle missing.

   English does not divide by rule, it divides by convention, and no short
   function gets every word right. This one is built to be USEFUL RATHER
   THAN CORRECT:

     it only ever splits where there is a vowel on both sides, so no chunk
     is ever unsayable

     it keeps the pairs that spell one sound together — th, sh, ch, ck, ng,
     and the blends a syllable can start with, so "weather" is wea-ther and
     never weat-her

     and when it is not confident it returns the whole word, because the
     fallback is simply what the app did before.

   The output is spoken, never written. A child hears re-mem-ber; she is
   never shown a word cut into pieces that a teacher might split somewhere
   else.
*/

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y']);
const isVowel = ch => VOWELS.has(ch);

/* Two letters that spell one sound: never split between them. */
const DIGRAPHS = new Set(['th', 'sh', 'ch', 'ph', 'wh', 'ck', 'ng', 'gh', 'qu']);

/* Clusters a syllable is allowed to START with, so they move whole to the
   front of the next chunk: a-fraid, not af-raid. */
const ONSETS = new Set([
  'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sk',
  'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw', 'thr', 'str', 'spr', 'scr',
  'shr', 'spl', 'ch', 'sh', 'th', 'ph', 'wh',
]);

/* The ones that still hold together in the MIDDLE of a word. The s-blends
   do not: a word can start with st, but "listen" is lis-ten and never
   li-sten, and the same goes for mas-ter and whis-per. */
const MID_ONSETS = new Set([
  'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'tr', 'tw',
  'ch', 'sh', 'th', 'ph', 'wh',
]);

/**
 * @param {string} word
 * @returns {string[]} the chunks, or [word] when it will not split safely
 */
export function syllables(word) {
  const raw = String(word ?? '').trim();
  const w = raw.toLowerCase().replace(/[^a-z']/g, '');
  if (w.length < 4) return [raw];

  /* Alternating runs of vowels and consonants: the shape of the word. */
  const runs = [];
  for (const ch of w) {
    const kind = isVowel(ch) ? 'v' : 'c';
    if (runs.length && runs[runs.length - 1].kind === kind) runs[runs.length - 1].text += ch;
    else runs.push({ kind, text: ch });
  }
  const vowelRuns = runs.filter(r => r.kind === 'v').length;
  if (vowelRuns < 2) return [raw];

  /* Cut points, as indexes into the word. */
  const cuts = [];
  let at = 0;
  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    const start = at;
    at += run.text.length;
    if (run.kind !== 'c' || i === 0 || i === runs.length - 1) continue;

    const c = run.text;
    if (c.length === 1) {
      cuts.push(start);                                  // pa|per
    } else if (c.length === 2) {
      if (DIGRAPHS.has(c) || MID_ONSETS.has(c)) cuts.push(start);  // wea|ther, a|fraid
      else cuts.push(start + 1);                                   // let|ter, lis|ten
    } else {
      /* Longest cluster that can start a syllable goes with the next
         vowel; whatever is left closes the one before. */
      let onset = 0;
      for (let take = Math.min(3, c.length - 1); take >= 2; take--) {
        if (ONSETS.has(c.slice(c.length - take))) { onset = take; break; }
      }
      if (!onset && (DIGRAPHS.has(c.slice(-2)) || ONSETS.has(c.slice(-2)))) onset = 2;
      if (!onset) onset = 1;
      cuts.push(start + (c.length - onset));                    // mon|ster
    }
  }

  /* A word ending in a consonant plus le keeps that as its last chunk:
     whis-tle, ta-ble, mus-cle. Left to the rules above, the e looks silent
     and the whole ending gets folded back into the word. */
  if (/[^aeiouy]le$/.test(w) && w.length > 4) {
    const leCut = w.length - 3;
    /* And nothing may cut inside it, or the l comes away on its own. */
    for (let k = cuts.length - 1; k >= 0; k--) if (cuts[k] >= leCut) cuts.splice(k, 1);
    cuts.push(leCut);
  }
  cuts.sort((a, b) => a - b);

  if (!cuts.length) return [raw];

  const pieces = [];
  let from = 0;
  for (const cut of cuts) { pieces.push(w.slice(from, cut)); from = cut; }
  pieces.push(w.slice(from));

  /* A silent e on the end is not a chunk of its own: ca-ke is not a word
     anybody says. It goes back onto the piece before it — unless that
     piece ends in a consonant plus le, which is a real final chunk
     (whis-tle, ta-ble). */
  const merged = [];
  pieces.forEach((piece, idx) => {
    const last = merged[merged.length - 1];
    const needsVowel = !/[aeiouy]/.test(piece);
    const isLast = idx === pieces.length - 1;
    const silentE = isLast && /^[^aeiouy]*e$/.test(piece) && !/[^aeiouy]le$/.test(piece);
    if (last && (needsVowel || silentE)) merged[merged.length - 1] = last + piece;
    else merged.push(piece);
  });

  if (merged.length < 2) return [raw];
  if (merged.some(p => !/[aeiouy]/.test(p))) return [raw];

  /* Keep the original spelling, capitals and all. */
  const out = [];
  let i = 0;
  for (const piece of merged) { out.push(raw.slice(i, i + piece.length)); i += piece.length; }
  return out;
}

/** How many chunks a word has, for anything that wants to ask. */
export function syllableCount(word) {
  return syllables(word).length;
}
